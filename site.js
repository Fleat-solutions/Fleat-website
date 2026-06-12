/* FLEAT — interactions du site vitrine */
(function () {
  'use strict';

  /* —— Header : ombre/bordure au scroll —— */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* —— Menu mobile —— */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
      var open = document.body.classList.contains('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
    });
  }

  /* —— Reveal au scroll —— */
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

  /* —— FAQ accordéon —— */
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

  /* —— Formulaires de contact : validation + état succès —— */
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
        if (ok) { ok.classList.add('show'); ok.scrollTop = 0; }
      }, 700);
    });
  });

  /* —— Année footer —— */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* —— Mockup timer + timestamp —— */
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

  /* —— Bannière cookies RGPD —— */
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
  /* —— Reset préférences cookies (accessible depuis confidentialite.html) —— */
  window.resetCookieConsent = function () {
    localStorage.removeItem('fleat_cookie_consent');
    var b = document.getElementById('cookie-banner');
    if (b) { b.classList.remove('hidden'); }
  };

  /* —— Secteurs : Données commerciales —— */
  var sectorsData = [
    {
      id: "sante",
      title: "Santé",
      badge: "Critique",
      problem: "Hôpitaux, cliniques, laboratoires",
      benefits: ["Couverture 24/7 zones critiques", "Levée de doute < 60s", "Traçabilité réglementaire"],
      kpi: { value: "95%", label: "des intrusions<br>détectées la nuit" },
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>'
    },
    {
      id: "energie",
      title: "Énergie & Infra",
      badge: "OIV",
      problem: "Centrales, sous-stations, réseaux",
      benefits: ["Conformité réglementaire OIV", "Inspection périmètres", "Documentation légale"],
      kpi: { value: "100%", label: "des sites OIV soumis<br>à obligations" },
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2v6M13 16v6M6.5 9.5L2 14m20-4l-4.5 4.5M3 21h18"/></svg>'
    },
    {
      id: "datacenter",
      title: "Data Centers",
      badge: "24/7",
      problem: "Sites 24/7, périmètres critiques",
      benefits: ["Surveillance ininterrompue", "Intégration SIEM", "Traçabilité continue"],
      kpi: { value: "< 15%", label: "du coût d'une<br>intrusion" },
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 17h20M6 6h.01M6 11h.01M11 6h.01M11 11h.01M16 6h.01M16 11h.01"/></svg>'
    },
    {
      id: "industrie",
      title: "Industrie",
      badge: "Production",
      problem: "Grandes surfaces, zones techniques",
      benefits: ["Couverture sans angle mort", "Levée de doute alerte", "Inspection après incident"],
      kpi: { value: "68%", label: "des intrusions<br>en dehors heures" },
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 5V3h20v2M8 19v2M16 19v2"/></svg>'
    },
    {
      id: "logistique",
      title: "Logistique",
      badge: "Flux 24/7",
      problem: "Grandes surfaces (20 000+ m²)",
      benefits: ["Couverture sans angle mort", "Dissuasion visible", "Réduction fausses alarmes"],
      kpi: { value: "4Md€", label: "de pertes annuelles<br>en entreposage" },
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9a3 3 0 0 1 6 0M3 7.5v7.5a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V7.5"/><path d="M3 7.5h18M8 7.5v-3a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5v3"/></svg>'
    },
    {
      id: "ferroviaire",
      title: "Transports",
      badge: "Réseau",
      problem: "Réseaux linéaires, maintenance 24/7",
      benefits: ["Inspection rapide lignes", "Surveillance dépôts", "Détection précoce"],
      kpi: { value: "+30%", label: "de temps gagné<br>en maintenance" },
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 0-2 2v2h22v-2a2 2 0 0 0-2-2h-2M8 4h8v8H8z"/><path d="M2 15h20"/></svg>'
    },
    {
      id: "solaire",
      title: "Parcs Solaires",
      badge: "Énergies",
      problem: "Vastes terres, panneaux dispersés",
      benefits: ["Surveillance panneaux", "Levée doute panne", "Inspection thermique"],
      kpi: { value: "5:1", label: "ROI vs équipe<br>terrain" },
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="9"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>'
    },
    {
      id: "carrieres",
      title: "Mines & Carrières",
      badge: "Extraction",
      problem: "Terrains accidentés, zones dépôt",
      benefits: ["Inspection terrains", "Surveillance dépôts", "Levée de doute"],
      kpi: { value: "+40%", label: "réduction vols<br>matériel année 1" },
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20M4 16l4-10h8l4 10"/></svg>'
    }
  ];

  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function renderSectorsGrid() {
    var grid = document.querySelector('.sectors-grid');
    if (!grid) return;
    grid.innerHTML = '';
    sectorsData.forEach(function(sector) {
      var card = document.createElement('a');
      card.href = '#'; // sera onclick pour scroll/highlight
      card.className = 'sector-card reveal';
      card.setAttribute('data-sector', sector.id);
      card.innerHTML =
        '<div class="sc-icon-badge">' +
          '<div class="sc-icon" aria-hidden="true">' + sector.icon + '</div>' +
          '<span class="sc-badge">' + sector.badge + '</span>' +
        '</div>' +
        '<div class="sc-content">' +
          '<h3 class="sc-title">' + sector.title + '</h3>' +
          '<p class="sc-problem">' + sector.problem + '</p>' +
          '<ul class="sc-benefits">' +
            sector.benefits.map(function(b) { return '<li>' + CHECK_SVG + '<span>' + b + '</span></li>'; }).join('') +
          '</ul>' +
        '</div>' +
        '<div class="sc-kpi">' +
          '<div class="kpi-item">' +
            '<div class="kpi-number">' + sector.kpi.value + '</div>' +
            '<div class="kpi-label">' + sector.kpi.label + '</div>' +
          '</div>' +
          '<span class="sc-cta">En savoir plus ' + ARROW_SVG + '</span>' +
        '</div>';
      card.addEventListener('click', function(e) {
        e.preventDefault();
        // Scroll vers le secteur ou ouvre un détail (à implémenter)
      });
      grid.appendChild(card);
    });
    // Ajouter les filtres
    var filtersContainer = document.getElementById('sector-filters');
    if (filtersContainer) {
      sectorsData.forEach(function(sector) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sector-filter-btn';
        btn.setAttribute('data-sector', sector.id);
        btn.innerHTML = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;"></span>' + sector.badge;
        btn.addEventListener('click', function() {
          // Filtrer
          document.querySelectorAll('.sector-filter-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
        });
        filtersContainer.appendChild(btn);
      });
    }
    // Reveal animations
    if ('IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); sio.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      grid.querySelectorAll('.sector-card').forEach(function (el) { sio.observe(el); });
    } else {
      grid.querySelectorAll('.sector-card').forEach(function (el) { el.classList.add('in'); });
    }
  }

  // Rendu initial
  renderSectorsGrid();
})();
