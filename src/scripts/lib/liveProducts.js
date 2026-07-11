const API_BASE_URL = import.meta.env.PUBLIC_APPS_SCRIPT_API_URL || '';
const DATA_SOURCE = import.meta.env.PUBLIC_DATA_SOURCE || 'mock';
const BASE_PATH = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const FALLBACK_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 600 600%22%3E%3Crect width=%22600%22 height=%22600%22 fill=%22%23f1f5f9%22/%3E%3Ctext x=%22300%22 y=%22305%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2228%22 fill=%22%2364758b%22%3EImagen no disponible%3C/text%3E%3C/svg%3E';

const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

let liveProductsPromise;

export function initLiveProducts() {
  const liveTargets = document.querySelectorAll('[data-live-products]');
  const detailTarget = document.querySelector('[data-live-product-detail]');
  if ((!liveTargets.length && !detailTarget) || DATA_SOURCE !== 'remote' || !API_BASE_URL) return;

  getLiveProducts().then((products) => {
    if (!products.length) return;

    updateSearchSuggestionData(products);
    liveTargets.forEach((target) => renderLiveTarget(target, products));
    if (detailTarget) renderLiveDetail(detailTarget, products);

    document.dispatchEvent(new CustomEvent('products:live-rendered'));
  });
}

export function getLiveProducts() {
  if (!liveProductsPromise) {
    liveProductsPromise = fetchProducts().catch((error) => {
      console.warn('No se pudieron cargar productos en vivo.', error);
      return [];
    });
  }
  return liveProductsPromise;
}

async function fetchProducts() {
  const url = new URL(API_BASE_URL);
  url.searchParams.set('resource', 'products');
  url.searchParams.set('_', String(Date.now()));

  let payload;
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    payload = await response.json();
  } catch {
    payload = await fetchJsonp(url);
  }

  if (payload?.ok === false) return [];
  const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  return rows.map(normalizeProduct).filter(isIphoneProduct);
}

function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `__phoneCityProducts_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('JSONP timeout'));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    url.searchParams.set('callback', callbackName);
    script.src = url.toString();
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP request failed'));
    };
    document.head.appendChild(script);
  });
}

function renderLiveTarget(target, products) {
  const scope = target.dataset.liveScope || 'all';
  const mode = target.dataset.liveProducts;
  const scopedProducts = products.filter((product) => matchesScope(product, scope));

  if (mode === 'carousel') {
    const track = target.querySelector('[data-live-track]');
    if (!track) return;
    track.innerHTML = scopedProducts.map((product) => `<div class="w-[min(82vw,330px)] shrink-0 snap-start sm:w-[320px] lg:w-[280px]">${renderProductCard(product)}</div>`).join('');
    target.querySelector('[data-carousel-prev]')?.classList.toggle('hidden', scopedProducts.length <= 1);
    target.querySelector('[data-carousel-next]')?.classList.toggle('hidden', scopedProducts.length <= 1);
    return;
  }

  target.innerHTML = scopedProducts.map(renderProductCard).join('');
}

function renderLiveDetail(target, products) {
  const slug = normalizeSlug(new URL(window.location.href).searchParams.get('slug') || '');
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    target.innerHTML = `
      <div class="container max-w-2xl text-center">
        <p class="eyebrow">Producto no encontrado</p>
        <h1 class="mt-3 text-4xl font-black sm:text-5xl">Este producto no está disponible</h1>
        <p class="mt-5 leading-8 text-muted">Puede que esté inactivo o que la URL haya cambiado.</p>
        <a class="btn-primary mt-8" href="${pathWithBase('/productos')}">Volver al catálogo</a>
      </div>
    `;
    return;
  }

  document.title = `${product.name} | Phone City BQ`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', product.description || `Detalle de ${product.name}`);

  target.innerHTML = renderProductDetail(product);
}

function updateSearchSuggestionData(products) {
  const searchProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    image: product.mainImage,
    url: productDetailUrl(product.slug),
  }));

  document.querySelectorAll('[data-search-suggest]').forEach((form) => {
    form.dataset.products = JSON.stringify(searchProducts);
  });
}

function renderProductCard(product) {
  return `
    <article
      class="product-card group surface grid overflow-hidden rounded-[var(--radius-lg)] transition hover:-translate-y-1 hover:shadow-lift"
      data-product="${escapeHtml(JSON.stringify(product))}"
      data-category="${escapeHtml(product.category)}"
      data-brand="${escapeHtml(product.brand)}"
      data-price="${product.price}"
      data-stock="${product.stock}"
      data-name="${escapeHtml(`${product.name} ${product.brand} ${product.sku}`.toLowerCase())}"
    >
      <div class="grid bg-paper p-5">
        <div class="mb-3 flex min-h-8 items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            ${product.isNew ? '<span class="rounded-full bg-brand/10 px-3 py-1 text-xs font-black text-brand">Nuevo</span>' : ''}
            ${product.discount > 0 ? `<span class="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black text-amber-700">-${product.discount}%</span>` : ''}
          </div>
          <span class="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-black text-brand">Phone City BQ</span>
        </div>
        <a href="${productDetailUrl(product.slug)}" aria-label="Ver detalle de ${escapeHtml(product.name)}">
          <img
            class="product-image mx-auto w-full max-w-[260px] transition duration-300 group-hover:scale-105"
            src="${escapeHtml(product.mainImage || FALLBACK_IMAGE)}"
            alt="${escapeHtml(product.name)}"
            loading="lazy"
            decoding="async"
            onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';"
          />
        </a>
      </div>
      <div class="grid gap-3 p-5">
        <div>
          <p class="text-xs font-black uppercase tracking-wide text-brand">${escapeHtml(displayBrand(product))} / ${escapeHtml(product.condition)}</p>
          <h2 class="mt-1 min-h-12 text-base font-black leading-snug line-clamp-2">
            <a href="${productDetailUrl(product.slug)}">${escapeHtml(product.name)}</a>
          </h2>
        </div>
        <div class="flex items-end justify-between gap-3">
          <div>
            <p class="text-xl font-black">${money.format(product.price)}</p>
            ${product.oldPrice ? `<p class="text-sm text-muted line-through">${money.format(product.oldPrice)}</p>` : ''}
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-black ${product.stock > 0 ? 'bg-emerald-400/15 text-emerald-700' : 'bg-red-400/15 text-red-600'}">
            ${product.stock > 0 ? `${product.stock} disp.` : 'Agotado'}
          </span>
        </div>
        <div class="grid gap-2">
          <a class="btn-primary px-3 text-sm" href="${whatsappProductUrl(product)}" target="_blank" rel="noreferrer">
            <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
            Comprar por WhatsApp
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderProductDetail(product) {
  const productType = product.category === 'iphone-seminuevo' || product.condition.toLowerCase() !== 'nuevo' ? 'iPhone seminuevo' : 'iPhone nuevo';
  const specs = Object.entries(product.specs || {});
  const thumbnails = product.images.length
    ? product.images
        .map(
          (image) => `
            <button class="thumbnail rounded-2xl border border-line bg-surface p-2" data-image="${escapeHtml(image)}" aria-label="Ver imagen de ${escapeHtml(product.name)}">
              <img class="h-20 w-20 object-cover" src="${escapeHtml(image || FALLBACK_IMAGE)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';" />
            </button>
          `,
        )
        .join('')
    : '';

  return `
    <div class="container">
      <nav class="mb-8 text-sm text-muted" aria-label="Breadcrumb">
        <a href="${pathWithBase('/')}">Inicio</a> / <a href="${pathWithBase('/productos')}">Productos</a> / <span>${escapeHtml(product.name)}</span>
      </nav>
      <div class="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div class="surface rounded-[var(--radius-lg)] bg-paper p-6">
            <img class="product-main-image mx-auto aspect-square max-h-[620px] w-full object-contain" src="${escapeHtml(product.mainImage || FALLBACK_IMAGE)}" alt="${escapeHtml(product.name)}" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';" />
          </div>
          <div class="mt-4 flex gap-3">${thumbnails}</div>
        </div>
        <article>
          <p class="eyebrow">${escapeHtml(displayBrand(product))} / ${escapeHtml(product.condition)}</p>
          <h1 class="mt-3 text-4xl font-black sm:text-5xl">${escapeHtml(product.name)}</h1>
          <div class="mt-6 flex flex-wrap items-end gap-3">
            <p class="text-4xl font-black">${money.format(product.price)}</p>
            ${product.oldPrice ? `<p class="text-lg text-muted line-through">${money.format(product.oldPrice)}</p>` : ''}
            ${product.discount > 0 ? `<span class="rounded-full bg-brand/10 px-3 py-1 text-sm font-black text-brand">Ahorra ${product.discount}%</span>` : ''}
          </div>
          ${product.description ? `<p class="mt-6 leading-8 text-muted">${escapeHtml(product.description)}</p>` : ''}
          <dl class="mt-6 grid gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-5 text-sm sm:grid-cols-2">
            <div><dt class="font-black">Disponibilidad</dt><dd class="text-muted">${product.stock > 0 ? `${product.stock} disponible${product.stock === 1 ? '' : 's'}` : 'Agotado'}</dd></div>
            <div><dt class="font-black">Tipo</dt><dd class="text-muted">${productType}</dd></div>
            <div><dt class="font-black">Condición</dt><dd class="text-muted">${escapeHtml(product.condition)}</dd></div>
            <div><dt class="font-black">Marca</dt><dd class="text-muted">Apple</dd></div>
          </dl>
          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <a class="btn-primary" href="${whatsappProductUrl(product)}" target="_blank" rel="noreferrer">
              <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
              Comprar por WhatsApp
            </a>
            <a class="btn-secondary" href="${pathWithBase('/productos')}">
              <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
              Volver al catálogo
            </a>
          </div>
          <div class="mt-8 grid gap-3">
            <details class="surface rounded-2xl p-5" open>
              <summary class="cursor-pointer font-black">Especificaciones técnicas</summary>
              <div class="mt-4 grid gap-2 text-sm text-muted">
                ${specs.map(([key, value]) => String(key).startsWith('Detalle ') ? `<p>${escapeHtml(value)}</p>` : `<p><strong class="text-ink">${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`).join('')}
              </div>
            </details>
            <details class="surface rounded-2xl p-5">
              <summary class="cursor-pointer font-black">Pagos y garantía</summary>
              <p class="mt-4 leading-7 text-muted">Confirma disponibilidad, forma de pago y garantía directamente por WhatsApp antes de cerrar la compra.</p>
            </details>
          </div>
        </article>
      </div>
    </div>
  `;
}

function normalizeProduct(product) {
  const images = Array.isArray(product.images) ? product.images : [product.mainImage].filter(Boolean);
  return {
    id: String(product.id || ''),
    slug: normalizeSlug(product.slug || product.name),
    name: product.name || '',
    brand: product.brand || 'Apple',
    category: product.category || 'celulares',
    price: Number(product.price || 0),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    discount: Number(product.discount || 0),
    images: images.map(normalizeImageUrl).filter(Boolean),
    mainImage: normalizeImageUrl(product.mainImage || images[0]),
    description: product.description || '',
    specs: product.specs && typeof product.specs === 'object' ? product.specs : {},
    stock: Number(product.stock || 0),
    condition: product.condition || 'Nuevo',
    sku: product.sku || String(product.id || ''),
    featured: Boolean(product.featured),
    isNew: Boolean(product.isNew),
    bestSeller: Boolean(product.bestSeller),
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
}

function matchesScope(product, scope) {
  if (scope === 'new') return product.isNew || product.condition.toLowerCase() === 'nuevo' || product.category === 'iphone-nuevo';
  if (scope === 'preowned') return product.condition.toLowerCase() !== 'nuevo' || product.category === 'iphone-seminuevo';
  return true;
}

function isIphoneProduct(product) {
  return normalize([product.name, product.brand, product.category, ...product.tags].join(' ')).includes('iphone');
}

function normalizeImageUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  const idFromQuery = value.match(/[?&]id=([^&]+)/)?.[1];
  const idFromFilePath = value.match(/\/d\/([^/]+)/)?.[1];
  const fileId = idFromQuery || idFromFilePath;
  if (fileId && value.includes('drive.google.com')) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`;
  return value;
}

function normalizeSlug(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function displayBrand(product) {
  return product.brand || 'Apple';
}

function productDetailUrl(slug) {
  return pathWithBase(`/producto?slug=${encodeURIComponent(slug)}`);
}

function whatsappProductUrl(product) {
  const condition = product.condition ? ` ${product.condition.toLowerCase()}` : '';
  const message = `Hola Phone City BQ, quiero comprar este iPhone${condition}: ${product.name}. Precio: ${money.format(product.price)}.`;
  const phone = document.body?.dataset.whatsapp || '573245741763';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function pathWithBase(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${normalizedPath}` || '/';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
