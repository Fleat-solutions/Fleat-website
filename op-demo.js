/* FLEAT : scénario animé de l'interface opérateur (page solution, section 03) */
(function () {
  'use strict';

  var mock = document.getElementById('op-mock');
  if (!mock) return;
  var route = document.getElementById('op-route');
  var trace = document.getElementById('op-trace');
  var drone = document.getElementById('op-drone');
  var cap = document.getElementById('op-cap');
  var ctrl = document.querySelector('.op-ctrl');
  var playBtn = ctrl.querySelector('.op-play');
  var stepBtns = Array.prototype.slice.call(ctrl.querySelectorAll('[data-go]'));
  var t = {};
  mock.querySelectorAll('[data-t]').forEach(function (el) { t[el.getAttribute('data-t')] = el; });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Horloge simulée : secondes après 02:14:00. Arrivée sur zone 40 s après l'alerte. */
  var STEPS = {
    1: { dur: 2600, zone: 'alert', vid: 'standby', tel: 'idle', state: 'En station', chip: ['warn', 'Nouvelle alerte'], clock: [6, 8], alt: [0, 0], bat: [98, 98], fly: [0, 0],
         cap: ['Alerte.', 'Une alarme périmétrique se déclenche en zone C.'] },
    2: { dur: 4200, zone: 'alert', vid: 'route', tel: 'move', state: 'En route', chip: ['warn', 'Levée de doute en cours'], clock: [8, 46], alt: 'up', bat: [98, 96], fly: [0, 1],
         cap: ['Départ.', 'Le drone décolle de sa station et rejoint la zone.'] },
    3: { dur: 2800, zone: 'alert', vid: 'live', tel: 'ok', state: 'Sur zone', chip: ['warn', 'Levée de doute en cours'], clock: [46, 56], alt: [45, 45], bat: [96, 95], fly: [1, 1],
         cap: ['Sur zone.', 'Arrivée en 40 s environ. Le flux vidéo s’affiche.'] },
    4: { dur: 3800, zone: 'alert', vid: 'live', zoom: 1, tel: 'ok', state: 'Sur zone', chip: ['warn', 'Levée de doute en cours'], clock: [56, 72], alt: [45, 45], bat: [95, 95], fly: [1, 1],
         cap: ['Vérification.', 'L’opérateur observe la scène en thermique et zoome si besoin.'] },
    5: { dur: 3600, zone: 'ok', vid: 'live', zoom: 1, decided: 1, tel: 'ok', state: 'Sur zone', chip: ['ok', 'Traitée'], clock: [72, 76], alt: [45, 45], bat: [94, 94], fly: [1, 1],
         cap: ['Décision.', 'L’opérateur lève le doute. L’événement est tracé dans l’historique.'] },
    6: { dur: 3400, zone: 'ok', vid: 'end', decided: 1, tel: 'move', state: 'Retour station', chip: ['ok', 'Traitée'], clock: [76, 108], alt: 'down', bat: [94, 92], fly: [1, 0],
         cap: null }
  };
  var MSG = {
    standby: ['DRONE EN STATION', 'Flux disponible en vol'],
    route: ['CONNEXION AU FLUX', 'En route vers la zone C'],
    end: ['MISSION TERMINÉE', 'Retour à la station']
  };

  /* Points de la trajectoire, en pourcentage du plan (viewBox 600 x 400) */
  var len = route.getTotalLength();
  var SAMPLES = 60;
  var pts = [];
  for (var i = 0; i <= SAMPLES; i++) {
    var p = route.getPointAtLength(len * i / SAMPLES);
    pts.push([p.x, p.y]);
  }
  function pointAt(f) {
    var x = f * SAMPLES, k = Math.min(SAMPLES - 1, Math.floor(x)), r = x - k;
    return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * r, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * r];
  }

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var lerp = function (a, b, f) { return a + (b - a) * f; };
  var ease = function (f) { return f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; };
  function setText(key, v) { if (t[key] && t[key].textContent !== v) t[key].textContent = v; }

  var lastStep = null;
  function render(n, f) {
    var s = STEPS[n];
    if (n !== lastStep) {
      lastStep = n;
      mock.setAttribute('data-step', n === 6 ? '5' : String(n));
      mock.setAttribute('data-zone', s.zone);
      mock.setAttribute('data-vid', s.vid);
      mock.setAttribute('data-zoom', s.zoom ? '1' : '0');
      mock.setAttribute('data-decided', s.decided ? '1' : '0');
      mock.setAttribute('data-tel', s.tel);
      setText('state', s.state);
      t.chip.className = 'schip ' + s.chip[0];
      setText('chiptxt', s.chip[1]);
      if (MSG[s.vid]) { setText('msg', MSG[s.vid][0]); setText('msg2', MSG[s.vid][1]); }
      if (s.cap) cap.innerHTML = '<b>' + s.cap[0] + '</b>' + s.cap[1];
      stepBtns.forEach(function (b, j) {
        if (j + 1 === Math.min(n, 5)) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.style.setProperty('--p', 0);
      });
    }
    var active = stepBtns[Math.min(n, 5) - 1];
    active.style.setProperty('--p', n === 6 ? 1 : f);

    var sec = Math.round(lerp(s.clock[0], s.clock[1], f));
    setText('clock', '02:' + pad(14 + Math.floor(sec / 60)) + ':' + pad(sec % 60));
    var since = Math.max(0, sec - 6);
    setText('chrono', pad(Math.floor(since / 60)) + ':' + pad(since % 60));
    var alt = s.alt === 'up' ? 45 * Math.min(1, f * 4) : s.alt === 'down' ? 45 * Math.min(1, (1 - f) * 4) : s.alt[0];
    setText('alt', Math.round(alt) + ' m');
    setText('bat', Math.round(lerp(s.bat[0], s.bat[1], f)) + ' %');

    var fly = lerp(s.fly[0], s.fly[1], ease(f));
    var d = pointAt(fly);
    drone.style.left = (d[0] / 6) + '%';
    drone.style.top = (d[1] / 4) + '%';
    var upto = n === 1 ? 0 : n === 2 ? fly : 1;
    var out = [];
    for (var j = 0; j <= SAMPLES && j / SAMPLES <= upto; j++) out.push(pts[j].join(','));
    if (upto > 0) out.push(d.join(','));
    if (n !== 6) trace.setAttribute('points', out.join(' '));
  }

  /* Lecture : auto = boucle continue, sinon l'étape choisie se joue une fois */
  var step = 1, elapsed = 0, start = 0, raf = 0, auto = !reduced, visible = false, done = false;

  function frame(now) {
    var s = STEPS[step];
    elapsed = now - start;
    var f = Math.min(1, elapsed / s.dur);
    render(step, f);
    if (f < 1) { raf = requestAnimationFrame(frame); return; }
    if (auto) {
      step = step === 6 ? 1 : step + 1;
      if (step === 1) trace.setAttribute('points', '');
      elapsed = 0; start = now;
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0; done = true;
    }
  }
  function run() {
    if (raf || !visible || document.hidden || done) return;
    start = performance.now() - elapsed;
    raf = requestAnimationFrame(frame);
  }
  function halt() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function go(n) {
    halt();
    step = n; elapsed = 0; done = false;
    if (n === 1) trace.setAttribute('points', '');
    if (reduced) { render(n, 1); done = true; return; }
    run();
  }
  function setAuto(on) {
    auto = on;
    var ico = playBtn.querySelectorAll('path');
    ico[0].style.display = on ? 'none' : '';
    ico[1].style.display = on ? '' : 'none';
    playBtn.setAttribute('aria-label', on ? 'Mettre en pause l’animation' : 'Lancer l’animation');
  }

  stepBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      cap.setAttribute('aria-live', 'polite');
      setAuto(false);
      go(+b.getAttribute('data-go'));
    });
  });
  playBtn.addEventListener('click', function () {
    if (auto) { setAuto(false); halt(); return; }
    setAuto(true);
    if (done) go(step === 5 ? 6 : step === 6 ? 1 : step + 1); else run();
  });

  ctrl.hidden = false;
  setAuto(auto);
  if (reduced) { render(5, 1); done = true; }
  else render(1, 0);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) run(); else halt();
    }, { threshold: 0.3 }).observe(mock);
  } else {
    visible = true; run();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) halt(); else run();
  });
})();
