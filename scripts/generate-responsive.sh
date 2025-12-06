#!/bin/bash
# Script de génération d'images responsives
# Prérequis: brew install imagemagick webp

set -e

SRC_DIR="src/images"
SIZES="320 640 1024 1920"
QUALITY=80
WEBP_QUALITY=80

# Vérifier les dépendances
if ! command -v magick &> /dev/null; then
    echo "ImageMagick n'est pas installé. Installez-le avec:"
    echo "  brew install imagemagick"
    exit 1
fi

if ! command -v cwebp &> /dev/null; then
    echo "cwebp n'est pas installé. Installez-le avec:"
    echo "  brew install webp"
    exit 1
fi

echo "Génération des images responsives..."

# Fonction pour générer les variantes
generate_variants() {
    local file="$1"
    local dir=$(dirname "$file")
    local filename=$(basename "$file")
    local name="${filename%.*}"
    local ext="${filename##*.}"

    # Ignorer les fichiers déjà redimensionnés (contenant -XXXw)
    if [[ "$name" =~ -[0-9]+w$ ]]; then
        return
    fi

    # Obtenir la largeur originale
    local orig_width=$(magick identify -format "%w" "$file" 2>/dev/null)

    if [ -z "$orig_width" ]; then
        echo "  Erreur: impossible de lire $file"
        return
    fi

    echo "Processing: $file (${orig_width}px)"

    for size in $SIZES; do
        # Ne pas agrandir les images
        if [ "$size" -ge "$orig_width" ]; then
            continue
        fi

        local output_jpg="$dir/${name}-${size}w.jpg"
        local output_webp="$dir/${name}-${size}w.webp"

        # Générer JPG redimensionné
        if [ ! -f "$output_jpg" ]; then
            magick "$file" -resize "${size}x>" -quality $QUALITY "$output_jpg"
            echo "  Created: $output_jpg"
        fi

        # Générer WebP redimensionné
        if [ ! -f "$output_webp" ]; then
            cwebp -q $WEBP_QUALITY "$output_jpg" -o "$output_webp" 2>/dev/null
            echo "  Created: $output_webp"
        fi
    done

    # Générer WebP de l'original si pas déjà fait
    local orig_webp="$dir/${name}.webp"
    if [ ! -f "$orig_webp" ]; then
        cwebp -q $WEBP_QUALITY "$file" -o "$orig_webp" 2>/dev/null
        echo "  Created: $orig_webp"
    fi
}

# Traiter les images principales
echo ""
echo "=== Photos galerie ==="
for file in "$SRC_DIR"/photos/photo[0-9][0-9].jpg; do
    [ -f "$file" ] && generate_variants "$file"
done

echo ""
echo "=== Images spotlight (pic) ==="
for file in "$SRC_DIR"/pic[0-9][0-9].jpg; do
    [ -f "$file" ] && generate_variants "$file"
done

echo ""
echo "Génération terminée!"
