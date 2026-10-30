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

  /* Envoi des formulaires vers Web3Forms (clé publique dans data-w3f-key) */
  window.fleatSendForm = function (form, onSuccess) {
    var btn = form.querySelector('button[type="submit"]');
    var btnHtml = btn ? btn.innerHTML : '';
    var errBox = form.querySelector('.form-error');
    if (errBox) errBox.hidden = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }

    var data = { access_key: form.dataset.w3fKey, subject: form.dataset.w3fSubject, from_name: 'Site FLEAT' };
    new FormData(form).forEach(function (value, key) {
      key = key.replace(/\[\]$/, '');
      if (key === 'consent') value = 'oui';
      data[key] = data[key] ? data[key] + ', ' + value : value;
    });

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json.success) throw new Error(json.message);
        window.fleatTrack('generate_lead', { form_name: form.dataset.formName });
        onSuccess();
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = btnHtml; }
        if (errBox) { errBox.hidden = false; errBox.focus(); }
      });
  };

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
      window.fleatSendForm(form, function () {
        form.style.display = 'none';
        var ok = form.parentElement.querySelector('[data-success]');
        if (ok) { ok.classList.add('show'); ok.focus(); }
      });
    });
  });

  /* Barres défilantes : indique s'il reste du contenu à gauche ou à droite */
  document.querySelectorAll('[data-scroll-fade]').forEach(function (el) {
    function update() {
      var max = el.scrollWidth - el.clientWidth;
      el.classList.toggle('fade-l', el.scrollLeft > 2);
      el.classList.toggle('fade-r', el.scrollLeft < max - 2);
    }
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* Accordéons mobiles : [data-collapse] résume la section, [data-detail] se déplie au toucher */
  var collapsibles = document.querySelectorAll('[data-collapse]');
  if (collapsibles.length) {
    var mobile = window.matchMedia('(max-width: 600px)');
    var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    var setOpen = function (sec, open) {
      sec.classList.toggle('is-collapsed', !open);
      var btn = sec.querySelector('.collapse-toggle');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.firstChild.textContent = open ? 'Masquer le détail' : 'Voir le détail';
    };
    collapsibles.forEach(function (sec) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'collapse-toggle';
      btn.innerHTML = '<span></span>' + arrow;
      var anchor = sec.querySelector('[data-clamp]') || sec.querySelector('h2');
      anchor.insertAdjacentElement('afterend', btn);
      btn.addEventListener('click', function () { setOpen(sec, sec.classList.contains('is-collapsed')); });
    });
    var openTarget = function (rescroll) {
      var target = location.hash && document.getElementById(location.hash.slice(1));
      if (!target || !mobile.matches) return;
      var sec = target.closest('[data-collapse]');
      if (sec) setOpen(sec, true);
      /* au chargement, les sections repliées au-dessus ont décalé l'ancre : on la rejoint */
      if (rescroll) requestAnimationFrame(function () { target.scrollIntoView(); });
    };
    var applyMode = function (rescroll) {
      collapsibles.forEach(function (sec) {
        sec.classList.toggle('is-collapsible', mobile.matches);
        setOpen(sec, !mobile.matches);
      });
      openTarget(rescroll === true);
    };
    applyMode(true);
    mobile.addEventListener('change', applyMode);
    window.addEventListener('hashchange', function () { openTarget(false); });
  }

  /* Onglets mobiles : [data-tabs] n'affiche qu'un de ses blocs [data-tab] à la fois sur petit écran */
  document.querySelectorAll('[data-tabs]').forEach(function (group, g) {
    var panels = Array.prototype.slice.call(group.querySelectorAll(':scope > [data-tab]'));
    if (panels.length < 2) return;
    var bar = document.createElement('div');
    bar.className = 'm-tabs';
    bar.setAttribute('role', 'tablist');
    var mq = window.matchMedia('(max-width: 600px)');
    var current = 0;
    var select = function (i) {
      current = i;
      panels.forEach(function (p, j) {
        var on = i === j;
        p.hidden = mq.matches && !on;
        bar.children[j].setAttribute('aria-selected', on ? 'true' : 'false');
        bar.children[j].tabIndex = on ? 0 : -1;
      });
    };
    panels.forEach(function (p, i) {
      p.id = p.id || 'tab-' + g + '-' + i;
      p.setAttribute('role', 'tabpanel');
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', p.id);
      b.textContent = p.getAttribute('data-tab');
      b.addEventListener('click', function () { select(i); });
      bar.appendChild(b);
    });
    group.parentElement.insertBefore(bar, group);
    group.parentElement.classList.add('has-tabs');
    mq.addEventListener('change', function () { select(current); });
    select(0);
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

  /* Mesure d'audience Google Analytics 4 : chargée uniquement après consentement, sur le domaine de production */
  var GA_ID = 'G-NTDF6J8CZG';
  var isProduction = /(^|\.)fleat-solutions\.com$/.test(location.hostname);
  function loadAnalytics() {
    if (!isProduction) return;
    window['ga-disable-' + GA_ID] = false;
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { cookie_expires: 34128000 }); // 13 mois, durée maximale recommandée par la CNIL
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }
  function stopAnalytics() {
    window['ga-disable-' + GA_ID] = true;
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0) return;
      ['', '; domain=' + location.hostname, '; domain=.' + location.hostname.replace(/^www\./, '')].forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }
  window.fleatTrack = function (name, params) {
    if (window.gtag && !window['ga-disable-' + GA_ID]) window.gtag('event', name, params);
  };

  /* Bannière cookies RGPD */
  var banner = document.getElementById('cookie-banner');
  if (banner) {
    var consent = localStorage.getItem('fleat_cookie_consent');
    if (consent === 'accepted' || consent === 'refused') {
      banner.classList.add('hidden');
    }
    if (consent === 'accepted') loadAnalytics();
    document.getElementById('cookie-accept').addEventListener('click', function () {
      localStorage.setItem('fleat_cookie_consent', 'accepted');
      banner.classList.add('hidden');
      loadAnalytics();
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
    stopAnalytics();
    var b = document.getElementById('cookie-banner');
    if (b) { b.classList.remove('hidden'); }
  };
  document.querySelectorAll('.f-cookies').forEach(function (btn) {
    btn.addEventListener('click', window.resetCookieConsent);
  });
})();
