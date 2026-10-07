# FLEAT · Supervision drone connectée

Site vitrine de **FLEAT** : rondes de surveillance automatisées par drone, connectées aux systèmes de sécurité existants.

## Lancer le site en local

Prérequis : Node.js.

```bash
npx http-server -p 8000
```

Puis ouvrir **http://localhost:8000**.

## Structure du projet

```
Fleat-website/
├── index.html              # Accueil
├── solution.html           # Fonctionnement de la solution
├── cas-usage.html          # Cas d'usage
├── secteurs.html           # Secteurs d'activité
├── integrations.html       # Compatibilité avec les systèmes de sécurité
├── faq.html                # Questions fréquentes
├── about.html              # À propos
├── contact.html            # Formulaire « Étudier mon site »
├── rappel.html             # Demande de rappel
├── mentions-legales.html
├── confidentialite.html
├── 404.html
├── styles.css              # Feuille de styles commune
├── site.js                 # Interactions (menu, formulaires, cookies, apparitions)
├── assets/                 # Logos et images locales
├── robots.txt, sitemap.xml # SEO
├── CLAUDE.md               # Règles de rédaction du site
├── CREDITS.md              # Crédits des photos Unsplash
├── design-references/      # DESIGN.md de référence (Tesla, Vercel, Stripe, Apple, SpaceX)
└── scraps/                 # Explorations de design, hors site
```

## Design

- **Couleurs** : bleu nuit `#0a1a3d`, encre `#0f1b33`, accent bleu `#2f62ea`.
- **Typographie** : Archivo (titres), Hanken Grotesk (texte), IBM Plex Mono (libellés).
- **Photos** : Unsplash, chargées depuis leur CDN (voir `CREDITS.md`).

## Technologies

- HTML, CSS et JavaScript sans framework ni étape de build.
- [Motion](https://motion.dev) 14.0.0 chargé par CDN pour les animations.

## Règles de rédaction

Voir `CLAUDE.md` : pas de tiret cadratin ni demi-cadratin, phrases courtes, ton factuel, pas d'emoji.

## Licence

© 2026 FLEAT. Tous droits réservés.

Contact : contact@fleat-solutions.com
