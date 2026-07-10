import { money } from './dom';

const INITIAL_VISIBLE = 8;
let visibleLimit = INITIAL_VISIBLE;

export function applyFilters() {
  const grid = document.querySelector('[data-product-grid]');
  const filters = document.querySelector('[data-filters]');
  if (!grid || !filters) return;

  const cards = [...grid.querySelectorAll('.product-card')];
  const search = document.querySelector('[data-filter-search]')?.value.toLowerCase().trim() || '';
  const category = document.querySelector('[data-filter-category]')?.value || '';
  const brand = document.querySelector('[data-filter-brand]')?.value || '';
  const maxPrice = Number(document.querySelector('[data-filter-price]')?.value || Infinity);
  const stockOnly = document.querySelector('[data-filter-stock]')?.checked;
  const sort = document.querySelector('[data-filter-sort]')?.value || 'featured';
  const priceLabel = document.querySelector('[data-price-label]');
  if (priceLabel) priceLabel.textContent = money.format(maxPrice);

  const sorted = sortCards(cards, sort);
  sorted.forEach((card) => grid.appendChild(card));

  const matchingCards = sorted.filter((card) => {
    return (
      (!search || card.dataset.name.includes(search)) &&
      (!category || card.dataset.category === category) &&
      (!brand || card.dataset.brand === brand) &&
      Number(card.dataset.price) <= maxPrice &&
      (!stockOnly || Number(card.dataset.stock) > 0)
    );
  });

  sorted.forEach((card) => card.classList.add('hidden'));
  matchingCards.slice(0, visibleLimit).forEach((card) => card.classList.remove('hidden'));

  document.querySelector('[data-empty-products]')?.classList.toggle('hidden', matchingCards.length > 0);
  document.querySelector('[data-load-more]')?.classList.toggle('hidden', matchingCards.length <= visibleLimit);
}

export function resetVisibleLimit() {
  visibleLimit = INITIAL_VISIBLE;
}

export function increaseVisibleLimit() {
  visibleLimit += INITIAL_VISIBLE;
  applyFilters();
}

export function initSearchPage() {
  const page = document.querySelector('[data-search-page]');
  if (!page) return;

  const input = page.querySelector('[data-search-page-input]');
  const summary = page.querySelector('[data-search-summary]');
  const heading = page.querySelector('h1');
  const cards = [...page.querySelectorAll('.product-card')];
  const query = new URL(window.location.href).searchParams.get('q')?.trim() || '';

  if (input) input.value = query;
  cards.forEach((card) => {
    const visible = !query || card.dataset.name.includes(query.toLowerCase());
    card.classList.toggle('hidden', !visible);
  });

  const visibleCount = cards.filter((card) => !card.classList.contains('hidden')).length;
  if (heading) heading.textContent = query ? `Resultados para "${query}"` : 'Buscar productos';
  if (summary) {
    summary.textContent = query
      ? `${visibleCount} resultado${visibleCount === 1 ? '' : 's'} encontrado${visibleCount === 1 ? '' : 's'}.`
      : 'Escribe una referencia para filtrar el catálogo.';
  }
  page.querySelector('[data-empty-products]')?.classList.toggle('hidden', visibleCount > 0);
}

function sortCards(cards, sort) {
  return cards.sort((a, b) => {
    const pa = JSON.parse(a.dataset.product);
    const pb = JSON.parse(b.dataset.product);
    if (sort === 'price-asc') return pa.price - pb.price;
    if (sort === 'price-desc') return pb.price - pa.price;
    if (sort === 'name') return pa.name.localeCompare(pb.name);
    if (sort === 'new') return Number(pb.isNew) - Number(pa.isNew);
    return Number(pb.featured) - Number(pa.featured);
  });
}
