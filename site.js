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

  // Show an Adsterra placement only after its tag inserts an iframe.
  // If the tag is blocked or no ad is returned, remove the empty slot.
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

  // One Hostinger affiliate banner on the homepage, tool pages and guide pages.
  // Legal, contact, about and 404 pages are intentionally excluded.
  function addHostingerAffiliatePlacement() {
    var path = (window.location.pathname || '/')
      .replace(/\/index\.html$/i, '/')
      .replace(/\/?$/, '/');

    var toolPaths = [
      '/word-to-pdf/',
      '/pdf-to-word/',
      '/pdf-to-images/',
      '/images-to-pdf/',
      '/merge-pdf/',
      '/split-pdf/',
      '/compress-pdf/',
      '/image-to-text/',
      '/batch-ocr/',
      '/image-converter/',
      '/background-remover/',
      '/document-scanner/',
      '/qr-code-generator/'
    ];

    var isHome = path === '/';
    var isTool = toolPaths.indexOf(path) !== -1;
    var isToolsDirectory = path === '/tools/';
    var isArticlesIndex = path === '/articles/';
    var isArticle = /^\/articles\/[^/]+\/$/.test(path);

    if (!isHome && !isTool && !isToolsDirectory && !isArticlesIndex && !isArticle) return;
    if (document.querySelector('.wtd-hostinger-placement')) return;

    if (!document.querySelector('link[data-hostinger-affiliate-css]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/assets/css/hostinger-affiliate.css?v=20261128-1';
      css.setAttribute('data-hostinger-affiliate-css', '');
      document.head.appendChild(css);
    }

    var placement = document.createElement('aside');
    placement.className = 'wtd-hostinger-placement';
    placement.setAttribute('aria-label', 'Hostinger affiliate advertisement');

    var card = document.createElement('div');
    card.className = 'wtd-hostinger-card';

    var label = document.createElement('span');
    label.className = 'wtd-hostinger-ad-label';
    label.textContent = 'Advertisement';

    var anchor = document.createElement('a');
    anchor.className = 'wtd-hostinger-link';
    anchor.href = 'https://www.hostinger.com?REFERRALCODE=H2ABSTSARZDJ';
    anchor.target = '_blank';
    anchor.rel = 'sponsored nofollow noopener noreferrer';
    anchor.setAttribute('aria-label', 'Visit Hostinger using our affiliate link, opens in a new tab');

    var image = document.createElement('img');
    image.className = 'wtd-hostinger-image';
    image.src = '/assets/images/hostinger-affiliate.webp';
    image.width = 180;
    image.height = 538;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = 'Hostinger: Build your website today. Reliable web hosting for your next big idea. Get started.';
    anchor.appendChild(image);

    var disclosure = document.createElement('p');
    disclosure.className = 'wtd-hostinger-disclosure';
    disclosure.textContent = 'Affiliate link. We may earn a commission at no extra cost to you.';

    card.appendChild(label);
    card.appendChild(anchor);
    card.appendChild(disclosure);
    placement.appendChild(card);

    var main = document.querySelector('main');
    if (!main) return;

    if (isHome) {
      var homeAd = document.querySelector('#tool-word-pdf + .wtd-ad-placement');
      var homeTool = document.querySelector('#tool-word-pdf');
      if (homeAd) {
        homeAd.insertAdjacentElement('afterend', placement);
      } else if (homeTool) {
        homeTool.insertAdjacentElement('afterend', placement);
      } else {
        main.insertAdjacentElement('afterend', placement);
      }
      return;
    }

    var existingAd = main.querySelector('.wtd-ad-placement');
    if (!existingAd && main.nextElementSibling && main.nextElementSibling.classList.contains('wtd-ad-placement')) {
      existingAd = main.nextElementSibling;
    }

    if (existingAd) {
      existingAd.insertAdjacentElement('afterend', placement);
    } else {
      main.insertAdjacentElement('afterend', placement);
    }
  }

  addHostingerAffiliatePlacement();
})();
