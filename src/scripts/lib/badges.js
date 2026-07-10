import { getFavorites } from './store';

export function updateBadges() {
  const favCount = getFavorites().length;

  document.querySelectorAll('[data-fav-count]').forEach((badge) => {
    badge.textContent = String(favCount);
    badge.classList.toggle('hidden', favCount === 0);
  });

  document.querySelectorAll('.favorite-toggle').forEach((button) => {
    const active = getFavorites().includes(button.dataset.favId);
    button.textContent = active ? button.dataset.activeLabel || 'Guardado' : button.dataset.label || 'Guardar';
    button.setAttribute('aria-pressed', String(active));
  });
}
