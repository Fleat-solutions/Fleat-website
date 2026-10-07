/* FLEAT : interactions du site vitrine */
(function () {
  'use strict';

  /* Navigation : page en cours mise en évidence automatiquement */
  var page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-main a, .mobile-menu a.m-link').forEach(function (a) {
    var on = a.getAttribute('href') === page;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  /* Header : ombre/bordure dès que le haut de page sort de l'écran */
  var header = document.querySelector('.site-header');
  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle('scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* Menu mobile */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    var setMenu = function (open) {
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    };
    toggle.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu-open'));
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
    });
  }

  /* Reveal au scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* FAQ accordéon */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      // accordéon par groupe : ferme les autres du même conteneur
      var group = item.closest('[data-faq-group]');
      if (group) {
        group.querySelectorAll('.faq-item.open').forEach(function (o) { if (o !== item) o.classList.remove('open'); });
      }
      item.classList.toggle('open', !isOpen);
      q.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });
  });

  /* Formulaires de contact : validation + état succès */
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function setFieldError(field, on) {
    var wrap = field.closest('.field') || field.closest('.consent');
    if (wrap) wrap.classList.toggle('error', on);
  }
  document.querySelectorAll('.js-contact-form').forEach(function (form) {
    function validate() {
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (el) {
        var valid = true;
        if (el.type === 'checkbox') valid = el.checked;
        else if (el.type === 'email') valid = emailRe.test(el.value.trim());
        else valid = el.value.trim().length > 0;
        setFieldError(el, !valid);
        if (!valid && ok) { ok = false; }
      });
      return ok;
    }

    // efface l'erreur dès que le champ est corrigé
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () { setFieldError(el, false); });
      el.addEventListener('change', function () { setFieldError(el, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstErr = form.querySelector('.field.error, .consent.error');
        if (firstErr) {
          var input = firstErr.querySelector('input, select, textarea');
          if (input) input.focus();
        }
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
      // Simulation d'envoi (pas de backend sur la maquette)
      setTimeout(function () {
        form.style.display = 'none';
        var ok = form.parentElement.querySelector('[data-success]');
        if (ok) { ok.classList.add('show'); ok.focus(); }
      }, 700);
    });
  });

  /* Année footer */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Mockup timer + timestamp */
  var mockTimer = document.getElementById('mock-timer');
  var mockTs = document.getElementById('mock-ts');
  var mockBat = document.getElementById('mock-bat');
  var mockBatBar = document.getElementById('mock-bat-bar');
  if (mockTimer) {
    var elapsed = 38;
    var bat = 74;
    setInterval(function () {
      elapsed++;
      mockTimer.innerHTML = elapsed + '<span style="font-size:.85rem; color:var(--on-dark-3); font-weight:400;">s</span>';
      // drain battery slowly
      if (bat > 10) { bat = Math.max(10, bat - 0.01); }
      if (mockBat) mockBat.textContent = Math.round(bat) + '%';
      if (mockBatBar) mockBatBar.style.width = bat + '%';
    }, 1000);
  }
  if (mockTs) {
    function updateTs() {
      var d = new Date();
      mockTs.textContent =
        d.getHours().toString().padStart(2,'0') + ':' +
        d.getMinutes().toString().padStart(2,'0') + ':' +
        d.getSeconds().toString().padStart(2,'0');
    }
    updateTs();
    setInterval(updateTs, 1000);
  }

  /* Bannière cookies RGPD */
  var banner = document.getElementById('cookie-banner');
  if (banner) {
    var consent = localStorage.getItem('fleat_cookie_consent');
    if (consent === 'accepted' || consent === 'refused') {
      banner.classList.add('hidden');
    }
    document.getElementById('cookie-accept').addEventListener('click', function () {
      localStorage.setItem('fleat_cookie_consent', 'accepted');
      banner.classList.add('hidden');
    });
    document.getElementById('cookie-refuse').addEventListener('click', function () {
      localStorage.setItem('fleat_cookie_consent', 'refused');
      banner.classList.add('hidden');
    });
  }
  /* Bannière visible : on réserve sa hauteur en bas de page pour qu'elle ne masque ni le footer ni l'élément qui a le focus */
  function reserveBannerSpace() {
    var b = document.getElementById('cookie-banner');
    var h = b && !b.classList.contains('hidden') ? b.offsetHeight : 0;
    document.body.style.paddingBottom = h ? h + 'px' : '';
    document.documentElement.style.scrollPaddingBottom = h ? (h + 16) + 'px' : '';
  }
  if (banner) {
    reserveBannerSpace();
    if ('ResizeObserver' in window) new ResizeObserver(reserveBannerSpace).observe(banner);
    new MutationObserver(reserveBannerSpace).observe(banner, { attributes: true, attributeFilter: ['class'] });
  }

  /* Reset préférences cookies (accessible depuis confidentialite.html) */
  window.resetCookieConsent = function () {
    localStorage.removeItem('fleat_cookie_consent');
    var b = document.getElementById('cookie-banner');
    if (b) { b.classList.remove('hidden'); }
  };
  document.querySelectorAll('.f-cookies').forEach(function (btn) {
    btn.addEventListener('click', window.resetCookieConsent);
  });
})();
