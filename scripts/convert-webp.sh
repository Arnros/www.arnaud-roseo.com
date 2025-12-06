#!/bin/bash
# Script de conversion des images en WebP
# Prérequis: brew install webp

if ! command -v cwebp &> /dev/null; then
    echo "cwebp n'est pas installé. Installez-le avec:"
    echo "  brew install webp"
    exit 1
fi

SRC_DIR="src/images"
QUALITY=80

echo "Conversion des images en WebP..."

for file in $(find "$SRC_DIR" -name "*.jpg" -type f); do
    webp_file="${file%.jpg}.webp"
    if [ ! -f "$webp_file" ]; then
        echo "Conversion: $file"
        cwebp -q $QUALITY "$file" -o "$webp_file"
    fi
done

for file in $(find "$SRC_DIR" -name "*.png" -type f); do
    webp_file="${file%.png}.webp"
    if [ ! -f "$webp_file" ]; then
        echo "Conversion: $file"
        cwebp -q $QUALITY "$file" -o "$webp_file"
    fi
done

echo "Conversion terminée!"
