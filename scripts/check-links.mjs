// Vérifie les liens internes des pages HTML : fichier cible présent et ancre (#id) existante.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';

const root = process.cwd();
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const ids = new Map();

function idsOf(file) {
  if (!ids.has(file)) {
    const html = readFileSync(join(root, file), 'utf8');
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return ids.get(file);
}

const errors = [];
for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  for (const [, attr, raw] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (!raw || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(raw)) continue;
    const [path, hash] = raw.split('#');
    const target = path ? normalize(join(path.startsWith('/') ? '' : dirname(page), path.split('?')[0])).replace(/^\//, '') : page;
    if (!existsSync(join(root, decodeURIComponent(target)))) {
      errors.push(`${page} : ${attr}="${raw}" pointe vers un fichier absent`);
    } else if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) {
      errors.push(`${page} : ${attr}="${raw}" pointe vers une ancre absente`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} lien(s) interne(s) cassé(s).`);
  process.exit(1);
}
console.log(`${pages.length} pages vérifiées, aucun lien interne cassé.`);
