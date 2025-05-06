# GeoQuizz - Jeu du Chemin entre Pays

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg)
![HTML5](https://img.shields.io/badge/HTML-5-orange.svg)
![CSS3](https://img.shields.io/badge/CSS-3-blue.svg)
![MVC](https://img.shields.io/badge/Architecture-MVC-green.svg)
![Accessibility](https://img.shields.io/badge/Accessibilit%C3%A9-ARIA-purple.svg)

Une application web monopage avec une carte du monde interactive et des mini-jeux. Le premier jeu implémenté est "Chemin entre Pays", où les joueurs doivent trouver des chemins valides entre des pays sélectionnés au hasard.

## Fonctionnalités

- 🗺️ Carte du monde SVG interactive rendue sur Canvas HTML5
- 🎮 Mini-jeu "Chemin entre Pays" avec vérification d'adjacence
- 🎨 Interface de style pixel-art / 16 bits
- 📱 Conception réactive pour différentes tailles d'écran
- ♿ Prise en charge de l'accessibilité avec les labels ARIA et le mode à contraste élevé
- 🏗️ Architecture MVC propre utilisant les modules ES

## Comment Jouer

1. Cliquez sur le bouton "Jouer à Chemin entre Pays" pour démarrer une nouvelle partie.
2. Deux pays seront sélectionnés : un point de départ et une destination.
3. Entrez les pays un par un pour créer un chemin valide entre eux.
4. Chaque pays doit être adjacent au précédent.
5. Atteignez le pays de destination pour gagner !

## Exécution Locale

```bash
# Clonez le dépôt
git clone <url-du-depot>
cd geoquizz

# Si Python est installé
python -m http.server

# Ou en utilisant http-server de Node.js (nécessite une installation)
npx http-server

# Ou tout autre serveur de fichiers statiques
live-server
```

Ensuite, ouvrez votre navigateur à l'adresse http://localhost:8000 (ou le port fourni par votre serveur).

## Structure du Projet

```
projet/
│
├─ assets/
│  └─ world.svg        # Carte vectorielle utilisée comme plateau de jeu
│
├─ src/
│  ├─ controllers/
│  │   └─ GameController.js
│  ├─ models/
│  │   └─ MapModel.js
│  ├─ views/
│  │   ├─ CanvasView.js
│  │   └─ MenuView.js
│  ├─ main.js          # Point d'entrée – relie l'architecture MVC
│  └─ style.css
│
├─ index.html
└─ README.md
```

## Implémentation Technique

- **Architecture MVC Pure**: Séparation claire des préoccupations avec les modules ES.
- **Rendu Canvas**: Rendu SVG vers Canvas efficace avec des opérations sur les chemins 2D.
- **Graphe d'Adjacence**: Logique de connectivité des pays pour la validation des chemins.
- **Conception Réactive**: S'adapte aux différentes tailles d'écran et types d'appareils.
- **Accessibilité**: Labels ARIA et prise en charge du mode à contraste élevé.

### Chargement du SVG dans le Canvas

Le rendu de la carte du monde SVG sur un élément Canvas HTML5 est une étape clé de l'application. Cela est accompli en suivant plusieurs étapes :
1.  **Chargement du fichier SVG**: L'application récupère d'abord le fichier `world.svg` (situé dans `assets/`).
2.  **Analyse du SVG (Parsing)**: Le contenu du fichier SVG, qui est au format XML, est analysé pour extraire les informations pertinentes. Plus précisément, nous nous intéressons aux éléments `<path>` qui définissent les frontières de chaque pays.
3.  **Extraction des données de chemin**: Pour chaque pays, les attributs `d` (définition du chemin) et `id` (identifiant du pays) sont extraits des éléments `<path>`.
4.  **Dessin sur le Canvas**: En utilisant l'API de dessin 2D du Canvas (`CanvasRenderingContext2D`), chaque chemin de pays est dessiné. L'objet `Path2D` est utilisé pour construire les formes à partir des données de chemin SVG. Cela permet des opérations telles que le remplissage (`fill()`) et le tracé (`stroke()`) des frontières des pays, ainsi que la détection des clics sur des pays spécifiques (`isPointInPath()`).

Cette approche permet de bénéficier de la scalabilité et de la précision des graphiques vectoriels SVG tout en utilisant la puissance de l'API Canvas pour le rendu interactif et les animations.

## Améliorations Futures

- Nous utilisions un canvas pour l'image du jeu "Find the place" à l'origine, finalement pour des problèmes de praticité l'image est render normalement (HTML image with CSS styling), il serait donc possible d'a nouveau implémenter un meilleur moyen de render ces images avec canvas
- Compteur de temps et suivi du score
- Plusieurs niveaux de difficulté
- Effets sonores et musique de fond
- Meilleurs temps enregistrés dans localStorage
- Mini-jeux supplémentaires (Quiz des Capitales, Course aux Frontières, etc.)

## Licence

La carte du monde SVG est fournie par Simplemaps.com sous licence MIT.

 :P
---

Développé avec JavaScript vanilla, HTML5 et CSS3.
