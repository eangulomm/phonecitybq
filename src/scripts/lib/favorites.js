import { escapeHtml, money } from './dom';
import { emitStoreChange, getFavorites, saveFavorites } from './store';

export function toggleFavorite(id) {
  const favorites = getFavorites();
  saveFavorites(favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id]);
  renderFavorites();
  emitStoreChange();
}

export function renderFavorites() {
  const holder = document.querySelector('[data-favorites-page]');
  if (!holder) return;

  const allProducts = JSON.parse(holder.dataset.products || '[]');
  const favorites = getFavorites();
  const products = allProducts.filter((product) => favorites.includes(product.id));

  holder.innerHTML = products.length
    ? products.map(renderFavoriteCard).join('')
    : '<p class="rounded-2xl border border-dashed border-line p-8 text-center text-muted sm:col-span-2 lg:col-span-4">Aun no tienes favoritos guardados.</p>';
}

function renderFavoriteCard(product) {
  return `
    <article class="surface rounded-[var(--radius-lg)] p-5">
      <img class="product-image mx-auto w-full max-w-[240px]" src="${escapeHtml(product.mainImage)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" />
      <h2 class="mt-4 font-black">${escapeHtml(product.name)}</h2>
      <p class="mt-2 text-muted">${money.format(product.price)}</p>
      <a class="btn-primary mt-4 w-full" href="/productos/${escapeHtml(product.slug)}">Ver producto</a>
    </article>`;
}
