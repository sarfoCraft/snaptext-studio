(function () {
  'use strict';

  var search = document.getElementById('notFoundToolSearch');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-item]'));
  var status = document.getElementById('notFoundSearchStatus');
  var emptyState = document.getElementById('notFoundNoResults');

  if (!search || !cards.length || !status || !emptyState) return;

  search.addEventListener('input', function () {
    var query = search.value.trim().toLowerCase();
    var visibleCount = 0;

    cards.forEach(function (card) {
      var searchableText = (card.getAttribute('data-search-text') || card.textContent || '').toLowerCase();
      var matches = !query || searchableText.indexOf(query) !== -1;
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    emptyState.hidden = visibleCount !== 0;
    if (!query) {
      status.textContent = 'Browse all ' + cards.length + ' tools.';
    } else {
      status.textContent = visibleCount + (visibleCount === 1 ? ' tool found.' : ' tools found.');
    }
  });
})();
