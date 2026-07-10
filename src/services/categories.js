import { categories } from '../data/categories';
import { fetchFromAppsScript } from './apiClient';
import { normalizeCategory, normalizeSlug } from './mappers';

export async function getCategories() {
  const remoteCategories = await fetchFromAppsScript('categories');
  const categoryMap = new Map();
  categories.map(normalizeCategory).forEach((category) => categoryMap.set(category.slug, category));
  (remoteCategories?.data || remoteCategories || [])
    .map(normalizeCategory)
    .forEach((category) => categoryMap.set(category.slug, category));
  return Array.from(categoryMap.values());
}

export async function getCategoryBySlug(slug) {
  const categoryList = await getCategories();
  const normalizedSlug = normalizeSlug(slug);
  return categoryList.find((category) => category.slug === normalizedSlug);
}
