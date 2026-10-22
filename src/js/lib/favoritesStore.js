/**
 * favoritesStore.js — Lightweight Local Favorites State Manager
 *
 * Persists an array of opportunity IDs in localStorage without requiring authentication.
 * Emits "pto:favorites-updated" custom events when the favorites set changes.
 */

const FAVORITES_STORAGE_KEY = "pto_favorites";

/**
 * Retrieve the current array of favorited opportunity IDs
 * @returns {string[]}
 */
export function getFavorites() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Could not read favorites from localStorage:", err);
    return [];
  }
}

/**
 * Check if a specific opportunity ID is favorited
 * @param {string} id
 * @returns {boolean}
 */
export function isFavorite(id) {
  if (!id) return false;
  const list = getFavorites();
  return list.includes(id);
}

/**
 * Toggle favorite state for an opportunity ID
 * @param {string} id
 * @returns {boolean} New favorited state (true if added, false if removed)
 */
export function toggleFavorite(id) {
  if (!id) return false;
  const list = getFavorites();
  const index = list.indexOf(id);
  let nowFavorite = false;

  if (index >= 0) {
    list.splice(index, 1);
    nowFavorite = false;
  } else {
    list.push(id);
    nowFavorite = true;
  }

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn("Could not save favorites to localStorage:", err);
    }
  }

  // Dispatch custom event for cross-component reactive updates
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("pto:favorites-updated", {
        detail: { id, isFavorite: nowFavorite, count: list.length, favorites: list },
      })
    );
  }

  return nowFavorite;
}

/**
 * Get the total number of saved favorites
 * @returns {number}
 */
export function getFavoritesCount() {
  return getFavorites().length;
}
