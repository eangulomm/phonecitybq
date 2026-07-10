const CHAT_CLOSED_KEY = 'premium_chat_closed';
const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('hidden') === false;
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

export function initChat() {
  const panel = document.querySelector('[data-chat-panel]');
  const openButton = document.querySelector('[data-chat-open]');
  const closeButton = document.querySelector('[data-chat-close]');
  if (!panel || !openButton || !closeButton) return;

  const setOpen = (open) => {
    panel.classList.toggle('hidden', !open);
    openButton.classList.toggle('hidden', open);
    localStorage.setItem(CHAT_CLOSED_KEY, open ? 'false' : 'true');
  };

  setOpen(localStorage.getItem(CHAT_CLOSED_KEY) !== 'true');
  closeButton.addEventListener('click', () => setOpen(false));
  openButton.addEventListener('click', () => setOpen(true));
}

export function initGallery() {
  document.addEventListener('click', (event) => {
    const thumbnail = event.target.closest('.thumbnail');
    if (!thumbnail) return;
    const main = document.querySelector('.product-main-image');
    if (main) main.src = thumbnail.dataset.image;
  });
}

export function initSearchSuggestions() {
  document.querySelectorAll('[data-search-suggest]').forEach((form) => {
    const input = form.querySelector('[data-search-input]');
    const results = form.querySelector('[data-search-results]');
    if (!input || !results) return;

    let products = [];
    let activeIndex = -1;
    try {
      products = JSON.parse(form.dataset.products || '[]');
    } catch {
      products = [];
    }

    const close = () => {
      results.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
      activeIndex = -1;
    };

    const open = () => {
      results.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
    };

    const render = () => {
      const query = normalize(input.value);
      if (!query) {
        close();
        return;
      }

      const matches = products
        .filter((product) => {
          const haystack = normalize([product.name, product.brand, product.category].join(' '));
          return haystack.includes(query);
        })
        .slice(0, 6);

      if (!matches.length) {
        results.innerHTML = `
          <div class="px-3 py-3 text-sm text-muted">No encontramos coincidencias.</div>
          <a class="block rounded-xl px-3 py-3 text-sm font-black text-brand hover:bg-paper" href="/buscar?q=${encodeURIComponent(input.value)}">Ver busqueda completa</a>
        `;
        open();
        return;
      }

      results.innerHTML = matches
        .map(
          (product, index) => `
            <a
              class="search-suggestion grid grid-cols-[44px_1fr] gap-3 rounded-xl p-2 transition hover:bg-paper"
              href="${escapeHtml(product.url)}"
              data-suggestion-index="${index}"
            >
              <img class="h-11 w-11 rounded-xl border border-line bg-paper object-contain" src="${escapeHtml(product.image || '')}" alt="" loading="lazy" />
              <span class="min-w-0">
                <span class="block truncate text-sm font-black">${escapeHtml(product.name)}</span>
                <span class="block truncate text-xs text-muted">${escapeHtml(product.brand || product.category || '')} · ${money.format(Number(product.price || 0))}</span>
              </span>
            </a>
          `,
        )
        .join('');
      activeIndex = -1;
      open();
    };

    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('keydown', (event) => {
      const items = [...results.querySelectorAll('.search-suggestion')];
      if (!items.length || results.classList.contains('hidden')) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        focusSuggestion(items, activeIndex);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        focusSuggestion(items, activeIndex);
      }

      if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault();
        items[activeIndex].click();
      }

      if (event.key === 'Escape') close();
    });

    document.addEventListener('click', (event) => {
      if (!form.contains(event.target)) close();
    });
  });
}

function focusSuggestion(items, index) {
  items.forEach((item) => item.classList.remove('bg-paper'));
  items[index]?.classList.add('bg-paper');
  items[index]?.scrollIntoView({ block: 'nearest' });
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
