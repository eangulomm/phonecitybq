import { readJson, writeJson } from './dom';

export const FAV_KEY = 'premium_favorites';

export function getFavorites() {
  return readJson(FAV_KEY, []);
}

export function saveFavorites(favorites) {
  writeJson(FAV_KEY, favorites);
}

export function emitStoreChange() {
  document.dispatchEvent(new CustomEvent('store:change'));
}
