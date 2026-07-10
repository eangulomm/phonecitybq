import { products } from '../data/products';
import { fetchFromAppsScript } from './apiClient';
import { normalizeProduct, normalizeSlug } from './mappers';

async function loadProducts() {
  const remoteProducts = await fetchFromAppsScript('products');
  const productList = remoteProducts?.data || remoteProducts;

  if (Array.isArray(productList) && productList.length > 0) {
    return productList.map(normalizeProduct);
  }

  return products.map(normalizeProduct);
}

export async function getProducts() {
  return loadProducts();
}

export async function getAllProductPaths() {
  return loadProducts();
}

export async function getProductBySlug(slug) {
  const productList = await getProducts();
  const normalizedSlug = normalizeSlug(slug);
  return productList.find((product) => product.slug === normalizedSlug);
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
