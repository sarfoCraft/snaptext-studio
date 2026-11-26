(function () {
  'use strict';
  var toggle = document.getElementById('themeToggle');
  var icon = document.getElementById('themeIcon');
  function getStoredTheme() {
    try { return localStorage.getItem('wordtopdf-theme'); } catch (e) { return null; }
  }
  function setStoredTheme(value) {
    try { localStorage.setItem('wordtopdf-theme', value); } catch (e) {}
  }
  function updateIcon(theme) {
    if (!icon) return;
    icon.innerHTML = theme === 'dark'
      ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>';
  }
  var saved = getStoredTheme();
  if (saved === 'dark' || saved === 'light') document.documentElement.setAttribute('data-theme', saved);
  updateIcon(document.documentElement.getAttribute('data-theme') || 'light');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      setStoredTheme(next);
      updateIcon(next);
    });
  }
  var menuButton = document.getElementById('mobileMenuToggle');
  var menu = document.getElementById('primaryNavigation');
  if (menuButton && menu) {
    function closeMenu() {
      menu.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
    }
    menuButton.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (event) {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
    menu.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
  }
})();
