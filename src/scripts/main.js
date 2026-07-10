import { updateBadges } from './lib/badges';
import { applyFilters, increaseVisibleLimit, initSearchPage, resetVisibleLimit } from './lib/catalogFilters';
import { renderFavorites, toggleFavorite } from './lib/favorites';
import { initCarousels, initChat, initGallery, initMobileMenu, initSearchSuggestions } from './lib/ui';

document.addEventListener('click', (event) => {
  const favButton = event.target.closest('.favorite-toggle');
  if (favButton) toggleFavorite(favButton.dataset.favId);

  if (event.target.closest('[data-load-more]')) increaseVisibleLimit();
});

document.addEventListener('input', (event) => {
  if (event.target.closest('[data-filters]')) {
    resetVisibleLimit();
    applyFilters();
  }

});

document.addEventListener('store:change', updateBadges);

initMobileMenu();
initChat();
initGallery();
initCarousels();
initSearchSuggestions();
updateBadges();
renderFavorites();
applyFilters();
initSearchPage();
