# Motion design · FLEAT

Animations 3D des cartes « Le dispositif » de la page Solution, et leur rendu en vidéo.
Ce dossier n'est pas publié sur le site (voir `.vercelignore`).

## Contenu

| Fichier | Rôle |
|---|---|
| `station.html` | Scène 3D (three.js) de la carte « La station » : dock, drone, site industriel, boucle de 12 s |
| `render.js` | Rendu image par image dans Chromium, puis encodage avec ffmpeg |
| `out/` | Images et vidéos générées (non versionnées) |

## État de la carte « La station » (validé)

- Dock à l'échelle du Dock 3 : caisson 640 × 585 mm, module RTK 160 mm à l'arrière, hauteur 485 mm au caisson, 625 mm capot fermé.
- Capot rectangulaire en deux moitiés, charnières sur les arêtes supérieures, ouverture à 180° de chaque côté.
- Drone à l'échelle du Matrice 4D, hélices bipales, nacelle caméra, feux de navigation.
- Décor « site industriel » : dalle béton, clôture à bavolet, cuves avec cuvette de rétention, rack de tuyauterie.
- Cadrage : plan large (option A).
- Scénario : en charge, ouverture, décollage, fermeture, mission, retour, atterrissage, recharge.
- Format retenu pour le site : vidéo en boucle (WebM et MP4, image d'attente WebP), chargée quand la carte devient visible.

Prochaines étapes : retravailler la vidéo, puis cartes « Le drone » (ronde vue de haut, bascule thermique) et « La plateforme » (écran de supervision).

## Lancer le rendu sur sa machine

Prérequis : Node 18 ou plus, ffmpeg installé (`brew install ffmpeg` sur Mac).

```bash
cd motion
npm install
npx playwright install chromium
npm run sheet
npm run video
```

`npm run sheet` produit des images clés dans `out/` pour vérifier la scène.
`npm run video` produit `out/station.mp4`, `out/station.webm` et `out/station-poster.webp`.

Pour voir l'animation en direct, servir le dossier avec un serveur local qui expose `/styles.css` (racine du repo) et `/three/` (`node_modules/three/build`). Le plus simple reste `npm run sheet`.
