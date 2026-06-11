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
        if (ok) ok.classList.add('show');
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

  /* —— Secteurs : Cartes + Modales —— */
  var sectorsData = [
    {
      id: "sante",
      title: "Santé",
      problem: "Hôpitaux, cliniques, laboratoires : périmètres sensibles à sécuriser",
      benefits: ["Couverture 24/7 des zones critiques", "Levée de doute < 60s", "Traçabilité réglementaire"],
      stat: "95% des intrusions hospitalières détectées en dehors des horaires",
      description: "Les établissements de santé combinent sécurité des patients, protection des données et enjeux réglementaires. FLEAT couvre les zones critiques (urgences, maternité) et les périmètres que les caméras fixes ne voient pas.",
      useCase: "Un hôpital universitaire couvre 8 hectares avec 3 drones. Les rondes nocturnes automatiques réduisent le personnel de nuit et documentent chaque événement.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>'
    },
    {
      id: "energie",
      title: "Énergie & Infrastructure",
      problem: "Centrales, sous-stations, réseaux : sites OIV à conformité stricte",
      benefits: ["Conformité réglementaire OIV", "Inspection périmètres étendus", "Documentation complète"],
      stat: "100% des sites OIV soumis à obligations renforcées de surveillance",
      description: "Les infrastructures énergétiques combinent enjeux stratégiques et réglementaires. FLEAT offre une documentation complète pour les rapports légaux et une couverture des zones tampons.",
      useCase: "Une centrale électrique utilise FLEAT pour les inspections de clôture et la levée de doute après alerte intrusion.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2v6M13 16v6M6.5 9.5L2 14m20-4l-4.5 4.5M3 21h18"/></svg>'
    },
    {
      id: "datacenter",
      title: "Data Centers & Télécoms",
      problem: "Sites 24/7, périmètres critiques, redondance de sécurité",
      benefits: ["Surveillance ininterrompue", "Intégration SIEM native", "Traçabilité continue"],
      stat: "ROI datacenter : coût drone < 15% d'une intrusion réussie",
      description: "Les data centers ne s'arrêtent jamais. FLEAT s'intègre aux systèmes existants pour fournir une couche de sécurité périmétrique automatisée et documentée.",
      useCase: "Un opérateur télécoms utilise FLEAT pour surveiller 3 sites distants depuis un seul PC, réduisant les coûts de gardiennage de 35%.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 17h20M6 6h.01M6 11h.01M11 6h.01M11 11h.01M16 6h.01M16 11h.01"/></svg>'
    },
    {
      id: "ferroviaire",
      title: "Ferroviaire & Transports",
      problem: "Réseaux linéaires étendus, accès diffus, maintenance 24/7",
      benefits: ["Inspection rapide des lignes", "Surveillance des dépôts", "Détection d'intrusion précoce"],
      stat: "+30% de temps gagné sur les rondes de maintenance linéaire",
      description: "Les réseaux de transport s'étendent sur des dizaines de km. FLEAT inspecte rapidement les zones critiques (aiguillages, passages à niveau) et sécurise les dépôts.",
      useCase: "Une ligne ferroviaire régionale utilise FLEAT pour les patrouilles nocturnes et les vérifications après alerte capteur.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 0-2 2v2h22v-2a2 2 0 0 0-2-2h-2M8 4h8v8H8z"/><path d="M2 15h20"/></svg>'
    },
    {
      id: "industrie",
      title: "Industrie Manufacturière",
      problem: "Grandes surfaces, zones techniques, arrêts de production",
      benefits: ["Couverture complète sans angle mort", "Levée de doute sur alerte", "Inspection après incident"],
      stat: "68% des intrusions industrielles en dehors des horaires de production",
      description: "Un site industriel de plusieurs hectares présente des zones inaccessibles et dangereuses. FLEAT couvre les angles morts que personne ne surveille vraiment.",
      useCase: "Une usine agroalimentaire déploie le drone la nuit pour couvrir 2 hectares sans effectifs supplémentaires.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 5V3h20v2M8 19v2M16 19v2"/></svg>'
    },
    {
      id: "logistique",
      title: "Logistique & Entreposage",
      problem: "Grandes surfaces (20 000+ m²), flux 24/7, zones extérieures",
      benefits: ["Couverture sans angle mort", "Dissuasion par présence visible", "Réduction fausses alarmes"],
      stat: "4 Md€ de pertes annuelles liées aux vols en entrepôt",
      description: "Les plateformes logistiques cumulent défis : surfaces étendues, valeurs importantes, accès nombreux. FLEAT couvre les cours et quais que les caméras fixes manquent.",
      useCase: "Un entrepôt de 15 000 m² + cours extérieure couvre l'ensemble en une mission automatisée chaque nuit.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9a3 3 0 0 1 6 0M3 7.5v7.5a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V7.5"/><path d="M3 7.5h18M8 7.5v-3a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5v3"/></svg>'
    },
    {
      id: "carrieres",
      title: "Carrières, Mines & Extraction",
      problem: "Terrains accidentés, zones de dépôt, intrusions clandestines",
      benefits: ["Inspection terrains accidentés", "Surveillance des dépôts", "Levée de doute précoce"],
      stat: "+40% de réduction des vols de matériel année 1",
      description: "Les carrières et sites d'extraction font face à des vols organisés et des intrusions dangereuses. FLEAT surveille les zones difficiles d'accès et dissuade les intrusions.",
      useCase: "Une carrière de granulats utilise FLEAT pour les rondes nocturnes et la vérification après tentative de vol.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20M4 16l4-10h8l4 10"/></svg>'
    },
    {
      id: "solaire",
      title: "Parcs Solaires & Agrivoltaïsme",
      problem: "Vastes terres, panneaux dispersés, accès difficile",
      benefits: ["Surveillance des panneaux", "Levée de doute sur panne", "Inspection d'intégrité"],
      stat: "ROI inspection drone vs équipe terrain : 5:1 en temps et sécurité",
      description: "Les parcs solaires et installations agrivoltaïques s'étendent sur de grandes surfaces. FLEAT inspecte rapidement les panneaux et surveille les périmètres.",
      useCase: "Un parc solaire de 40 hectares utilise FLEAT pour les inspections thermiques et les patrouilles de sécurité.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="9"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>'
    },
    {
      id: "dechets",
      title: "Traitement Déchets & Eau",
      problem: "Stations souvent isolées, intrusions, pollution accidentelle",
      benefits: ["Surveillance 24/7 isolée", "Prévention vol ferrailles", "Documentation incidents"],
      stat: "Stations d'épuration : 70% des vols de métaux la nuit",
      description: "Les stations de traitement d'eau et de déchets sont souvent isolées et peu surveillées. FLEAT assure une présence permanente.",
      useCase: "Une station d'épuration couvre l'ensemble du site et les abords avec un seul drone programmé.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8M12 14v8M2 12h8M14 12h8"/><path d="M7 7l5.5-5.5M7 17l5.5 5.5M17 7l-5.5-5.5M17 17l-5.5 5.5"/></svg>'
    },
    {
      id: "retail",
      title: "Retail Parks & Centres Commerciaux",
      problem: "Multiples enseignes, parkings vastes, zones mortes",
      benefits: ["Couverture parkings illimités", "Prévention vol marchandises", "Appui sécurité événementiel"],
      stat: "+25% réduction vols parking année 1 après déploiement",
      description: "Les centres commerciaux et retail parks cumulent défis : surfaces vastement dispersées, parkings difficiles à couvrir. FLEAT surveille les zones que les caméras fixes manquent.",
      useCase: "Un ensemble commercial de 80 ha surveille les parkings et les accès avec 2 drones intégrés au poste de sécurité.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2zM8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>'
    },
    {
      id: "eolien",
      title: "Parcs Éoliens & Réseaux",
      problem: "Vastes étendues, mâts difficiles à surveiller, maintenance régulière",
      benefits: ["Inspection rapide des mâts", "Surveillance périmètre", "Documentation maintenance"],
      stat: "75% des maintenances requièrent une inspection aérienne préalable",
      description: "Les parcs éoliens s'étendent sur des km². FLEAT accélère les inspections de mâts et surveille les périmètres.",
      useCase: "Un parc de 20 MW utilise FLEAT pour les inspections techniques et les patrouilles de nuit.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M6 12a6 6 0 0 1 12 0"/><path d="M3 12a9 9 0 0 1 18 0"/></svg>'
    }
  ];

  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function renderSectorsGrid() {
    var grid = document.querySelector('.sectors-grid');
    if (!grid) return;
    grid.innerHTML = '';
    sectorsData.forEach(function(sector) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'sector-card reveal';
      card.setAttribute('aria-label', 'En savoir plus : ' + sector.title);
      card.innerHTML =
        '<div class="sc-head">' +
          '<span class="ico" aria-hidden="true">' + sector.icon + '</span>' +
          '<h3>' + sector.title + '</h3>' +
        '</div>' +
        '<div class="sc-body">' +
          '<p class="sc-problem">' + sector.problem + '</p>' +
          '<ul class="sc-benefits">' +
            sector.benefits.map(function(b) { return '<li>' + CHECK_SVG + '<span>' + b + '</span></li>'; }).join('') +
          '</ul>' +
          '<div class="sc-foot">' +
            '<div class="sc-stat">' + sector.stat + '</div>' +
            '<span class="sc-more">En savoir plus' + ARROW_SVG + '</span>' +
          '</div>' +
        '</div>';
      card.addEventListener('click', function() { openSectorModal(sector); });
      grid.appendChild(card);
    });
    // (re)brancher l'observateur de reveal sur les nouvelles cartes
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

  function openSectorModal(sector) {
    var modal = document.getElementById('sector-modal');
    if (!modal) return;
    document.querySelector('.modal-icon').innerHTML = sector.icon;
    document.querySelector('.modal-title').textContent = sector.title;
    document.querySelector('.modal-description').textContent = sector.description;
    document.querySelector('.modal-usecase').textContent = sector.useCase;
    var benefitsList = document.querySelector('.modal-benefits');
    benefitsList.innerHTML = sector.benefits.map(function(b) { return '<li>' + CHECK_SVG + '<span>' + b + '</span></li>'; }).join('');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSectorModal() {
    var modal = document.getElementById('sector-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Rendu initial
  renderSectorsGrid();

  // Gestion des clics
  var modal = document.getElementById('sector-modal');
  if (modal) {
    document.querySelector('.sector-modal-close').addEventListener('click', closeSectorModal);
    document.querySelector('.sector-modal-backdrop').addEventListener('click', closeSectorModal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeSectorModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeSectorModal();
    });
  }
})();
