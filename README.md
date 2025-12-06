# Site Arnaud Roséo

Site officiel d'Arnaud Roséo - Pilote karting KZ2
https://www.arnaud-roseo.com

## Prérequis

- [Node.js](https://nodejs.org/) (v18+)
- npm

## Installation

```bash
npm install
```

## Développement

Lancer le serveur de développement :

```bash
npm run serve
```

Le site sera disponible sur `http://localhost:8080`

## Build

Générer le site statique :

```bash
npm run build
```

Le site sera généré dans le dossier `_site/`

## Structure

```
src/
├── _data/          # Données globales (site.json, navigation.json)
├── _includes/      # Composants réutilisables (nav, footer, contact)
├── _layouts/       # Templates de base
├── assets/         # CSS et JS
├── data/           # Données dynamiques (resultats.json)
├── images/         # Images (JPG, PNG, WebP)
└── *.njk           # Pages du site
```

## Ajouter des résultats

1. Éditer `src/data/resultats.json`
2. Rebuilder le site

## Conversion WebP

Pour convertir les nouvelles images en WebP :

```bash
brew install webp
./scripts/convert-webp.sh
```

## Déploiement

Le site est déployé automatiquement sur GitHub Pages via GitHub Actions.
