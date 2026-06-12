// Navigation mobile toggle

document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.m-link');

  if (!navToggle || !mobileMenu) return;

  // Toggle menu
  navToggle.addEventListener('click', function() {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', !isExpanded);
    mobileMenu.classList.toggle('active');
  });

  // Close menu when clicking a link
  mobileLinks.forEach(link => {
    link.addEventListener('click', function() {
      navToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.site-header')) {
      navToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('active');
    }
  });
});
