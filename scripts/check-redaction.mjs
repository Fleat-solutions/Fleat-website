// Applique les règles de CLAUDE.md : aucun tiret cadratin ni demi-cadratin dans les fichiers du site.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(html|css|js|mjs|md|xml|txt|json|ya?ml)$/.test(f))
  .filter((f) => !/^(design-references|scraps)\//.test(f) && f !== 'CLAUDE.md');

const errors = [];
for (const file of files) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/[\u2013\u2014]/.test(line)) errors.push(`${file}:${i + 1} : ${line.trim().slice(0, 120)}`);
  });
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} ligne(s) avec un tiret cadratin ou demi-cadratin. Voir CLAUDE.md.`);
  process.exit(1);
}
console.log(`${files.length} fichiers vérifiés, aucun tiret interdit.`);
