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
├── assets/                 # Images optimisées servies par le site
├── brand/                  # Originaux haute définition (logos, photos), non publiés
├── robots.txt, sitemap.xml # SEO
├── CLAUDE.md               # Règles de rédaction du site
├── CREDITS.md              # Crédits des photos Unsplash
├── design-references/      # DESIGN.md de référence (Tesla, Vercel, Stripe, Apple, SpaceX)
├── scraps/                 # Explorations de design, hors site
├── scripts/                # Contrôles CI (rédaction, liens)
├── vercel.json             # En-têtes HTTP Vercel
└── .github/workflows/      # CI GitHub Actions
```

## Branches et déploiement

| Branche | Rôle | Déploiement Vercel |
|---|---|---|
| `dev` | Développement, branche par défaut | Preview |
| `staging` | Préproduction, recette | Preview (domaine de préprod) |
| `main` | Production | Production (fleat-solutions.com) |

- Les changements passent par PR : `dev` vers `staging`, puis `staging` vers `main`. La CI refuse tout autre sens.
- La CI (`.github/workflows/ci.yml`) vérifie les règles de rédaction, les liens internes et le HTML.
- Hors du domaine de production, Vercel envoie `X-Robots-Tag: noindex` : la préprod n'est pas indexée.
- `.vercelignore` exclut du déploiement les fichiers de travail (`scraps/`, `design-references/`, docs).

Lancer les contrôles en local :

```bash
node scripts/check-redaction.mjs && node scripts/check-links.mjs && npx html-validate ./*.html
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
