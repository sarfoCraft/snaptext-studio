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
  // Remove the old Monetag service worker if a visitor installed it previously.
  // The current Adsterra display and Monetag In-Page Push tags are separate from the old notification service worker.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      registrations.forEach(function (registration) {
        var worker = registration.active || registration.waiting || registration.installing;
        var scriptUrl = worker && worker.scriptURL;
        if (!scriptUrl) return;
        try {
          var parsedUrl = new URL(scriptUrl, window.location.href);
          if (parsedUrl.origin === window.location.origin && parsedUrl.pathname === '/sw.js') {
            registration.unregister();
          }
        } catch (error) {}
      });
    }).catch(function () {});
  }

  // Show an ad placement only after the supplied Adsterra tag inserts its iframe.
  // If the tag is blocked or no ad is returned, remove the hidden placement cleanly.
  document.querySelectorAll('.wtd-ad-placement .wtd-ad-slot[hidden]').forEach(function (slot) {
    var placement = slot.closest('.wtd-ad-placement');
    var code = slot.querySelector('.wtd-ad-code');
    if (!placement || !code) return;

    var observer = new MutationObserver(function () { revealAd(); });
    var timeoutId;
    var finished = false;

    function revealAd() {
      if (finished) return true;
      var frame = code.querySelector('iframe');
      if (!frame) return false;

      if (!frame.hasAttribute('title')) frame.setAttribute('title', 'Advertisement');
      frame.style.display = 'block';
      frame.style.maxWidth = '100%';
      frame.style.border = '0';
      slot.hidden = false;
      placement.classList.add('is-ad-loaded');
      finished = true;
      observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
      return true;
    }

    observer.observe(code, { childList: true, subtree: true });

    var adScript = code.querySelector('script[src*="bauval.org/22/"]');
    if (adScript) {
      adScript.addEventListener('error', function () {
        if (finished) return;
        finished = true;
        observer.disconnect();
        if (timeoutId) window.clearTimeout(timeoutId);
        placement.remove();
      }, { once: true });
    }

    timeoutId = window.setTimeout(function () {
      if (!revealAd()) {
        finished = true;
        observer.disconnect();
        placement.remove();
      }
    }, 20000);

    revealAd();
  });
})();
