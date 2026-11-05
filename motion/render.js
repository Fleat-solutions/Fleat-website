// Rendu d'une animation 3D (motion/<scène>.html) image par image, puis encodage vidéo.
// Scène choisie par la variable SCENE : station (par défaut) ou drone-card.
// Usage :
//   node render.js sheet 0.5 2.4 3.8   planche d'images clés aux instants donnés (secondes)
//   node render.js video               boucle complète : out/<scène>.mp4 et out/<scène>-poster.webp
//   SCENE=drone-card node render.js video
// Un seul MP4 (H.264, lu partout) : le WebM ne pesait pas moins lourd sur cette scène.
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const HERE = __dirname, ROOT = path.join(HERE, '..'), OUT = path.join(HERE, 'out');
const THREE = path.join(HERE, 'node_modules', 'three');
const SCENE = process.env.SCENE || 'station';
const DURATION = { station: 12, 'drone-card': 16 }[SCENE], FPS = 24, POSTER_T = { station: 3.8, 'drone-card': 14.6 }[SCENE], WIDTH = 640;
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
  /* seules les polices Google passent, pour que le texte des vidéos soit rendu avec les polices du site */
  await page.route(/^https?:\/\/(?!local\/|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/)/, route => route.abort());
  await page.goto(`http://local/${SCENE}.html`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => ['Inter', 'IBM Plex Mono'].map(f => f + ' : ' + document.fonts.check(`600 12px "${f}"`)));
  console.log('Polices', fonts.join(', '));
  await page.evaluate(() => { window.__fleatFrozen = true; });

  const card = page.locator('.kv');
  const at = t => page.evaluate(t => (window.fleatRender || window.fleatStationRender)(t), t);
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
    execFileSync('ffmpeg', [...input, '-vf', `scale=${WIDTH}:-2,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-tune', 'animation', '-movflags', '+faststart', path.join(OUT, `${SCENE}.mp4`)]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(OUT, 'poster.png'), '-vf', `scale=${WIDTH}:-2`, '-quality', '80', path.join(OUT, `${SCENE}-poster.webp`)]);
    console.log(`Vidéo et image d'attente dans ${OUT}`);
  }
  await browser.close();
})();
