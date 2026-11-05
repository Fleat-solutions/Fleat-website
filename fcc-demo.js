/* FLEAT Control Center · démo interactive de levée de doute (page solution, section 03) */
(function () {
  'use strict';

  var root = document.getElementById('fcc');
  if (!root) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Variante d'interface tactique : ?ui=tactique */
  var tac = /[?&]ui=tactique\b/.test(location.search);
  if (tac) root.classList.add('fcc-tac');
  var stacked = window.matchMedia('(max-width: 900px)');
  /* Téléphone : démo à la hauteur d'un écran, carte fixe en haut, panneaux qui défilent dessous */
  var phone = window.matchMedia('(max-width: 640px)');

  var F = {};
  root.querySelectorAll('[data-f]').forEach(function (el) { F[el.getAttribute('data-f')] = el; });
  var $ = function (s) { return root.querySelector(s); };
  var canvas = $('.fcc-canvas'), mapwrap = $('.fcc-mapwrap');
  var route = document.getElementById('fcc-route'), trail = document.getElementById('fcc-trail');
  var drone = document.getElementById('fcc-drone');
  var motifBtns = Array.prototype.slice.call(root.querySelectorAll('[data-motif]'));
  var okBtn = $('.fcc-modal[data-m="close"] .fcc-m-ok');
  /* Flux thermique simulé : une vidéo découpée selon les phases de vol (secondes) */
  var vid = $('.fcc-vid-th');
  var VT = { takeoff: 0, transit: 2.8, zoom: 8.8, hover: 11.4, hoverEnd: 17.4, rth: 17.4, land: 22.0 };
  function vplay(t) {
    if (!vid) return;
    try { if (t !== undefined) vid.currentTime = t; var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
  }
  function vpause() { if (vid) try { vid.pause(); } catch (e) {} }
  if (vid) {
    vid.addEventListener('playing', function () { set('vlive', '1'); });
    vid.addEventListener('waiting', function () { set('vlive', '0'); });
  }
  root.appendChild(F.coach);

  /* Géométrie : image IGN 2376 x 1080 px, 0,418 m par pixel */
  var IW = 2376, IH = 1080, MPP = 0.4183;
  var N = 80, pts = [], len = route.getTotalLength();
  for (var i = 0; i <= N; i++) { var q = route.getPointAtLength(len * i / N); pts.push([q.x, q.y]); }
  var DIST = Math.round(len * MPP);
  function at(f) {
    f = Math.max(0, Math.min(1, f));
    var x = f * N, k = Math.min(N - 1, Math.floor(x)), r = x - k;
    return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * r, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * r];
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
  function get(k) { return root.getAttribute('data-' + k); }

  /* Séquence de vol (durées réelles en ms, durées simulées en s) : 40 s simulées jusqu'à l'arrivée */
  var PH = {
    prep:    { ms: 2200, sim: 8,  act: 'Préparation', st: 'Ouverture station' },
    takeoff: { ms: 2800, sim: 7,  act: 'Décollage',   st: 'Décollage' },
    transit: { ms: 6000, sim: 25, act: 'Transit',     st: 'En cours' },
    rth:     { ms: 4600, sim: 26, act: 'Retour',      st: 'Retour base' },
    land:    { ms: 1800, sim: 6,  act: 'Atterrissage', st: 'Atterrissage' }
  };
  var ETA_TOTAL = PH.prep.sim + PH.takeoff.sim + PH.transit.sim;
  var BASE = 2 * 3600 + 14 * 60 + 6;
  function clock(s) { s = Math.floor(BASE + s); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); }

  var S;
  function reset() {
    S = { state: 'idle', st: 'new', sim: 0, m: null, pos: 0, alt: 0, dp: at(0), pan: { x: 0, y: 0 }, motif: '', t2: null, t3: null, dispatched: false, follow: false, userActed: false, prev: null, aborted: false };
    ['ctx', 'video', 'hud', 'flown', 'zoom', 'hover', 'nal', 'banner', 'zalert', 'air', 'paused', 'toast', 'notifs', 'rail', 'vlive'].forEach(function (k) { set(k, '0'); });
    set('state', 'idle'); set('st', 'new'); set('hudst', 'run'); set('dock', 'closed'); set('src', 'drone'); set('pop', ''); set('modal', '');
    setDrone(0, 0, 0, .55);
    drawTrail(0);
    txt('fly', '0'); txt('nmis', '0'); txt('nal', '0'); txt('bellN', '0'); txt('status', 'Nouvelle'); txt('cls', 'À qualifier');
    txt('dockSt', 'Drone à bord'); txt('hudStT', 'En cours'); hudVals(DIST, ETA_TOTAL, 'Préparation', 0, 98);
    txt('pauseBtn', 'Pause'); F.pauseBtn.disabled = false;
    F.followBtn.setAttribute('aria-pressed', 'false');
    F.ta.textContent = 'Ex. fausse alarme, incident résolu, contrôle effectué sur place…'; F.ta.classList.remove('on');
    motifBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    okBtn.disabled = true;
    root.querySelectorAll('.fcc-bar-b[data-pop]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    srcBtns(); tele();
    layout(true); guide();
  }

  function setDrone(f, alt, op, sc) {
    var p = at(f), q = S.dp;
    /* Cap GPS : orienté selon le déplacement, conservé à l'arrêt */
    if (q && Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.4) S.hd = Math.atan2(p[1] - q[1], p[0] - q[0]) * 180 / Math.PI + 90;
    else if (S.hd === undefined || f === 0 && !op) { var t0 = at(0), t1 = at(0.03); S.hd = Math.atan2(t1[1] - t0[1], t1[0] - t0[0]) * 180 / Math.PI + 90; }
    drone.style.setProperty('--hd', S.hd.toFixed(1) + 'deg');
    S.pos = f; S.alt = alt; S.dp = p;
    drone.style.left = (p[0] / IW * 100) + '%';
    drone.style.top = (p[1] / IH * 100) + '%';
    drone.style.setProperty('--do', op);
    drone.style.setProperty('--ds', sc);
    drone.style.setProperty('--lift', (alt * 0.6).toFixed(1) + 'px');
    set('atdock', op > 0 && f < 0.06 ? '1' : '0');
    txt('alt', Math.round(alt) + ' m');
  }
  function hudVals(rem, eta, act, pct, bat) {
    txt('rem', Math.max(0, Math.round(rem)) + ' m');
    var e = Math.max(0, Math.ceil(eta));
    txt('eta', tac ? pad(Math.floor(e / 60)) + ':' + pad(e % 60) : e + ' s');
    txt('act', act);
    txt('pct', Math.round(pct) + ' %'); F.progBar.style.width = pct + '%';
    txt('alt2', Math.round(S ? S.alt : 0) + ' m');
    txt('bat', bat + ' %');
  }

  /* ── Cadrage de la carte : garde la zone utile visible entre les panneaux ── */
  function layout(instant) {
    var mw = mapwrap.clientWidth, mh = mapwrap.clientHeight;
    if (!mw || !mh || !S) return;
    var cw = canvas.offsetWidth, ch = canvas.offsetHeight;
    var left = 0, right = mw;
    if (!stacked.matches) {
      if (get('ctx') === '1') right = mw - $('.fcc-ctx').offsetWidth;
      if (get('video') === '1') left = Math.min(right - 200, $('.fcc-vid').offsetWidth + 12);
    }
    /* Vue d'ensemble légèrement dézoomée ; l'orthophoto déborde de 25 % autour du plan */
    var s = S.follow ? 1.6 : (stacked.matches ? 0.86 : 0.78);
    var fx = S.follow ? S.dp[0] : 1220, fy = S.follow ? S.dp[1] : 597;
    /* Réserve le haut de la carte quand la bannière d'alerte et sa bulle sont affichées */
    var top = 0;
    if (!stacked.matches && get('banner') === '1') {
      var cb = $('.fcc-crit').getBoundingClientRect(), mb = mapwrap.getBoundingClientRect();
      top = Math.max(0, cb.bottom - mb.top) + (F.coach.classList.contains('on') && F.coach.getAttribute('data-side') !== 'right' ? F.coach.offsetHeight + 16 : 14);
    }
    /* Le site (y 90 à 1104 du plan) doit tenir entre la réserve haute et le bas de la carte */
    if (!S.follow && top) s = Math.min(s, (mh - top - 16) / (1014 / IH * ch));
    var tx = (left + right) / 2 - fx / IW * cw * s;
    var ty = (top + mh) / 2 - fy / IH * ch * s;
    /* Déplacement manuel (glisser à la souris), borné à l'orthophoto */
    var bx = tx, by = ty;
    tx += S.pan.x; ty += S.pan.y;
    tx = Math.min(0.25 * cw * s, Math.max(mw - 1.25 * cw * s, tx));
    ty = Math.min(0.25 * ch * s, Math.max(mh - 1.25 * ch * s, ty));
    S.pan.x = tx - bx; S.pan.y = ty - by;
    canvas.style.transition = instant ? 'none' : '';
    canvas.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + s + ')';
    root.style.setProperty('--cam', s);
  }

  /* ── Bulle de guidage, accrochée au bouton attendu ── */
  var hinted = null, coachTimer = 0;
  function guide() {
    var ctx = get('ctx') === '1', vid = get('video') === '1', m = S.m;
    var n = '', t = '', h = null;
    switch (S.state) {
      case 'alert': n = '1/5'; t = 'Une alarme remonte de la caméra 12. Cliquez sur <b>Traiter</b>.'; h = $('.fcc-btn-go'); break;
      case 'panel':
        n = '2/5';
        if (ctx) { t = S.aborted ? 'Mission abandonnée. Relancez une <b>Reconnaissance</b> ou clôturez l’alerte.' : 'Envoyez le drone vérifier : <b>Reconnaissance</b>.'; h = $('.fcc-a-go'); }
        else { t = 'Rouvrez l’alerte depuis <b>Alertes</b>.'; h = F.barAl; }
        break;
      case 'flight':
        n = '3/5';
        if (!vid) { t = m && m.phase === 'prep' ? 'La station s’ouvre. Ouvrez le flux du drone : <b>Vidéo</b>.' : 'Le drone décolle. Ouvrez son flux : <b>Vidéo</b>.'; h = F.barVid; }
        else if (phone.matches) { t = 'Arrivée sur zone en 40 s environ. Le flux du drone s’affiche ici.'; h = $('.fcc-vid'); }
        else { t = 'Arrivée sur zone en 40 s environ. Suivez la mission ici.'; h = $('.fcc-hud'); }
        break;
      case 'onsite':
        n = '4/5';
        if (!vid) { t = 'Drone sur zone. Ouvrez son flux : <b>Vidéo</b>.'; h = F.barVid; }
        else if (ctx) { t = 'Image vérifiée ? Clôturez l’alerte : <b>Clôturer</b>.'; h = $('.fcc-a-close'); }
        else { t = 'Rouvrez l’alerte depuis <b>Alertes</b> pour la clôturer.'; h = F.barAl; }
        break;
      case 'modal':
        n = '5/5';
        if (!stacked.matches) { t = S.motif ? 'Confirmez la clôture.' : 'Une personne est visible sur le flux. Motif : <b>Personne autorisée</b>.'; h = S.motif ? okBtn : motifBtns[0]; }
        break;
      case 'closed': n = '5/5'; t = S.st === 'closed' ? 'Alerte clôturée. Le drone rentre seul à sa station.' : 'Le drone rentre à sa station.'; h = $('.fcc-hud-s'); break;
    }
    if (get('modal') === 'abort') h = null;
    setHint(h);
    if (h) { F.coachN.textContent = n; F.coachT.innerHTML = t; }
    placeCoach();
    clearTimeout(coachTimer); coachTimer = setTimeout(placeCoach, 260);
  }
  function setHint(el) {
    if (hinted && hinted !== el) hinted.classList.remove('fcc-hint');
    hinted = el;
    if (!el) return;
    el.classList.add('fcc-hint');
    if (S.userActed && phone.matches) {
      /* la marge haute du défilement (scroll-padding) garde l'élément sous la carte fixe */
      if (!el.closest('.fcc-mapwrap')) el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    } else if (S.userActed && stacked.matches) {
      var r = el.getBoundingClientRect();
      if (r.top < 60 || r.bottom > window.innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }
  }
  function placeCoach() {
    var c = F.coach, el = hinted;
    if (!el || !el.offsetParent || S.state === 'done') { c.classList.remove('on'); return; }
    var R = root.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (!c.classList.contains('on')) c.classList.add('on');
    var cw = c.offsetWidth, ch = c.offsetHeight, gap = 12, m = 8;
    var cx = r.left + r.width / 2 - R.left, side, x, y;
    var inCtx = !stacked.matches && el.closest('.fcc-ctx'), inModal = el.closest('.fcc-modal');
    var inBanner = !stacked.matches && el.closest('.fcc-crit');
    if (inBanner && R.right - r.right > cw + gap + m) {
      side = 'right'; x = r.right - R.left + gap; y = r.top - R.top + r.height / 2 - ch / 2;
    } else if (inModal && r.top - R.top - gap - ch > m) {
      side = 'top'; x = cx - cw / 2; y = r.top - R.top - gap - ch;
    } else if (inCtx && r.left - R.left > cw + 20) {
      side = 'left'; x = r.left - R.left - cw - gap; y = r.top - R.top + r.height / 2 - ch / 2;
    } else if (r.bottom - R.top + gap + ch < R.height - m) {
      side = 'bottom'; x = cx - cw / 2; y = r.bottom - R.top + gap;
    } else {
      side = 'top'; x = cx - cw / 2; y = r.top - R.top - gap - ch;
    }
    x = Math.max(m, Math.min(R.width - cw - m, x));
    y = Math.max(m, Math.min(R.height - ch - m, y));
    c.setAttribute('data-side', side);
    c.style.setProperty('--ax', Math.max(14, Math.min(cw - 14, cx - x)) + 'px');
    c.style.setProperty('--ay', Math.max(14, Math.min(ch - 14, r.top - R.top + r.height / 2 - y)) + 'px');
    c.style.left = Math.round(x) + 'px'; c.style.top = Math.round(y) + 'px';
    if (c.getAttribute('data-prev') !== side) { c.setAttribute('data-prev', side); if (get('banner') === '1') layout(); }
  }

  function go(state) { S.state = state; set('state', state); guide(); }

  /* ── Alerte ── */
  function alertIn() {
    S.sim = 0;
    set('nal', '1'); set('banner', '1'); set('zalert', '1');
    txt('nal', '1'); txt('bellN', '1'); txt('recv', clock(0)); txt('t1', clock(0));
    go('alert');
    setTimeout(function () { layout(); }, 60);
  }

  /* ── Actions opérateur ── */
  function openCtx() {
    if (get('nal') === '0' && S.st !== 'closed') { toast('alerts'); return; }
    set('ctx', '1'); set('notifs', '0');
    if (S.state === 'alert') go('panel'); else guide();
    layout();
  }
  function closeCtx() { set('ctx', '0'); layout(); guide(); }
  function ack() {
    if (S.st === 'new') { S.st = 'ack'; set('st', 'ack'); txt('status', 'Acquittée'); set('banner', '0'); }
    openCtx(); layout();
  }
  function dispatch() {
    S.dispatched = true; S.aborted = false;
    S.st = 'dispatched'; set('st', 'dispatched'); txt('status', 'Mission lancée'); set('banner', '0'); setTimeout(function () { layout(); }, 0);
    set('hud', '1'); set('flown', '1'); set('dock', 'open'); set('hudst', 'run'); set('paused', '0');
    txt('dockSt', 'Ouverture…'); txt('fly', '0'); txt('nmis', '1'); txt('msLiveS', 'En cours · Drone 01');
    F.pauseBtn.disabled = false; txt('pauseBtn', 'Pause');
    S.m = { phase: 'prep', t: 0 };
    drawTrail(0);
    go('flight');
  }
  function toggleVideo(force) {
    var on = force !== undefined ? force : get('video') !== '1';
    set('video', on ? '1' : '0'); layout(); guide();
  }
  var lastFocus = null;
  function openModal(kind) {
    lastFocus = document.activeElement;
    set('modal', kind);
    if (kind === 'close') { S.prev = S.state; go('modal'); }
    else guide();
    var first = $('.fcc-modal[data-m="' + kind + '"] ' + (kind === 'close' ? '[data-motif]' : '.fcc-m-cancel'));
    setTimeout(function () { first.focus({ preventScroll: true }); }, 30);
  }
  function closeModal() {
    var k = get('modal'); set('modal', '');
    if (k === 'close') go(S.prev); else guide();
    if (lastFocus && lastFocus.offsetParent) lastFocus.focus({ preventScroll: true });
  }
  function pickMotif(b) {
    motifBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    S.motif = b.getAttribute('data-motif'); S.motifShort = b.textContent.toLowerCase();
    F.ta.textContent = S.motif; F.ta.classList.add('on');
    okBtn.disabled = false; guide();
  }
  function confirmClose() {
    set('modal', '');
    S.st = 'closed'; set('st', 'closed'); txt('status', 'Clôturée'); txt('motif', S.motif);
    txt('cls', S.motifShort ? S.motifShort.charAt(0).toUpperCase() + S.motifShort.slice(1) : 'Clôturée');
    set('nal', '0'); set('banner', '0'); set('zalert', '0'); txt('nal', '0'); txt('bellN', '0');
    S.t3 = S.sim;
    if (S.m && S.m.phase !== 'rth' && S.m.phase !== 'land') startRth();
    if (S.m) go('closed'); else finish();
    if (lastFocus && lastFocus.offsetParent) lastFocus.focus({ preventScroll: true });
  }
  function startRth() {
    if (S.m.phase === 'prep') { endMission(); return; }
    var from = S.m.phase === 'takeoff' ? 0 : S.pos;
    S.m = from > 0 ? { phase: 'rth', t: 0, from: from } : { phase: 'land', t: 0, fromAlt: S.alt };
    vplay(from > 0 ? VT.rth + (1 - from) * (VT.land - VT.rth) : VT.land);
    set('hudst', 'rth'); set('hover', '0'); set('zoom', '0'); set('paused', '0');
    F.pauseBtn.disabled = false; txt('pauseBtn', 'Pause');
  }
  function endMission() {
    S.m = null; vpause(); set('vlive', '0'); set('hud', '0'); set('air', '0'); set('flown', '0'); set('hover', '0'); set('zoom', '0'); set('dock', 'closed'); set('paused', '0');
    setDrone(0, 0, 0, .55); drawTrail(0);
    txt('fly', '0'); txt('nmis', '0'); txt('dockSt', 'Drone à bord');
    if (S.follow) toggleFollow(false);
    tele();
  }
  function abortOk() {
    set('modal', '');
    S.aborted = true; S.st = 'ack'; set('st', 'ack'); txt('status', 'Acquittée');
    startRth();
    if (S.m) { txt('msLiveS', 'Retour base · Drone 01'); go('closed'); } else go('panel');
  }
  function finish() {
    txt('t2', S.t2 !== null ? clock(S.t2) : '--:--:--');
    txt('t2l', S.t2 !== null ? 'Drone sur zone' : (S.dispatched ? 'Drone rappelé avant l’arrivée' : 'Vérification sans vol drone'));
    txt('t3', clock(S.t3)); txt('t3m', S.motifShort || '');
    set('ctx', '0'); layout();
    go('done');
  }
  function togglePause() {
    if (!S.m) return;
    var p = get('paused') !== '1';
    set('paused', p ? '1' : '0'); txt('pauseBtn', p ? 'Reprendre' : 'Pause');
    if (p) vpause(); else if (S.m.phase !== 'prep') vplay();
    txt('hudStT', p ? 'En pause' : PH[S.m.phase] ? PH[S.m.phase].st : 'Sur zone');
    tele();
  }
  function toggleFollow(force) {
    S.follow = force !== undefined ? force : !S.follow;
    F.followBtn.setAttribute('aria-pressed', S.follow ? 'true' : 'false');
    layout();
  }

  /* ── Panneaux, menus et modules hors démo ── */
  var TOASTS = {
    search: ['Recherche globale', 'Sites, drones, missions et alertes, accessibles au clavier (Ctrl K).', 1],
    account: ['Compte opérateur', 'Rôles et droits définis site par site, double authentification.', 1],
    sites: ['Multi-sites', 'Basculez entre vos sites depuis ce menu. Cette démo en présente un seul.', 1],
    ops: ['Vue ops', 'Tableau de bord multi-sites : flotte, missions en cours, alertes ouvertes.', 1],
    media: ['Médiathèque', 'Vidéos et photos de chaque mission, horodatées et exportables.', 1],
    sitesnav: ['Sites', 'Plans, zones d’opération et points d’intérêt de chaque site.', 1],
    alerts: ['Alertes', 'Aucune alerte ouverte pour le moment.', 0],
    map: ['Carte live', 'Vous êtes sur la Carte live.', 0]
  };
  var toastTimer = 0;
  function toast(k) {
    var d = TOASTS[k]; if (!d) return;
    txt('toastT', d[0]); txt('toastB', d[1]); F.toastL.hidden = !d[2];
    set('toast', '0'); void root.offsetWidth; set('toast', '1');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { set('toast', '0'); }, 4200);
  }
  var POP_T = { tele: 'Télémétrie', missions: 'Missions', layers: 'Couches' };
  function pop(k) {
    var next = get('pop') === k ? '' : k;
    set('pop', next); txt('popT', POP_T[next] || '');
    root.querySelectorAll('.fcc-bar-b[data-pop]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pop') === next ? 'true' : 'false'); });
    tele(); guide();
  }
  function nav(k) {
    set('rail', '0'); $('.fcc-rail-x').setAttribute('aria-expanded', 'false');
    if (k === 'alerts') openCtx();
    else if (k === 'wall') toggleVideo(true);
    else if (k === 'missions') { if (get('pop') !== 'missions') pop('missions'); }
    else if (k === 'drones' || k === 'docks') { if (get('pop') !== 'tele') pop('tele'); }
    else if (k === 'sites') toast('sitesnav');
    else toast(k);
  }
  function srcBtns() {
    var s = get('src');
    root.querySelectorAll('[data-src]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-src') === s ? 'true' : 'false'); });
    txt('vidF', s === 'dock' ? 'Station 01 · caméra extérieure' : 'Drone 01 · caméra thermique · flux simulé');
    txt('vidMode', s === 'dock' ? 'VISIBLE' : 'THERMIQUE');
  }
  function tele() {
    var m = S && S.m, ph = m ? m.phase : null, p = get('paused') === '1';
    var st = !m ? 'Dans la station' : p ? 'En pause' : ph === 'prep' ? 'Préparation' : ph === 'takeoff' ? 'Décollage' : ph === 'transit' ? 'En transit' : ph === 'onsite' ? 'Sur zone' : ph === 'rth' ? 'Retour base' : 'Atterrissage';
    txt('tState', st);
    txt('tAlt', Math.round(S ? S.alt : 0) + ' m');
    txt('tSpd', !p && (ph === 'transit' || ph === 'rth') ? '11 m/s' : !p && (ph === 'takeoff' || ph === 'land') ? '3 m/s' : '0 m/s');
    txt('tBat', F.bat.textContent);
    txt('tDock', get('dock') === 'open' ? 'Ouverte' : 'Fermée · prête');
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act],[data-motif]');
    if (get('notifs') === '1' && !e.target.closest('.fcc-notifs, .fcc-bell')) set('notifs', '0');
    if (get('rail') === '1' && !e.target.closest('.fcc-rail')) { set('rail', '0'); $('.fcc-rail-x').setAttribute('aria-expanded', 'false'); }
    if (!b || !root.contains(b) || b.disabled) return;
    S.userActed = true;
    if (b.hasAttribute('data-motif')) { pickMotif(b); return; }
    switch (b.getAttribute('data-act')) {
      case 'open': if (S.state !== 'idle') openCtx(); break;
      case 'ack': ack(); break;
      case 'ctx-close': closeCtx(); break;
      case 'dispatch': dispatch(); break;
      case 'video': toggleVideo(); break;
      case 'close': openModal('close'); break;
      case 'modal-cancel': case 'abort-cancel': closeModal(); break;
      case 'confirm': confirmClose(); break;
      case 'abort': if (S.m && S.m.phase !== 'rth' && S.m.phase !== 'land') openModal('abort'); break;
      case 'abort-ok': abortOk(); break;
      case 'pause': togglePause(); break;
      case 'follow': toggleFollow(); break;
      case 'replay': replay(); break;
      case 'bell': set('notifs', get('notifs') === '1' ? '0' : '1'); break;
      case 'toast': toast(b.getAttribute('data-toast')); break;
      case 'pop': pop(b.getAttribute('data-pop')); break;
      case 'pop-close': pop(get('pop')); break;
      case 'tele': if (get('pop') !== 'tele') pop('tele'); break;
      case 'rail': var o = get('rail') !== '1'; set('rail', o ? '1' : '0'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); break;
      case 'nav': nav(b.getAttribute('data-nav')); break;
      case 'layer':
        set('layer', b.getAttribute('data-layer'));
        root.querySelectorAll('[data-act="layer"]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        break;
      case 'src': set('src', b.getAttribute('data-src')); srcBtns(); break;
    }
  });
  root.querySelectorAll('[data-layer-t]').forEach(function (c) {
    c.addEventListener('change', function () { set('l-' + c.getAttribute('data-layer-t'), c.checked ? '1' : '0'); });
  });
  root.addEventListener('keydown', function (e) {
    var md = get('modal');
    if (e.key === 'Escape') {
      if (md) { e.preventDefault(); closeModal(); return; }
      if (get('notifs') === '1') set('notifs', '0');
      if (get('rail') === '1') set('rail', '0');
      if (get('pop')) pop(get('pop'));
      return;
    }
    if (e.key !== 'Tab' || !md) return;
    var f = Array.prototype.slice.call(root.querySelectorAll('.fcc-modal[data-m="' + md + '"] button:not([disabled])'));
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });

  function replay() {
    vpause(); if (vid && vid.readyState) try { vid.currentTime = 0; } catch (e) {}
    reset();
    setTimeout(alertIn, reduced ? 0 : 700);
  }

  /* ── Boucle d'animation ── */
  var last = 0, raf = 0, visible = false;
  function frame(now) {
    var dt = last ? Math.min(100, now - last) : 16; last = now;
    var m = S.m, paused = get('paused') === '1';
    var rate = 1 / 1000;
    if (m && !paused && PH[m.phase]) rate = PH[m.phase].sim / PH[m.phase].ms;
    if (S.state !== 'idle' && S.state !== 'done') {
      S.sim += dt * rate;
      txt('age', Math.max(1, Math.floor(S.sim)) + ' s'); txt('tagAge', Math.max(1, Math.floor(S.sim)) + ' s');
      txt('tc', clock(S.sim));
    }
    if (m && !paused && m.phase !== 'onsite') {
      m.t += dt;
      var P = PH[m.phase], f = Math.min(1, m.t / P.ms), e = ease(f);
      if (m.phase === 'prep') {
        setDrone(0, 0, 0, .55);
        hudVals(DIST, ETA_TOTAL - P.sim * f, P.act, 0, 98);
      } else if (m.phase === 'takeoff') {
        set('air', '1'); txt('dockSt', 'Décollage'); txt('fly', '1');
        setDrone(0, 45 * e, Math.min(1, f * 3), .55 + .45 * e);
        hudVals(DIST, PH.transit.sim + P.sim * (1 - f), P.act, 0, 98);
      } else if (m.phase === 'transit') {
        txt('dockSt', 'En attente');
        setDrone(e, 45, 1, 1); drawTrail(e);
        hudVals(DIST * (1 - e), PH.transit.sim * (1 - f), P.act, e * 100, f < .5 ? 98 : 97);
      } else if (m.phase === 'rth') {
        var cur = m.from * (1 - e);
        setDrone(cur, 45, 1, 1); drawTrail(cur);
        hudVals(DIST * cur, PH.land.sim + P.sim * (1 - f), P.act, (1 - cur) * 100, 96);
      } else if (m.phase === 'land') {
        var a0 = m.fromAlt !== undefined ? m.fromAlt : 45;
        txt('dockSt', 'Atterrissage');
        setDrone(0, a0 * (1 - e), 1 - Math.max(0, (f - .7) / .3), 1 - .45 * e);
        hudVals(0, P.sim * (1 - f), P.act, 100, 96);
      }
      if (get('hudst') !== 'onsite') txt('hudStT', P.st);
      if (f >= 1) {
        if (m.phase === 'prep') { m.phase = 'takeoff'; m.t = 0; vplay(VT.takeoff); if (S.state === 'flight') guide(); }
        else if (m.phase === 'takeoff') { m.phase = 'transit'; m.t = 0; if (vid && Math.abs(vid.currentTime - VT.transit) > .5) vplay(VT.transit); }
        else if (m.phase === 'transit') {
          m.phase = 'onsite'; S.t2 = S.sim;
          if (vid && (vid.currentTime < VT.zoom - .3 || vid.currentTime > VT.zoom + .6)) vplay(VT.zoom);
          set('hudst', 'onsite'); txt('hudStT', 'Sur zone'); hudVals(0, 0, 'Observation', 100, 97);
          set('hover', '1'); set('zoom', '1'); F.pauseBtn.disabled = true;
          if (S.state === 'flight') go('onsite'); else if (S.prev === 'flight') S.prev = 'onsite';
        }
        else if (m.phase === 'rth') { m.phase = 'land'; m.t = 0; set('hover', '0'); if (vid && vid.currentTime < VT.land - .5) vplay(VT.land); }
        else if (m.phase === 'land') {
          endMission();
          if (S.st === 'closed') setTimeout(finish, reduced ? 0 : 400);
          else go('panel');
        }
      }
      if (S.follow) layout(true);
      tele();
    }
    if (S.m && S.m.phase === 'onsite' && vid && vid.currentTime >= VT.hoverEnd - .08) vid.currentTime = VT.hover;
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
        layout(true); run();
        if (vid && vid.preload !== 'auto') { vid.preload = 'auto'; vid.load(); }
        if (!started && en[0].intersectionRatio >= 0.3) { started = true; setTimeout(alertIn, reduced ? 0 : 900); }
      } else halt();
    }, { threshold: [0, 0.3] }).observe(root);
  } else { visible = true; run(); started = true; alertIn(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else run(); });
  /* Téléphone : la bannière d'alerte passe sous la carte au lieu de la recouvrir */
  var stage = $('.fcc-stage'), crit = $('.fcc-crit');
  function placeCrit() {
    if (phone.matches) { if (crit.parentNode !== stage) stage.insertBefore(crit, mapwrap.nextSibling); }
    else if (crit.parentNode !== mapwrap) mapwrap.appendChild(crit);
  }
  placeCrit();
  if (phone.addEventListener) phone.addEventListener('change', function () { placeCrit(); layout(true); placeCoach(); });
  var coachRaf = 0;
  stage.addEventListener('scroll', function () { if (!coachRaf) coachRaf = requestAnimationFrame(function () { coachRaf = 0; placeCoach(); }); }, { passive: true });
  window.addEventListener('resize', function () { layout(true); placeCoach(); });

  /* Liens vers la démo : cadrer l'interface au centre de l'écran, sous l'en-tête */
  document.querySelectorAll('a[href="#demo-interface"]').forEach(function (l) {
    l.addEventListener('click', function (e) {
      e.preventDefault();
      var head = (document.querySelector('.site-header') || {}).offsetHeight || 0;
      var r = root.getBoundingClientRect(), avail = window.innerHeight - head;
      var off = r.height < avail ? (avail - r.height) / 2 : 12;
      window.scrollTo({ top: window.scrollY + r.top - head - off, behavior: reduced ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', '#demo-interface');
    });
  });

  /* Glisser la carte au clic gauche (souris uniquement, le tactile garde le défilement de la page) */
  var drag = null;
  mapwrap.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button, a')) return;
    drag = { x: e.clientX, y: e.clientY, px: S.pan.x, py: S.pan.y, moved: false, id: e.pointerId };
  });
  mapwrap.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    if (!drag.moved) { drag.moved = true; mapwrap.setPointerCapture(e.pointerId); root.setAttribute('data-drag', '1'); if (S.follow) toggleFollow(false); }
    S.pan.x = drag.px + dx; S.pan.y = drag.py + dy;
    layout(true); placeCoach();
    e.preventDefault();
  });
  function endDrag() { if (drag) { drag = null; root.removeAttribute('data-drag'); } }
  mapwrap.addEventListener('pointerup', endDrag);
  mapwrap.addEventListener('pointercancel', endDrag);
  /* Double-clic : recentrer */
  mapwrap.addEventListener('dblclick', function (e) {
    if (e.target.closest('button, a')) return;
    S.pan.x = 0; S.pan.y = 0; layout();
  });
  var img = $('.fcc-ortho');
  if (img && !img.complete) img.addEventListener('load', function () { layout(true); });
})();
