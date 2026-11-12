/* FLEAT : interactions du site vitrine */
(function () {
  'use strict';

  /* Navigation : page en cours mise en évidence automatiquement */
  var page = '/' + decodeURIComponent(location.pathname.split('/').pop()).replace(/\.html$/, '').replace(/^index$/, '');
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
    /* Ce qui dépasse déjà dans l'écran au chargement s'affiche tout de suite,
       sinon la section qui suit le hero reste invisible dans la zone d'aperçu. */
    var vh = window.innerHeight;
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh) { el.classList.add('in'); }
      else { io.observe(el); }
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Vidéos d'illustration : chargées et lues seulement quand elles sont visibles.
     Si la lecture automatique est impossible (animations réduites, mode économie d'énergie), un bouton permet de la lancer. */
  var videos = document.querySelectorAll('video[data-autoplay]');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  videos.forEach(function (v) {
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'vid-play'; btn.hidden = true;
    btn.setAttribute('aria-label', "Lire l'animation");
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
    v.parentNode.appendChild(btn);
    btn.addEventListener('click', function () { v.dataset.manual = '1'; var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    v.addEventListener('playing', function () { btn.hidden = true; });
    v.addEventListener('pause', function () { if (v.dataset.manual || reduceMotion) btn.hidden = false; });
    v.__offer = function () { btn.hidden = false; };
  });
  if (videos.length && !reduceMotion && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { v.__offer(); }); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { vio.observe(v); });
  } else {
    videos.forEach(function (v) { v.__offer(); });
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

  /* Règles des champs de formulaire (attribut data-rule).
     Renvoie un message d'erreur, ou une chaîne vide si la valeur est acceptée.
     Un champ facultatif vide est accepté ; s'il est rempli, la règle s'applique. */
  var FIELD_RULES = {
    nom: function (v) {
      if (v.length < 2) return 'Au moins 2 lettres';
      if (v.length > 50) return '50 caractères maximum';
      if (!/^\p{L}[\p{L}'’ -]*\p{L}$/u.test(v)) return 'Lettres, espaces, tirets et apostrophes uniquement';
      if (/[ '’-]{2}/.test(v)) return 'Saisie invalide';
      return '';
    },
    texte: function (v) {
      if (v.length < 2) return 'Au moins 2 caractères';
      if (v.length > 80) return '80 caractères maximum';
      if (!/\p{L}/u.test(v)) return 'Saisie invalide';
      if (!/^[\p{L}\p{N} &'’.,()/+-]+$/u.test(v)) return 'Caractères spéciaux non acceptés';
      return '';
    },
    email: function (v) {
      if (v.length > 254) return 'Adresse trop longue';
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(v) || /\.\./.test(v) || /^\.|\.@/.test(v)) {
        return 'Adresse e-mail invalide (ex. jean@societe.fr)';
      }
      return '';
    },
    tel: function (v) {
      if (/[^\d\s.+()-]/.test(v)) return 'Chiffres uniquement (ex. 06 12 34 56 78)';
      var n = v.replace(/[\s.()-]/g, '').replace(/^00/, '+');
      var fr = /^0[1-9]\d{8}$/.test(n) || /^\+33[1-9]\d{8}$/.test(n);
      var intl = /^\+(?!33)[1-9]\d{7,14}$/.test(n);
      if (!fr && !intl) return 'Numéro invalide (ex. 06 12 34 56 78 ou +33 6 12 34 56 78)';
      if (/^(?:0|\+33)(\d)\1{8}$/.test(n)) return 'Numéro invalide';
      return '';
    },
    message: function (v) {
      if (v.length > 2000) return '2000 caractères maximum';
      if (/<[^>]*>/.test(v)) return 'Le code HTML n\'est pas accepté';
      if ((v.match(/https?:\/\/|www\./gi) || []).length > 2) return 'Trop de liens dans le message';
      return '';
    }
  };
  window.fleatFieldError = function (el) {
    if (el.type === 'checkbox') return el.required && !el.checked ? 'Requis' : '';
    var v = el.value.replace(/\s+/g, ' ').trim();
    if (!v) return el.required ? 'Champ requis' : '';
    var rule = FIELD_RULES[el.dataset.rule];
    return rule ? rule(v) : '';
  };
  /* Affiche ou retire le message d'erreur dans le conteneur du champ */
  window.fleatShowError = function (el, wrap, errClass, msg) {
    if (!wrap) return;
    wrap.classList.toggle(errClass, !!msg);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    var box = wrap.querySelector('.err-msg');
    if (box && msg) box.textContent = msg;
  };

  /* Formulaires de contact : validation + état succès */
  function setFieldError(field, msg) {
    window.fleatShowError(field, field.closest('.field') || field.closest('.consent'), 'error', msg);
  }
  document.querySelectorAll('.js-contact-form').forEach(function (form) {
    function validate() {
      var ok = true;
      form.querySelectorAll('[required], [data-rule]').forEach(function (el) {
        var msg = window.fleatFieldError(el);
        setFieldError(el, msg);
        if (msg) ok = false;
      });
      return ok;
    }

    // efface l'erreur dès que le champ est corrigé
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () { setFieldError(el, ''); });
      el.addEventListener('change', function () { if (el.type === 'checkbox' || el.tagName === 'SELECT') setFieldError(el, ''); });
      // à la sortie du champ, vérifie la saisie si elle n'est pas vide
      el.addEventListener('blur', function () { if (el.value.trim() && el.type !== 'checkbox') setFieldError(el, window.fleatFieldError(el)); });
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

  /* Comparateurs avant, après (cas d'usage, pages secteurs) */
  document.querySelectorAll('.cmp').forEach(function (cmp) {
    var r = cmp.querySelector('input[type=range]');
    if (!r) return;
    function apply() { cmp.style.setProperty('--p', r.value + '%'); }
    r.addEventListener('input', apply); apply();
  });
})();
