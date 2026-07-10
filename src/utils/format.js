export function formatPrice(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function sitePath(path = '/') {
  if (!path) return import.meta.env.BASE_URL || '/';
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}` || '/';
}

export function productDetailPath(slug) {
  return sitePath(`/producto?slug=${encodeURIComponent(slug)}`);
}

export function whatsappProductUrl(phone, product) {
  const condition = product.condition ? ` ${product.condition.toLowerCase()}` : '';
  const message = `Hola Phone City BQ, quiero comprar este iPhone${condition}: ${product.name}. Precio: ${formatPrice(product.price)}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function absoluteUrl(siteUrl, path = '') {
  if (/^https?:\/\//.test(path)) return path;
  const baseUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  const basePath = new URL(baseUrl).pathname.replace(/\/$/, '');
  let normalizedPath = String(path || '').replace(/^\//, '');

  if (basePath && normalizedPath === basePath.replace(/^\//, '')) {
    normalizedPath = '';
  } else if (basePath && normalizedPath.startsWith(`${basePath.replace(/^\//, '')}/`)) {
    normalizedPath = normalizedPath.slice(basePath.length);
  }

  return new URL(normalizedPath, baseUrl).toString();
}
