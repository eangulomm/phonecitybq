import { products } from '../data/products';
import { fetchFromAppsScript } from './apiClient';
import { normalizeProduct, normalizeSlug } from './mappers';

export async function getProducts() {
  const remoteProducts = await fetchFromAppsScript('products');
  return (remoteProducts?.data || remoteProducts || products).map(normalizeProduct);
}

export async function getAllProductPaths() {
  const productMap = new Map();
  products.map(normalizeProduct).forEach((product) => productMap.set(product.slug, product));

  const remoteProducts = await fetchFromAppsScript('products');
  (remoteProducts?.data || remoteProducts || [])
    .map(normalizeProduct)
    .forEach((product) => productMap.set(product.slug, product));

  return Array.from(productMap.values());
}

export async function getProductBySlug(slug) {
  const productList = await getProducts();
  const normalizedSlug = normalizeSlug(slug);
  return productList.find((product) => product.slug === normalizedSlug) || products.map(normalizeProduct).find((product) => product.slug === normalizedSlug);
}

export async function getProductsByCategory(category) {
  const productList = await getProducts();
  const normalizedCategory = normalizeSlug(category);
  return productList.filter((product) => normalizeSlug(product.category) === normalizedCategory);
}

export async function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  const productList = await getProducts();
  return productList
    .filter((item) => item.id !== product.id && (item.category === product.category || item.brand === product.brand))
    .slice(0, limit);
}

export async function searchProducts(query) {
  const productList = await getProducts();
  const value = query?.toLowerCase().trim();
  if (!value) return productList;
  return productList.filter((product) =>
    [product.name, product.brand, product.category, product.condition, ...product.tags]
      .join(' ')
      .toLowerCase()
      .includes(value),
  );
}
