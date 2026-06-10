# FLEAT — Supervision drone connectée

Site vitrine pour **FLEAT**, une solution de supervision drone intégrée aux systèmes de sécurité existants.

## À propos

FLEAT aide les entreprises à renforcer la surveillance de leurs sites grâce à :
- **Levée de doute** rapide après alerte (< 60s)
- **Rondes automatiques** sur des zones définies
- **Supervision multi-sites** centralisée
- **Intégration** aux systèmes de sécurité existants

## Démarrage rapide

### Prérequis
- Python 3.x (ou un autre serveur HTTP)
- Un navigateur web moderne

### Installation

1. **Clonez ou téléchargez** le projet
2. **Naviguez** dans le répertoire :
   ```bash
   cd C:\Users\romai\Desktop\Fleat-website
   ```

### Lancer le site

#### Avec Python (recommandé)
```bash
python -m http.server 8000
```
Puis ouvrez : **http://localhost:8000**

#### Avec Node.js
```bash
npx http-server -p 8000
```

#### Directement dans le navigateur
Double-cliquez sur `index.html`

## Structure du projet

```
Fleat-website/
├── index.html              # Page d'accueil
├── solution.html           # Détails de la solution
├── cas-usage.html          # Cas d'usage
├── secteurs.html           # Secteurs d'activité
├── integrations.html       # Partenaires intégrés
├── faq.html                # Questions fréquentes
├── contact.html            # Formulaire de contact
├── rappel.html             # Demande de rappel
├── styles.css              # Feuille de styles
├── site.js                 # Interactions JavaScript
├── assets/                 # Logos et images
│   ├── fleat-logo.png
│   ├── fleat-logo-white.png
│   └── fleat-mark.png
└── README.md               # Ce fichier
```

## Fonctionnalités

- Design responsif (mobile, tablet, desktop)
- Animations au scroll fluides
- Mockup interactif de l'interface de supervision
- Navigation mobile avec menu hamburger
- Formulaires validés (contact, rappel)
- Banneau cookies RGPD conforme
- SEO optimisé (meta tags, schema.org)

## Design System

Le site utilise un système de design cohérent :
- **Couleurs** : Bleu nuit (#0a1a3d) + Accent bleu (#2f62ea)
- **Typographie** : Archivo (display) + Hanken Grotesk (texte)
- **Espacements** : Système de variables CSS fluides

## Technologies

- **HTML5** sémantique
- **CSS3** avec variables personnalisées
- **JavaScript vanilla** (pas de dépendances)
- **Responsive design** (mobile-first)

## Pages incluses

| Page | Description |
|------|-------------|
| `index.html` | Accueil avec hero, bénéfices, cas d'usage |
| `solution.html` | Détails techniques de la solution |
| `cas-usage.html` | 6 scénarios concrets d'utilisation |
| `secteurs.html` | Industries cibles + modales |
| `integrations.html` | Partenaires et intégrations |
| `faq.html` | Questions fréquentes avec accordéon |
| `contact.html` | Formulaire de contact |
| `rappel.html` | Demande de rappel téléphonique |

## Responsive

- **Desktop** : Expérience complète avec navigation
- **Tablet** : Ajustements de grille et espacements
- **Mobile** : Menu hamburger, colonnes simples

## Accessibilité

- ARIA labels sur les éléments interactifs
- Navigation au clavier fonctionnelle
- Respect des préférences `prefers-reduced-motion`
- Contraste suffisant (WCAG AA)

## Licence

© 2026 FLEAT. Tous droits réservés.

---

**Questions ?** Contactez-nous : contact@fleat.fr
