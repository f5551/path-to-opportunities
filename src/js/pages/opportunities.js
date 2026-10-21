/**
 * opportunities.js — Dedicated Directory & Filter Hub Controller
 *
 * Handles live search, tab switching, multi-criteria scholarship filters,
 * URL query parameters (?q=... & ?type=...), skeleton loading, and animations.
 */

import { initI18n, t } from "../lib/i18n.js";
import { initNav } from "../lib/nav.js";
import { loadOpportunities, filter, getFilterOptions } from "../lib/opportunitiesStore.js";
import { createCard, createSkeletonCard } from "../components/OpportunityCard.js";
import {
  animateCardsEnter,
  animateGridRefresh,
  animateTabPress,
} from "../lib/animations.js";

// ─── State ────────────────────────────────────────────────
const state = {
  activeFilter: "all",
  searchQuery: "",
  scholarshipFilters: {
    country: "",
    level: "",
    field: "",
    fundingType: "",
  },
};

// ─── DOM Elements ─────────────────────────────────────────
const grid = document.getElementById("opps-grid");
const emptyState = document.getElementById("empty-state");
const noResults = document.getElementById("no-results");
const errorState = document.getElementById("error-state");
const resultsCount = document.getElementById("results-count");
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");
const clearFiltersBtn = document.getElementById("clear-filters");
const filterTabs = document.querySelectorAll(".filter-tab");
const scholarshipFiltersWrap = document.getElementById("scholarship-filters");
const filterCountry = document.getElementById("filter-country");
const filterLevel = document.getElementById("filter-level");
const filterField = document.getElementById("filter-field");
const filterFunding = document.getElementById("filter-funding");
const resetScholarshipFiltersBtn = document.getElementById("reset-scholarship-filters");

// ─── Render Functions ─────────────────────────────────────
function showSkeletons(count = 6) {
  if (!grid) return;
  grid.innerHTML = "";
  emptyState?.classList.add("hidden");
  noResults?.classList.add("hidden");
  errorState?.classList.add("hidden");
  for (let i = 0; i < count; i++) {
    grid.appendChild(createSkeletonCard());
  }
}

async function renderOpportunities(opportunities) {
  if (!grid) return;
  grid.innerHTML = "";
  emptyState?.classList.add("hidden");
  noResults?.classList.add("hidden");
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
    noResults?.classList.remove("hidden");
    updateResultsCount(0);
    return;
  }

  const fragment = document.createDocumentFragment();
  const cardEls = opportunities.map(createCard);
  cardEls.forEach((card) => fragment.appendChild(card));
  grid.appendChild(fragment);

  updateResultsCount(opportunities.length);
  await animateCardsEnter(cardEls);
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

  populateSelect(
    filterCountry,
    options.countries,
    state.scholarshipFilters.country,
    t("scholarshipFilters.allCountries")
  );

  populateSelect(
    filterLevel,
    options.levels,
    state.scholarshipFilters.level,
    t("scholarshipFilters.allLevels")
  );

  populateSelect(
    filterField,
    options.fields,
    state.scholarshipFilters.field,
    t("scholarshipFilters.allFields")
  );

  populateFundingSelect(
    filterFunding,
    options.fundingTypes,
    state.scholarshipFilters.fundingType
  );
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

  if (filterCountry) filterCountry.value = "";
  if (filterLevel) filterLevel.value = "";
  if (filterField) filterField.value = "";
  if (filterFunding) filterFunding.value = "";
}

async function applyFilters() {
  const results = filter({
    type: state.activeFilter,
    query: state.searchQuery,
    country: state.scholarshipFilters.country,
    level: state.scholarshipFilters.level,
    field: state.scholarshipFilters.field,
    fundingType: state.scholarshipFilters.fundingType,
  });

  await animateGridRefresh(grid);
  await renderOpportunities(results);
}

// ─── URL Parameters Sync ──────────────────────────────────
function initFromUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  const type = params.get("type");

  if (q) {
    state.searchQuery = q;
    if (searchInput) searchInput.value = q;
    searchClear?.classList.remove("hidden");
  }

  if (type && ["scholarship", "course", "internship"].includes(type)) {
    state.activeFilter = type;
    filterTabs.forEach((tab) => {
      const match = tab.dataset.filter === type;
      tab.classList.toggle("active", match);
      tab.setAttribute("aria-selected", match ? "true" : "false");
    });

    if (type === "scholarship") {
      populateScholarshipFilters();
      scholarshipFiltersWrap?.classList.remove("hidden");
    }
  }
}

// ─── Wire Event Listeners ─────────────────────────────────
function wireEvents() {
  // Tab clicks
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      const newFilter = tab.dataset.filter;
      if (newFilter === state.activeFilter) return;

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
      } else {
        scholarshipFiltersWrap?.classList.add("hidden");
        resetScholarshipFilterState();
      }

      // Sync URL parameter seamlessly without reload
      try {
        const url = new URL(window.location.href);
        if (newFilter === "all") {
          url.searchParams.delete("type");
        } else {
          url.searchParams.set("type", newFilter);
        }
        window.history.replaceState({}, "", url.toString());
      } catch {}

      await animateTabPress(tab);
      await applyFilters();
    });
  });

  // Scholarship Selects
  filterCountry?.addEventListener("change", (e) => {
    state.scholarshipFilters.country = e.target.value;
    applyFilters();
  });
  filterLevel?.addEventListener("change", (e) => {
    state.scholarshipFilters.level = e.target.value;
    applyFilters();
  });
  filterField?.addEventListener("change", (e) => {
    state.scholarshipFilters.field = e.target.value;
    applyFilters();
  });
  filterFunding?.addEventListener("change", (e) => {
    state.scholarshipFilters.fundingType = e.target.value;
    applyFilters();
  });

  // Reset button
  resetScholarshipFiltersBtn?.addEventListener("click", () => {
    resetScholarshipFilterState();
    applyFilters();
  });

  // Search input with debounce
  let debounceTimer = null;
  searchInput?.addEventListener("input", () => {
    const val = searchInput.value;
    state.searchQuery = val;
    searchClear?.classList.toggle("hidden", !val.trim());

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applyFilters();
    }, 280);
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
    resetScholarshipFilterState();
    scholarshipFiltersWrap?.classList.add("hidden");

    if (searchInput) searchInput.value = "";
    searchClear?.classList.add("hidden");

    filterTabs.forEach((tab) => {
      const isAll = tab.dataset.filter === "all";
      tab.classList.toggle("active", isAll);
      tab.setAttribute("aria-selected", isAll ? "true" : "false");
    });

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("type");
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.pathname);
    } catch {}

    applyFilters();
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
      await applyFilters();
    },
  });

  showSkeletons(6);
  wireEvents();
  loadOpportunities();
  initFromUrlParams();
  await applyFilters();
}

boot().catch(console.error);
