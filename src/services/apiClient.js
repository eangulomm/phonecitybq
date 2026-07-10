const API_BASE_URL = import.meta.env.PUBLIC_APPS_SCRIPT_API_URL || '';
const DATA_SOURCE = import.meta.env.PUBLIC_DATA_SOURCE || 'mock';
const REQUEST_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = {
  products: 8000,
  categories: 60000,
  siteConfig: 300000,
};
const responseCache = new Map();
const warnedResources = new Set();

export function shouldUseRemoteData() {
  return DATA_SOURCE === 'remote' && Boolean(API_BASE_URL);
}

export async function fetchFromAppsScript(resource, params = {}) {
  if (!shouldUseRemoteData()) return null;

  try {
    const url = new URL(API_BASE_URL);
    url.searchParams.set('resource', resource);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });

    const cacheKey = url.toString();
    const cacheTtl = CACHE_TTL_MS[resource] || 0;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < cacheTtl) return cached.payload;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const payload = await response.json();
    if (payload?.ok === false) return null;
    if (cacheTtl) responseCache.set(cacheKey, { createdAt: Date.now(), payload });
    return payload;
  } catch (error) {
    if (!warnedResources.has(resource)) {
      console.warn(`Apps Script unavailable for ${resource}. Falling back to mock data.`);
      warnedResources.add(resource);
    }
    return null;
  }
}
