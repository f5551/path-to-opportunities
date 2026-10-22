/**
 * favorites.test.js — Verification for Favorites Feature
 *
 * Tests:
 * 1. favoritesStore: getFavorites, isFavorite, toggleFavorite, getFavoritesCount
 * 2. filterOpportunities: favoritesOnly filtering alone and with search & category filters
 * 3. OpportunityCard: heart button render, attributes, accessibility
 * 4. HTML markup: filter-favorites-btn and favorites-empty-state presence
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Mock simple localStorage for Node.js test environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// Import modules
const {
  getFavorites,
  isFavorite,
  toggleFavorite,
  getFavoritesCount,
} = await import("../src/js/lib/favoritesStore.js");

const { filterOpportunities } = await import("../src/js/features/list.js");
const { createCard } = await import("../src/js/components/OpportunityCard.js");

console.log("==========================================");
console.log("   PATH TO OPPORTUNITIES — FAVORITES TESTS ");
console.log("==========================================");

// 1. favoritesStore Tests
localStorage.clear();
assert.deepStrictEqual(getFavorites(), [], "getFavorites returns empty array initially");
assert.strictEqual(getFavoritesCount(), 0, "getFavoritesCount is 0 initially");
assert.strictEqual(isFavorite("opp-1"), false, "isFavorite returns false initially");

const added1 = toggleFavorite("opp-1");
assert.strictEqual(added1, true, "toggleFavorite returns true when added");
assert.strictEqual(isFavorite("opp-1"), true, "isFavorite returns true after adding");
assert.strictEqual(getFavoritesCount(), 1, "getFavoritesCount is 1 after adding 1");
assert.deepStrictEqual(getFavorites(), ["opp-1"], "getFavorites contains opp-1");

toggleFavorite("opp-2");
assert.strictEqual(getFavoritesCount(), 2, "getFavoritesCount is 2 after adding opp-2");

const removed1 = toggleFavorite("opp-1");
assert.strictEqual(removed1, false, "toggleFavorite returns false when removed");
assert.strictEqual(isFavorite("opp-1"), false, "isFavorite returns false after removal");
assert.strictEqual(getFavoritesCount(), 1, "getFavoritesCount is 1 after opp-1 removal");
assert.deepStrictEqual(getFavorites(), ["opp-2"], "getFavorites contains only opp-2");

console.log("[PASS] 1.1 favoritesStore toggle, persistence, and count work accurately");

// 2. filterOpportunities with favoritesOnly
const sampleData = [
  { id: "fav-1", type: "scholarship", title: "Grant A", title_en: "Grant A", country: "Germany" },
  { id: "fav-2", type: "course", title: "Course B", title_en: "Course B", country: "Online" },
  { id: "not-fav", type: "scholarship", title: "Grant C", title_en: "Grant C", country: "France" },
];

const allFavs = filterOpportunities(sampleData, {
  favoritesOnly: true,
  favoriteIds: ["fav-1", "fav-2"],
});
assert.strictEqual(allFavs.length, 2, "Should return 2 favorites");
assert.ok(allFavs.some((i) => i.id === "fav-1"), "Contains fav-1");
assert.ok(allFavs.some((i) => i.id === "fav-2"), "Contains fav-2");
assert.ok(!allFavs.some((i) => i.id === "not-fav"), "Does not contain not-fav");

// Combined with type filter
const scholarshipFavs = filterOpportunities(sampleData, {
  type: "scholarship",
  favoritesOnly: true,
  favoriteIds: ["fav-1", "fav-2"],
});
assert.strictEqual(scholarshipFavs.length, 1, "Should filter favorites by type");
assert.strictEqual(scholarshipFavs[0].id, "fav-1");

// Empty favorites
const emptyFavs = filterOpportunities(sampleData, {
  favoritesOnly: true,
  favoriteIds: [],
});
assert.strictEqual(emptyFavs.length, 0, "Empty favoriteIds yields empty array");

console.log("[PASS] 2.1 filterOpportunities correctly applies favoritesOnly with multi-criteria");

// 3. OpportunityCard has favorite button
// Mock minimal DOM if needed for createCard test
if (typeof document === "undefined") {
  global.document = {
    createElement: (tag) => {
      let _html = "";
      const attrs = new Map();
      const listeners = new Map();
      const classList = {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); },
        toggle(c, force) {
          if (force === undefined) {
            if (this.contains(c)) { this.remove(c); return false; }
            this.add(c); return true;
          }
          if (force) { this.add(c); return true; }
          this.remove(c); return false;
        }
      };
      return {
        tagName: tag.toUpperCase(),
        set className(v) { (v || "").split(/\s+/).filter(Boolean).forEach((c) => classList.add(c)); },
        get className() { return Array.from(classList._classes).join(" "); },
        classList,
        setAttribute: (k, v) => attrs.set(k, String(v)),
        getAttribute: (k) => attrs.get(k) || null,
        dataset: {},
        set innerHTML(val) { _html = val; },
        get innerHTML() { return _html; },
        addEventListener: (event, handler) => {
          if (!listeners.has(event)) listeners.set(event, []);
          listeners.get(event).push(handler);
        },
        querySelector: (sel) => {
          if (sel === ".btn-card-favorite" && _html.includes("btn-card-favorite")) {
            return {
              classList: {
                toggle: () => {},
              },
              setAttribute: () => {},
              querySelector: () => ({ setAttribute: () => {} }),
              addEventListener: () => {},
            };
          }
          return null;
        },
      };
    },
    documentElement: { lang: "ar" },
  };
}

const cardSample = {
  id: "sch-test-1",
  type: "scholarship",
  title: "منحة جامعة أكسفورد",
  title_en: "Oxford University Scholarship",
  organization: "University of Oxford",
  country: "United Kingdom",
  level: "Master's",
  field: "All Fields",
  funding_type: "fully_funded",
  deadline: "2027-01-01",
};

const card = createCard(cardSample);
assert.ok(card.innerHTML.includes("btn-card-favorite"), "Card markup contains .btn-card-favorite");
assert.ok(card.innerHTML.includes("data-id=\"sch-test-1\""), "Button contains correct data-id");
assert.ok(card.innerHTML.includes("heart-icon"), "Button contains heart-icon SVG");

console.log("[PASS] 3.1 OpportunityCard renders favorite button with proper markup and data-id");

// 4. HTML structure verification
const oppHtml = fs.readFileSync(path.join(rootDir, "opportunities.html"), "utf-8");
assert.ok(oppHtml.includes("id=\"filter-favorites-btn\""), "opportunities.html contains #filter-favorites-btn");
assert.ok(oppHtml.includes("id=\"fav-count-badge\""), "opportunities.html contains #fav-count-badge");
assert.ok(oppHtml.includes("id=\"favorites-empty-state\""), "opportunities.html contains #favorites-empty-state");
assert.ok(oppHtml.includes("id=\"btn-reset-favorites\""), "opportunities.html contains #btn-reset-favorites");

console.log("[PASS] 4.1 opportunities.html includes filter button and empty state elements");

console.log("==========================================");
console.log("ALL FAVORITES TESTS PASSED!");
console.log("==========================================");
