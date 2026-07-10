export function formatPrice(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function whatsappProductUrl(phone, product) {
  const condition = product.condition ? ` ${product.condition.toLowerCase()}` : '';
  const message = `Hola Phone City BQ, quiero comprar este iPhone${condition}: ${product.name}. Precio: ${formatPrice(product.price)}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function absoluteUrl(siteUrl, path = '') {
  return new URL(path, siteUrl).toString();
}
