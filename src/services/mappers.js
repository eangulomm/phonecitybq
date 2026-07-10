export function normalizeProduct(product) {
  const images = Array.isArray(product.images) ? product.images : [product.mainImage].filter(Boolean);

  return {
    id: String(product.id),
    slug: normalizeSlug(product.slug || product.name),
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: Number(product.price || 0),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    discount: Number(product.discount || 0),
    images: images.map(normalizeImageUrl),
    mainImage: normalizeImageUrl(product.mainImage || images[0]),
    description: product.description || '',
    specs: product.specs || {},
    stock: Number(product.stock || 0),
    condition: product.condition || 'Nuevo',
    sku: product.sku || String(product.id),
    featured: Boolean(product.featured),
    isNew: Boolean(product.isNew),
    bestSeller: Boolean(product.bestSeller),
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
}

export function normalizeCategory(category) {
  return {
    id: String(category.id),
    slug: normalizeSlug(category.slug || category.name),
    name: category.name,
    description: category.description || '',
    image: normalizeImageUrl(category.image),
  };
}

export function normalizeImageUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';

  const idFromQuery = value.match(/[?&]id=([^&]+)/)?.[1];
  const idFromFilePath = value.match(/\/d\/([^/]+)/)?.[1];
  const fileId = idFromQuery || idFromFilePath;

  if (fileId && value.includes('drive.google.com')) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`;
  }

  return value;
}

export function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
