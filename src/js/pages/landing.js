/**
 * landing.js — Controller for index.html (Educational Landing Page)
 */

import { initI18n, t } from "../lib/i18n.js";
import { initNav } from "../lib/nav.js";
import { getFeatured } from "../lib/opportunitiesStore.js";
import { createCard } from "../components/OpportunityCard.js";
import { animateCardsEnter, initScrollReveal } from "../lib/animations.js";

const featuredGrid = document.getElementById("featured-grid");
const heroSearchForm = document.getElementById("hero-search-form");
const heroSearchInput = document.getElementById("hero-search-input");

/**
 * Render 3-4 featured opportunities from the verified store
 */
async function renderFeatured() {
  if (!featuredGrid) return;
  featuredGrid.innerHTML = "";

  const featured = getFeatured(3);
  if (!featured || featured.length === 0) return;

  const fragment = document.createDocumentFragment();
  const cardEls = featured.map(createCard);
  cardEls.forEach((card) => fragment.appendChild(card));
  featuredGrid.appendChild(fragment);

  await animateCardsEnter(cardEls);
}

/**
 * Wire Hero search form to redirect to directory with query
 */
function wireHeroSearch() {
  heroSearchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = heroSearchInput?.value?.trim() || "";
    if (query) {
      window.location.href = `opportunities.html?q=${encodeURIComponent(query)}`;
    } else {
      window.location.href = "opportunities.html";
    }
  });
}

/**
 * Boot landing page
 */
async function boot() {
  await initI18n();
  initNav({
    onLangChange: async () => {
      await renderFeatured();
    },
  });
  wireHeroSearch();
  await renderFeatured();
  initScrollReveal();
}

boot().catch(console.error);
