/**
 * opportunities.js — Dedicated Directory & Filter Hub Controller
 *
 * Handles live search, tab switching, multi-criteria scholarship filters,
 * status filtering, multi-strategy sorting, URL query parameters,
 * and high-performance, non-blocking rendering.
 */

import { initI18n, t } from "../lib/i18n.js";
import { initNav } from "../lib/nav.js";
import { loadOpportunities, filter, getFilterOptions } from "../lib/opportunitiesStore.js";
import { matchOpportunityLevel, matchOpportunityField } from "../features/list.js";
import { createCard, createSkeletonCard } from "../components/OpportunityCard.js";
import { getFavorites, getFavoritesCount } from "../lib/favoritesStore.js";
import { initShareModal } from "../features/shareModal.js";
import {
  animateCardsEnter,
  animateTabPress,
} from "../lib/animations.js";

// ─── State ────────────────────────────────────────────────
const state = {
  activeFilter: "all",
  searchQuery: "",
  onlyFavorites: false,
  scholarshipFilters: {
    country: "",
    level: "",
    field: "",
    fundingType: "",
    status: "",
    sort: "default",
  },
};

let _currentRenderToken = 0;
let _urlSyncTimer = null;

// ─── DOM Elements ─────────────────────────────────────────
const grid = document.getElementById("opps-grid");
const emptyState = document.getElementById("empty-state");
const noResults = document.getElementById("no-results");
const favoritesEmptyState = document.getElementById("favorites-empty-state");
const btnResetFavorites = document.getElementById("btn-reset-favorites");
const errorState = document.getElementById("error-state");
const resultsCount = document.getElementById("results-count");
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");
const clearFiltersBtn = document.getElementById("clear-filters");
const filterTabs = document.querySelectorAll(".filter-tab");
const filterFavoritesBtn = document.getElementById("filter-favorites-btn");
const favCountBadge = document.getElementById("fav-count-badge");
const scholarshipFiltersWrap = document.getElementById("scholarship-filters");
const mobileFilterToggleRow = document.getElementById("mobile-filter-toggle-row");
const btnToggleFilters = document.getElementById("btn-toggle-filters");
const activeFiltersCountBadge = document.getElementById("active-filters-count-badge");
const filterCountry = document.getElementById("filter-country");
const filterLevel = document.getElementById("filter-level");
const filterField = document.getElementById("filter-field");
const filterFunding = document.getElementById("filter-funding");
const filterStatus = document.getElementById("filter-status");
const filterSort = document.getElementById("filter-sort");
const resetScholarshipFiltersBtn = document.getElementById("reset-scholarship-filters");

// ─── Render Functions ─────────────────────────────────────
function updateFavoritesBadge() {
  const count = getFavoritesCount();
  if (!favCountBadge) return;
  favCountBadge.textContent = String(count);
  favCountBadge.classList.toggle("hidden", count === 0);
}

function updateActiveFiltersCount() {
  let count = 0;
  const sf = state.scholarshipFilters;
  if (sf.country) count++;
  if (sf.level) count++;
  if (sf.field) count++;
  if (sf.fundingType) count++;
  if (sf.status) count++;
  if (sf.sort && sf.sort !== "default") count++;

  if (activeFiltersCountBadge) {
    activeFiltersCountBadge.textContent = String(count);
    activeFiltersCountBadge.classList.toggle("hidden", count === 0);
  }
}

function showSkeletons(count = 6) {
  if (!grid) return;
  grid.innerHTML = "";
  emptyState?.classList.add("hidden");
  noResults?.classList.add("hidden");
  favoritesEmptyState?.classList.add("hidden");
  errorState?.classList.add("hidden");
  for (let i = 0; i < count; i++) {
    grid.appendChild(createSkeletonCard());
  }
}

function renderOpportunities(opportunities) {
  if (!grid) return;
  grid.innerHTML = "";
  emptyState?.classList.add("hidden");
  noResults?.classList.add("hidden");
  favoritesEmptyState?.classList.add("hidden");
  errorState?.classList.add("hidden");

  const allItems = loadOpportunities();

  if (opportunities === null || typeof opportunities === "undefined") {
    errorState?.classList.remove("hidden");
    updateResultsCount(0);
    return;
  }

  if (allItems.length === 0) {
    emptyState?.classList.remove("hidden");
    updateResultsCount(0);
    return;
  }

  if (opportunities.length === 0) {
    if (state.onlyFavorites) {
      favoritesEmptyState?.classList.remove("hidden");
    } else {
      noResults?.classList.remove("hidden");
    }
    updateResultsCount(0);
    return;
  }

  const fragment = document.createDocumentFragment();
  const cardEls = opportunities.map(createCard);
  cardEls.forEach((card) => fragment.appendChild(card));
  grid.appendChild(fragment);

  updateResultsCount(opportunities.length);

  // Trigger smooth micro-animation non-blockingly without delaying the main thread
  animateCardsEnter(cardEls).catch(() => {});
}

function updateResultsCount(count) {
  if (!resultsCount) return;
  const text = t("opportunities.count", { count, defaultValue: `(${count})` });
  resultsCount.textContent = text;
}

// ─── Filter Logic ─────────────────────────────────────────
function populateScholarshipFilters() {
  const options = getFilterOptions();

  if (filterCountry) filterCountry.setAttribute("aria-label", t("scholarshipFilters.country"));
  if (filterLevel) filterLevel.setAttribute("aria-label", t("scholarshipFilters.level"));
  if (filterField) filterField.setAttribute("aria-label", t("scholarshipFilters.field"));
  if (filterFunding) filterFunding.setAttribute("aria-label", t("scholarshipFilters.funding"));
  if (filterStatus) filterStatus.setAttribute("aria-label", t("scholarshipFilters.status"));
  if (filterSort) filterSort.setAttribute("aria-label", t("scholarshipFilters.sort"));

  populateLocalizedSelect(
    filterCountry,
    options.countries,
    state.scholarshipFilters.country,
    t("scholarshipFilters.allCountries"),
    "countries"
  );

  populateLocalizedSelect(
    filterLevel,
    options.levels,
    state.scholarshipFilters.level,
    t("scholarshipFilters.allLevels"),
    "levels"
  );

  populateLocalizedSelect(
    filterField,
    options.fields,
    state.scholarshipFilters.field,
    t("scholarshipFilters.allFields"),
    "fields"
  );

  populateFundingSelect(
    filterFunding,
    options.fundingTypes,
    state.scholarshipFilters.fundingType
  );

  if (filterStatus) {
    filterStatus.value = state.scholarshipFilters.status || "";
  }

  if (filterSort) {
    filterSort.value = state.scholarshipFilters.sort || "default";
  }
}

function populateSelect(selectEl, values, currentValue, defaultLabel) {
  if (!selectEl) return;
  const current = currentValue || "";
  selectEl.innerHTML = "";

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = defaultLabel;
  selectEl.appendChild(defaultOpt);

  values.forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    if (val === current) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function populateLocalizedSelect(selectEl, values, currentValue, defaultLabel, translationNamespace) {
  if (!selectEl) return;
  const current = currentValue || "";
  selectEl.innerHTML = "";

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = defaultLabel;
  selectEl.appendChild(defaultOpt);

  values.forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = t(`${translationNamespace}.${val}`, { defaultValue: val });
    if (val === current) {
      opt.selected = true;
    } else if (translationNamespace === "levels" && current && matchOpportunityLevel(val, current)) {
      opt.selected = true;
    } else if (translationNamespace === "fields" && current && matchOpportunityField({ field: current }, val)) {
      opt.selected = true;
    }
    selectEl.appendChild(opt);
  });
}

function populateFundingSelect(selectEl, types, currentType) {
  if (!selectEl) return;
  const current = currentType || "";
  selectEl.innerHTML = "";

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = t("scholarshipFilters.allFunding");
  selectEl.appendChild(defaultOpt);

  types.forEach((ft) => {
    const opt = document.createElement("option");
    opt.value = ft;
    opt.textContent = t(`funding.${ft}`, { defaultValue: ft });
    if (ft === current) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function resetScholarshipFilterState() {
  state.scholarshipFilters.country = "";
  state.scholarshipFilters.level = "";
  state.scholarshipFilters.field = "";
  state.scholarshipFilters.fundingType = "";
  state.scholarshipFilters.status = "";
  state.scholarshipFilters.sort = "default";

  if (filterCountry) filterCountry.value = "";
  if (filterLevel) filterLevel.value = "";
  if (filterField) filterField.value = "";
  if (filterFunding) filterFunding.value = "";
  if (filterStatus) filterStatus.value = "";
  if (filterSort) filterSort.value = "default";
}

function syncBottomNavFavState() {
  const bottomNav = document.querySelector(".bottom-nav");
  if (!bottomNav) return;
  const favItem = bottomNav.querySelector('#bottom-nav-fav-btn, [data-nav="favorites"]');
  const oppsItem = bottomNav.querySelector('[data-nav="opportunities"]');
  if (state.onlyFavorites) {
    favItem?.classList.add("active");
    oppsItem?.classList.remove("active");
    oppsItem?.removeAttribute("aria-current");
  } else {
    favItem?.classList.remove("active");
    oppsItem?.classList.add("active");
    oppsItem?.setAttribute("aria-current", "page");
  }
}

// ─── URL Parameters Sync ──────────────────────────────────
function syncUrlParams(push = false) {
  clearTimeout(_urlSyncTimer);
  _urlSyncTimer = setTimeout(() => {
    try {
      const url = new URL(window.location.href);

      if (state.onlyFavorites) {
        url.searchParams.set("favorites", "1");
        url.searchParams.delete("type");
        url.searchParams.delete("country");
        url.searchParams.delete("level");
        url.searchParams.delete("field");
        url.searchParams.delete("funding");
        url.searchParams.delete("status");
        url.searchParams.delete("sort");
      } else {
        url.searchParams.delete("favorites");

        if (state.activeFilter && state.activeFilter !== "all") {
          url.searchParams.set("type", state.activeFilter);
        } else {
          url.searchParams.delete("type");
        }

        if (state.activeFilter === "scholarship") {
          const sf = state.scholarshipFilters;
          if (sf.country) url.searchParams.set("country", sf.country);
          else url.searchParams.delete("country");

          if (sf.level) url.searchParams.set("level", sf.level);
          else url.searchParams.delete("level");

          if (sf.field) url.searchParams.set("field", sf.field);
          else url.searchParams.delete("field");

          if (sf.fundingType) url.searchParams.set("funding", sf.fundingType);
          else url.searchParams.delete("funding");

          if (sf.status && sf.status !== "all") url.searchParams.set("status", sf.status);
          else url.searchParams.delete("status");

          if (sf.sort && sf.sort !== "default") url.searchParams.set("sort", sf.sort);
          else url.searchParams.delete("sort");
        } else {
          url.searchParams.delete("country");
          url.searchParams.delete("level");
          url.searchParams.delete("field");
          url.searchParams.delete("funding");
          url.searchParams.delete("status");
          url.searchParams.delete("sort");
        }
      }

      if (state.searchQuery && state.searchQuery.trim()) {
        url.searchParams.set("q", state.searchQuery.trim());
      } else {
        url.searchParams.delete("q");
      }

      if (push && url.toString() !== window.location.href) {
        window.history.pushState({}, "", url.toString());
      } else {
        window.history.replaceState({}, "", url.toString());
      }
    } catch {}
  }, 100);
}

function initFromUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  const type = params.get("type");
  const country = params.get("country");
  const level = params.get("level");
  const field = params.get("field");
  const funding = params.get("funding");
  const status = params.get("status");
  const sort = params.get("sort");
  const favorites = params.get("favorites");

  if (q) {
    state.searchQuery = q;
    if (searchInput) searchInput.value = q;
    searchClear?.classList.remove("hidden");
  } else {
    state.searchQuery = "";
    if (searchInput) searchInput.value = "";
    searchClear?.classList.add("hidden");
  }

  if (favorites === "1" || favorites === "true") {
    // Mode 1: Independent Favorites View across all categories
    state.onlyFavorites = true;
    state.activeFilter = "all";

    if (filterFavoritesBtn) {
      filterFavoritesBtn.classList.add("active");
      filterFavoritesBtn.setAttribute("aria-pressed", "true");
    }

    filterTabs.forEach((tab) => {
      tab.classList.remove("active");
      tab.setAttribute("aria-selected", "false");
    });

    scholarshipFiltersWrap?.classList.add("hidden");
    scholarshipFiltersWrap?.classList.remove("mobile-expanded");
    mobileFilterToggleRow?.classList.add("hidden");
    btnToggleFilters?.setAttribute("aria-expanded", "false");
    btnToggleFilters?.classList.remove("open");
    resetScholarshipFilterState();
    updateActiveFiltersCount();
  } else {
    // Mode 2: Category Mode
    state.onlyFavorites = false;

    if (filterFavoritesBtn) {
      filterFavoritesBtn.classList.remove("active");
      filterFavoritesBtn.setAttribute("aria-pressed", "false");
    }

    if (type && ["scholarship", "course", "internship"].includes(type)) {
      state.activeFilter = type;
    } else {
      state.activeFilter = "all";
    }

    filterTabs.forEach((tab) => {
      const match = tab.dataset.filter === state.activeFilter;
      tab.classList.toggle("active", match);
      tab.setAttribute("aria-selected", match ? "true" : "false");
    });

    if (state.activeFilter === "scholarship") {
      if (country) state.scholarshipFilters.country = country;
      if (level) state.scholarshipFilters.level = level;
      if (field) state.scholarshipFilters.field = field;
      if (funding) state.scholarshipFilters.fundingType = funding;
      if (status) state.scholarshipFilters.status = status;
      if (sort) state.scholarshipFilters.sort = sort;

      populateScholarshipFilters();
      scholarshipFiltersWrap?.classList.remove("hidden");
      mobileFilterToggleRow?.classList.remove("hidden");
      updateActiveFiltersCount();
    } else {
      scholarshipFiltersWrap?.classList.add("hidden");
      scholarshipFiltersWrap?.classList.remove("mobile-expanded");
      mobileFilterToggleRow?.classList.add("hidden");
      btnToggleFilters?.setAttribute("aria-expanded", "false");
      btnToggleFilters?.classList.remove("open");
      resetScholarshipFilterState();
      updateActiveFiltersCount();
    }
  }

  syncBottomNavFavState();
}

function applyFilters(pushHistory = false) {
  const thisToken = ++_currentRenderToken;
  const lang = document.documentElement.lang || "ar";

  const results = filter({
    type: state.activeFilter,
    query: state.searchQuery,
    country: state.scholarshipFilters.country,
    level: state.scholarshipFilters.level,
    field: state.scholarshipFilters.field,
    fundingType: state.scholarshipFilters.fundingType,
    status: state.scholarshipFilters.status,
    sort: state.scholarshipFilters.sort,
    favoritesOnly: state.onlyFavorites,
    favoriteIds: getFavorites(),
    lang,
  });

  if (thisToken !== _currentRenderToken) return;

  syncUrlParams(pushHistory);
  renderOpportunities(results);
}


// ─── Wire Event Listeners ─────────────────────────────────
function wireEvents() {
  // Tab clicks
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const newFilter = tab.dataset.filter;
      if (newFilter === state.activeFilter && !state.onlyFavorites) return;

      // Requirement 2: Exit Favorites mode automatically when selecting any category
      state.onlyFavorites = false;
      filterFavoritesBtn?.classList.remove("active");
      filterFavoritesBtn?.setAttribute("aria-pressed", "false");
      syncBottomNavFavState();

      state.activeFilter = newFilter;

      filterTabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      if (newFilter === "scholarship") {
        populateScholarshipFilters();
        scholarshipFiltersWrap?.classList.remove("hidden");
        mobileFilterToggleRow?.classList.remove("hidden");
        scholarshipFiltersWrap?.classList.remove("mobile-expanded");
        btnToggleFilters?.setAttribute("aria-expanded", "false");
        btnToggleFilters?.classList.remove("open");
        updateActiveFiltersCount();
      } else {
        scholarshipFiltersWrap?.classList.add("hidden");
        mobileFilterToggleRow?.classList.add("hidden");
        scholarshipFiltersWrap?.classList.remove("mobile-expanded");
        btnToggleFilters?.setAttribute("aria-expanded", "false");
        btnToggleFilters?.classList.remove("open");
        resetScholarshipFilterState();
        updateActiveFiltersCount();
      }

      animateTabPress(tab).catch(() => {});
      applyFilters(true);
    });
  });

  // Mobile Filter Accordion Toggle
  btnToggleFilters?.addEventListener("click", () => {
    const isExpanded = scholarshipFiltersWrap?.classList.toggle("mobile-expanded");
    btnToggleFilters.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    btnToggleFilters.classList.toggle("open", isExpanded);
  });

  // Scholarship Selects — Instant zero-lag updates
  filterCountry?.addEventListener("change", (e) => {
    state.scholarshipFilters.country = e.target.value;
    updateActiveFiltersCount();
    applyFilters();
  });
  filterLevel?.addEventListener("change", (e) => {
    state.scholarshipFilters.level = e.target.value;
    updateActiveFiltersCount();
    applyFilters();
  });
  filterField?.addEventListener("change", (e) => {
    state.scholarshipFilters.field = e.target.value;
    updateActiveFiltersCount();
    applyFilters();
  });
  filterFunding?.addEventListener("change", (e) => {
    state.scholarshipFilters.fundingType = e.target.value;
    updateActiveFiltersCount();
    applyFilters();
  });
  filterStatus?.addEventListener("change", (e) => {
    state.scholarshipFilters.status = e.target.value;
    updateActiveFiltersCount();
    applyFilters();
  });
  filterSort?.addEventListener("change", (e) => {
    state.scholarshipFilters.sort = e.target.value;
    updateActiveFiltersCount();
    applyFilters();
  });

  // Reset button
  resetScholarshipFiltersBtn?.addEventListener("click", () => {
    resetScholarshipFilterState();
    updateActiveFiltersCount();
    applyFilters();
  });

  // Search input with quick 180ms debounce
  let debounceTimer = null;
  searchInput?.addEventListener("input", () => {
    const val = searchInput.value;
    state.searchQuery = val;
    searchClear?.classList.toggle("hidden", !val.trim());

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applyFilters();
    }, 180);
  });

  // Search clear
  searchClear?.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    searchClear.classList.add("hidden");
    searchInput.focus();
    applyFilters();
  });

  // Clear filters in No Results state
  clearFiltersBtn?.addEventListener("click", () => {
    state.activeFilter = "all";
    state.searchQuery = "";
    state.onlyFavorites = false;
    filterFavoritesBtn?.classList.remove("active");
    filterFavoritesBtn?.setAttribute("aria-pressed", "false");
    resetScholarshipFilterState();
    scholarshipFiltersWrap?.classList.add("hidden");
    scholarshipFiltersWrap?.classList.remove("mobile-expanded");
    mobileFilterToggleRow?.classList.add("hidden");
    btnToggleFilters?.setAttribute("aria-expanded", "false");
    btnToggleFilters?.classList.remove("open");
    updateActiveFiltersCount();

    if (searchInput) searchInput.value = "";
    searchClear?.classList.add("hidden");

    filterTabs.forEach((tab) => {
      const isAll = tab.dataset.filter === "all";
      tab.classList.toggle("active", isAll);
      tab.setAttribute("aria-selected", isAll ? "true" : "false");
    });

    syncBottomNavFavState();
    try {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.pushState({}, "", url.pathname);
    } catch {}

    applyFilters(false);
  });

  // Favorites toggle button
  filterFavoritesBtn?.addEventListener("click", () => {
    state.onlyFavorites = !state.onlyFavorites;

    if (state.onlyFavorites) {
      // Requirement 1 & 3: Independent view mode displaying saved opportunities from ALL categories
      state.activeFilter = "all";

      filterFavoritesBtn.classList.add("active");
      filterFavoritesBtn.setAttribute("aria-pressed", "true");

      filterTabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      scholarshipFiltersWrap?.classList.add("hidden");
      scholarshipFiltersWrap?.classList.remove("mobile-expanded");
      mobileFilterToggleRow?.classList.add("hidden");
      btnToggleFilters?.setAttribute("aria-expanded", "false");
      btnToggleFilters?.classList.remove("open");
      resetScholarshipFilterState();
      updateActiveFiltersCount();
    } else {
      // Toggle off favorites: return to "all" category view
      state.activeFilter = "all";

      filterFavoritesBtn.classList.remove("active");
      filterFavoritesBtn.setAttribute("aria-pressed", "false");

      filterTabs.forEach((t) => {
        const isAll = t.dataset.filter === "all";
        t.classList.toggle("active", isAll);
        t.setAttribute("aria-selected", isAll ? "true" : "false");
      });
    }

    syncBottomNavFavState();
    applyFilters(true);
  });

  // Reset favorites filter button in empty state
  btnResetFavorites?.addEventListener("click", () => {
    state.onlyFavorites = false;
    state.activeFilter = "all";

    filterFavoritesBtn?.classList.remove("active");
    filterFavoritesBtn?.setAttribute("aria-pressed", "false");

    filterTabs.forEach((t) => {
      const isAll = t.dataset.filter === "all";
      t.classList.toggle("active", isAll);
      t.setAttribute("aria-selected", isAll ? "true" : "false");
    });

    syncBottomNavFavState();
    applyFilters(true);
  });

  // Handle browser back and forward navigation
  window.addEventListener("popstate", () => {
    initFromUrlParams();
    applyFilters(false);
  });

  // Custom event fired when any favorite is toggled
  window.addEventListener("pto:favorites-updated", (e) => {
    updateFavoritesBadge();
    if (state.onlyFavorites) {
      applyFilters();
    } else {
      const toggledId = e.detail?.id;
      if (toggledId) {
        const matchingCard = grid?.querySelector(`.opp-card[data-id="${toggledId}"]`);
        if (matchingCard) {
          const btn = matchingCard.querySelector(".btn-card-favorite");
          const isFav = e.detail?.isFavorite;
          if (btn) {
            btn.classList.toggle("active", isFav);
            btn.setAttribute("aria-pressed", String(isFav));
            const icon = btn.querySelector(".heart-icon");
            if (icon) icon.setAttribute("fill", isFav ? "currentColor" : "none");
          }
        }
      }
    }
  });

  // Keyboard: ESC
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      state.searchQuery = "";
      searchClear?.classList.add("hidden");
      applyFilters();
    }
  });
}

// ─── Boot ─────────────────────────────────────────────────
async function boot() {
  await initI18n();
  initNav({
    onLangChange: async () => {
      if (state.activeFilter === "scholarship") {
        populateScholarshipFilters();
      }
      applyFilters();
    },
  });

  updateFavoritesBadge();
  wireEvents();
  initShareModal();
  loadOpportunities();
  initFromUrlParams();
  if (state.activeFilter === "scholarship") {
    mobileFilterToggleRow?.classList.remove("hidden");
    updateActiveFiltersCount();
  }
  applyFilters();
}

boot().catch(console.error);
