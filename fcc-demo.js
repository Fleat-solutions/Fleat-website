/* FLEAT Control Center · démo interactive de levée de doute (page solution, section 03) */
(function () {
  'use strict';

  var root = document.getElementById('fcc');
  if (!root) return;
  var wrap = root.parentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 900px)');

  var F = {};
  wrap.querySelectorAll('[data-f]').forEach(function (el) { F[el.getAttribute('data-f')] = el; });
  var route = document.getElementById('fcc-route');
  var trail = document.getElementById('fcc-trail');
  var drone = document.getElementById('fcc-drone');
  var modal = root.querySelector('.fcc-modal');
  var motifBtns = Array.prototype.slice.call(root.querySelectorAll('[data-motif]'));
  var okBtn = root.querySelector('.fcc-m-ok');

  /* Trajet station > zone C, échantillonné (viewBox 1000 x 600) */
  var N = 60, pts = [], len = route.getTotalLength();
  for (var i = 0; i <= N; i++) { var q = route.getPointAtLength(len * i / N); pts.push([q.x, q.y]); }
  function at(f) {
    var x = f * N, k = Math.min(N - 1, Math.floor(x)), r = x - k;
    return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * r, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * r];
  }
  function placeDrone(f) {
    var p = at(f);
    drone.style.left = (p[0] / 10) + '%';
    drone.style.top = (p[1] / 6) + '%';
    return p;
  }
  function drawTrail(f) {
    if (f <= 0) { trail.setAttribute('points', ''); return; }
    var out = [];
    for (var j = 0; j <= N && j / N <= f; j++) out.push(pts[j].join(','));
    out.push(at(f).join(','));
    trail.setAttribute('points', out.join(' '));
  }

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var ease = function (f) { return f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; };
  function txt(k, v) { if (F[k] && F[k].textContent !== v) F[k].textContent = v; }
  function set(k, v) { root.setAttribute('data-' + k, v); }

  /* Horloge simulée : l'alerte arrive à 02:14:06, le vol de 40 s est joué en 7 s */
  var BASE = 2 * 3600 + 14 * 60 + 6;
  var FLIGHT_MS = reduced ? 0 : 7000, RTH_MS = reduced ? 0 : 5000, FLIGHT_SIM = 40;
  function clock(s) { s = Math.floor(BASE + s); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); }

  var S;
  function reset() {
    S = { state: 'idle', st: 'new', sim: 0, pos: 0, flight: null, rth: null, motif: '', t2: null, t3: null, userActed: false };
    set('state', 'idle'); set('st', 'new'); set('ctx', '0'); set('video', '0'); set('hud', '0');
    set('flown', '0'); set('zoom', '0'); set('hover', '0'); set('hudst', 'run'); set('nal', '0');
    F.barVid.disabled = true;
    placeDrone(0); drawTrail(0);
    txt('fly', '0'); txt('nmis', '0'); txt('nal', '0'); txt('alt', '0 m'); txt('alt2', '0 m');
    txt('status', 'Nouvelle'); txt('hudStT', 'En cours'); txt('rem', '420 m'); txt('eta', '40 s');
    txt('act', 'Décollage'); txt('pct', '0 %'); txt('bat', '98 %'); F.progBar.style.width = '0';
    F.ta.textContent = 'Ex. fausse alarme, incident résolu, contrôle effectué sur place…'; F.ta.classList.remove('on');
    motifBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    okBtn.disabled = true;
    guide();
  }

  function go(state) { S.state = state; set('state', state); guide(); }

  function alertIn() {
    S.sim = 0;
    set('nal', '1'); txt('nal', '1'); txt('recv', clock(0)); txt('t1', clock(0));
    go('alert');
  }

  /* ── Guidage : texte sous la démo + halo sur le bouton à cliquer ── */
  var hinted = null;
  function hint(el) {
    if (hinted === el) return;
    if (hinted) hinted.classList.remove('fcc-hint');
    hinted = el;
    if (el) {
      el.classList.add('fcc-hint');
      if (S.userActed && mobile.matches) {
        var r = el.getBoundingClientRect();
        if (r.top < 70 || r.bottom > window.innerHeight - 20) el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      }
    }
  }
  function guide() {
    var ctxOpen = root.getAttribute('data-ctx') === '1', vid = root.getAttribute('data-video') === '1';
    var n = '', t = '', h = null, q = function (s) { return root.querySelector(s); };
    switch (S.state) {
      case 'idle': n = '0/5'; t = 'Site Nord sous surveillance. Une alarme va remonter.'; break;
      case 'alert': n = '1/5'; t = 'Une alarme intrusion remonte de la caméra 12. Cliquez sur <b>Traiter</b>.'; h = q('.fcc-btn-go'); break;
      case 'panel': n = '2/5'; t = 'Le détail de l’alerte s’affiche. Envoyez le drone : <b>Reconnaissance</b>.'; h = ctxOpen ? q('.fcc-a-go') : F.barAl; break;
      case 'flight':
        n = '3/5';
        if (vid) t = 'Le drone rejoint la zone C. Arrivée en 40 s environ.';
        else { t = 'Le drone décolle de sa station. Ouvrez son flux : <b>Vidéo</b>.'; h = F.barVid; }
        break;
      case 'onsite':
        n = '4/5';
        if (!vid) { t = 'Drone sur zone. Ouvrez son flux : <b>Vidéo</b>.'; h = F.barVid; }
        else { t = 'Drone sur zone. Vérifiez l’image thermique, puis <b>Clôturer</b>.'; h = ctxOpen ? q('.fcc-a-close') : F.barAl; }
        break;
      case 'modal': n = '5/5'; t = S.motif ? 'Confirmez avec <b>Clôturer</b>.' : 'Choisissez un motif de clôture.'; h = S.motif ? okBtn : motifBtns[0]; break;
      case 'closed': n = '5/5'; t = 'Alerte clôturée. Le drone rentre à sa station.'; break;
      case 'done': n = '✓'; t = 'Levée de doute terminée. Tout est tracé dans l’historique.'; break;
    }
    F.gN.textContent = n; F.gT.innerHTML = t;
    hint(h);
  }

  /* ── Actions de l'opérateur ── */
  function openCtx() { set('ctx', '1'); if (S.state === 'alert') go('panel'); else guide(); }
  function ack() {
    if (S.st === 'new') { S.st = 'ack'; set('st', 'ack'); txt('status', 'Acquittée'); }
    openCtx();
  }
  function dispatch() {
    S.dispatched = true;
    S.st = 'dispatched'; set('st', 'dispatched'); txt('status', 'Mission lancée');
    set('hud', '1'); set('flown', '1'); txt('fly', '1'); txt('nmis', '1');
    F.barVid.disabled = false;
    S.flight = { t: 0 };
    go('flight');
  }
  function toggleVideo() {
    if (F.barVid.disabled) return;
    set('video', root.getAttribute('data-video') === '1' ? '0' : '1');
    guide();
  }
  var lastFocus = null;
  function openModal() {
    lastFocus = document.activeElement;
    S.prev = S.state; go('modal');
    setTimeout(function () { motifBtns[0].focus({ preventScroll: true }); }, 30);
  }
  function cancelModal() { go(S.prev); if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  function pickMotif(b) {
    motifBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    S.motif = b.getAttribute('data-motif'); S.motifShort = b.textContent.toLowerCase();
    F.ta.textContent = S.motif; F.ta.classList.add('on');
    okBtn.disabled = false; guide();
  }
  function confirmClose() {
    S.st = 'closed'; set('st', 'closed'); txt('status', 'Clôturée');
    txt('motif', S.motif); set('nal', '0'); txt('nal', '0');
    S.t3 = S.sim;
    var flew = root.getAttribute('data-flown') === '1';
    if (flew) {
      S.flight = null;
      S.rth = { t: 0, from: S.pos }; set('hudst', 'rth'); txt('hudStT', 'Retour base'); txt('act', 'Retour'); set('hover', '0');
      go('closed');
    } else finish();
    if (lastFocus && lastFocus.offsetParent) lastFocus.focus({ preventScroll: true });
  }
  function finish() {
    txt('t2', S.t2 !== null ? clock(S.t2) : '--:--:--');
    txt('t2l', S.t2 !== null ? 'Drone sur zone' : (S.dispatched ? 'Drone rappelé avant l\u2019arrivée' : 'Vérification sans vol drone'));
    txt('t3', clock(S.t3)); txt('t3m', S.motifShort || '');
    go('done');
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act],[data-motif]');
    if (!b || !root.contains(b) || b.disabled) return;
    S.userActed = true;
    if (b.hasAttribute('data-motif')) return pickMotif(b);
    var a = b.getAttribute('data-act');
    if (a === 'open') { if (S.state !== 'idle') openCtx(); }
    else if (a === 'ack') ack();
    else if (a === 'ctx-close') { set('ctx', '0'); guide(); }
    else if (a === 'dispatch') dispatch();
    else if (a === 'video') toggleVideo();
    else if (a === 'close') openModal();
    else if (a === 'modal-cancel') cancelModal();
    else if (a === 'confirm') confirmClose();
    else if (a === 'replay') replay();
  });
  wrap.querySelector('.fcc-guide-r').addEventListener('click', function () { replay(); });
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); cancelModal(); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.slice.call(modal.querySelectorAll('button:not([disabled])'));
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });

  function replay() {
    reset();
    setTimeout(alertIn, reduced ? 0 : 700);
  }

  /* ── Boucle : horloge simulée, vol, retour ── */
  var last = 0, raf = 0, visible = false;
  function frame(now) {
    var dt = last ? Math.min(100, now - last) : 16; last = now;
    if (S.state !== 'idle' && S.state !== 'done') {
      S.sim += (S.flight ? dt * FLIGHT_SIM / Math.max(1, FLIGHT_MS) : dt / 1000);
      txt('age', Math.max(1, Math.floor(S.sim)) + ' s');
      txt('tc', clock(S.sim));
    }
    if (S.flight) {
      S.flight.t += dt;
      var f = FLIGHT_MS ? Math.min(1, S.flight.t / FLIGHT_MS) : 1, e = ease(f);
      S.pos = e; placeDrone(e); drawTrail(e);
      var alt = Math.round(45 * Math.min(1, f / 0.15));
      txt('alt', alt + ' m'); txt('alt2', alt + ' m');
      txt('rem', Math.round(420 * (1 - e)) + ' m');
      txt('eta', Math.ceil(FLIGHT_SIM * (1 - f)) + ' s');
      txt('act', f < 0.12 ? 'Décollage' : 'Transit');
      txt('pct', Math.round(e * 100) + ' %'); F.progBar.style.width = (e * 100) + '%';
      txt('bat', (f < .5 ? 98 : 97) + ' %');
      if (f >= 1) {
        S.flight = null; S.t2 = S.sim;
        set('hudst', 'onsite'); txt('hudStT', 'Sur zone'); txt('act', 'Observation'); txt('eta', '0 s');
        set('hover', '1'); set('zoom', '1');
        if (S.state === 'flight') go('onsite'); else S.prev = 'onsite';
      }
    }
    if (S.rth) {
      S.rth.t += dt;
      var g = RTH_MS ? Math.min(1, S.rth.t / RTH_MS) : 1, h = ease(g), cur = S.rth.from * (1 - h);
      S.pos = cur; placeDrone(cur); drawTrail(cur);
      var a2 = Math.round(45 * Math.min(1, (1 - g) / 0.15));
      txt('alt', a2 + ' m'); txt('alt2', a2 + ' m');
      txt('rem', Math.round(420 * (1 - cur)) + ' m'); txt('pct', Math.round(cur * 100) + ' %'); F.progBar.style.width = (cur * 100) + '%';
      if (g >= 1) {
        S.rth = null; txt('fly', '0'); txt('nmis', '0'); txt('hudStT', 'Terminée'); set('hudst', 'run'); set('flown', '0');
        setTimeout(finish, reduced ? 0 : 500);
      }
    }
    raf = requestAnimationFrame(frame);
  }
  function run() { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  function halt() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  reset();
  var started = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) {
        run();
        if (!started) { started = true; setTimeout(alertIn, reduced ? 0 : 900); }
      } else halt();
    }, { threshold: 0.35 }).observe(root);
  } else { visible = true; run(); started = true; alertIn(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else run(); });
})();
