// Rendu de l'animation 3D de la station (motion/station.html) image par image, puis encodage vidéo.
// Usage :
//   node render.js sheet 0.5 2.4 3.8   planche d'images clés aux instants donnés (secondes)
//   node render.js video               boucle complète : out/station.mp4, out/station.webm, out/station-poster.webp
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const HERE = __dirname, ROOT = path.join(HERE, '..'), OUT = path.join(HERE, 'out');
const THREE = path.join(HERE, 'node_modules', 'three');
const DURATION = 12, FPS = 30, POSTER_T = 3.8;
const [mode = 'video', ...times] = process.argv.slice(2);

function resolve(url) {
  const u = new URL(url).pathname;
  if (u === '/styles.css') return path.join(ROOT, 'styles.css');
  if (u.startsWith('/three/addons/')) return path.join(THREE, 'examples', 'jsm', u.slice('/three/addons/'.length));
  if (u.startsWith('/three/')) return path.join(THREE, 'build', u.slice('/three/'.length));
  return path.join(HERE, path.basename(u));
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 440 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.error('Erreur dans la page :', e.message));
  await page.route('http://local/**', route => {
    const f = resolve(route.request().url());
    route.fulfill(fs.existsSync(f) ? { path: f, contentType: f.endsWith('.js') ? 'text/javascript' : undefined } : { status: 404, body: '' });
  });
  await page.route(/^https?:\/\/(?!local\/)/, route => route.abort());
  await page.goto('http://local/station.html');
  await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
  await page.evaluate(() => { window.__fleatFrozen = true; });

  const card = page.locator('.kv');
  const at = t => page.evaluate(t => window.fleatStationRender(t), t);
  fs.mkdirSync(OUT, { recursive: true });

  if (mode === 'sheet') {
    for (const t of times.map(Number)) { await at(t); await card.screenshot({ path: path.join(OUT, `k-${t.toFixed(1)}.png`) }); }
    console.log(`${times.length} images clés dans ${OUT}`);
  } else {
    const frames = path.join(OUT, 'frames');
    fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
    const n = DURATION * FPS;
    for (let i = 0; i < n; i++) {
      await at(i / FPS);
      await card.screenshot({ path: path.join(frames, `f-${String(i).padStart(4, '0')}.png`) });
      if (i % 60 === 0) console.log(`image ${i} / ${n}`);
    }
    await at(POSTER_T); await card.screenshot({ path: path.join(OUT, 'poster.png') });
    const input = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f-%04d.png')];
    execFileSync('ffmpeg', [...input, '-vf', 'scale=840:-2,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', path.join(OUT, 'station.mp4')]);
    execFileSync('ffmpeg', [...input, '-vf', 'scale=840:-2', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', path.join(OUT, 'station.webm')]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(OUT, 'poster.png'), '-vf', 'scale=840:-2', '-quality', '80', path.join(OUT, 'station-poster.webp')]);
    console.log(`Vidéos et image d'attente dans ${OUT}`);
  }
  await browser.close();
})();
