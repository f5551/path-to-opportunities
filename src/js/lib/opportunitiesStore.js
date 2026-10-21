/**
 * opportunitiesStore.js — Data layer
 *
 * Loads opportunities from opportunities.json (bundled via Vite's
 * import, which copies the file into the build output automatically).
 * No data duplication, no backend.
 *
 * In production Vite builds, ?url imports are handled by Vite's
 * static asset pipeline. Direct JSON import is even simpler and
 * lets Vite include the file in the bundle.
 */

// Vite handles JSON imports natively — no server needed.
// The file is included at build time and tree-shaken as an ES module.
import rawData from "../../../opportunities.json" with { type: "json" };
import { filterOpportunities, getScholarshipFilterOptions, buildSearchIndex } from "../features/list.js";

/** @type {Array<object>} */
let _all = [];
let _loadError = null;

/**
 * Validate that an opportunity object matches the schema contract
 * @param {any} item
 * @returns {boolean}
 */
export function isValidOpportunity(item) {
  if (!item || typeof item !== "object") return false;

  const isLevelValid =
    typeof item.level === "string" ||
    (Array.isArray(item.level) && item.level.length > 0 && item.level.every((l) => typeof l === "string"));

  const isFundingValid =
    typeof item.funding_type === "undefined" ||
    ["full", "partial", "unspecified"].includes(item.funding_type);

  const isDeadlineValid =
    item.deadline === null ||
    (typeof item.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.deadline));

  const isSourceUrlValid =
    typeof item.source_url === "string" && /^https:\/\//i.test(item.source_url);

  const isVerifiedAtValid =
    typeof item.verified_at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.verified_at);

  const isIdValid =
    typeof item.id === "string" && /^opp-[a-zA-Z0-9_-]+$/.test(item.id);

  return (
    isIdValid &&
    typeof item.type === "string" &&
    ["scholarship", "course", "internship"].includes(item.type) &&
    typeof item.title_ar === "string" &&
    item.title_ar.length >= 3 &&
    typeof item.title_en === "string" &&
    item.title_en.length >= 3 &&
    typeof item.organization === "string" &&
    item.organization.length >= 2 &&
    typeof item.country === "string" &&
    item.country.length >= 2 &&
    typeof item.field === "string" &&
    item.field.length >= 2 &&
    isLevelValid &&
    isFundingValid &&
    isDeadlineValid &&
    isSourceUrlValid &&
    isVerifiedAtValid
  );
}

/** Load and validate opportunities from bundled JSON */
export function loadOpportunities() {
  try {
    _loadError = null;
    if (Array.isArray(rawData)) {
      _all = rawData.filter(isValidOpportunity);
      if (rawData.length > 0 && _all.length !== rawData.length) {
        console.warn(`[Store] ${rawData.length - _all.length} invalid items were filtered out.`);
      }
      buildSearchIndex(_all);
    } else {
      _all = [];
      _loadError = new Error("opportunities.json is not an array");
      console.warn("[Store] opportunities.json is not an array — using empty set");
    }
  } catch (err) {
    _all = [];
    _loadError = err;
    console.error("[Store] Failed to load opportunities:", err);
  }
  return _all;
}

/** Return any error that occurred during load */
export function getLoadError() {
  return _loadError;
}

/** Return all loaded opportunities */
export function getAll() {
  return _all;
}

/**
 * Filter and search opportunities
 * @param {object} opts
 * @returns {Array}
 */
export function filter(opts = {}) {
  if (_all.length === 0 && !_loadError) {
    loadOpportunities();
  }
  return filterOpportunities(_all, opts);
}

/**
 * Get single opportunity by unique ID
 * @param {string} id
 * @returns {object|null}
 */
export function getById(id) {
  if (!id) return null;
  if (_all.length === 0 && !_loadError) {
    loadOpportunities();
  }
  return _all.find((o) => o.id === id) || null;
}

/**
 * Return balanced featured opportunities for landing page
 * @param {number} [count=3]
 * @returns {Array<object>}
 */
export function getFeatured(count = 3) {
  if (_all.length === 0 && !_loadError) {
    loadOpportunities();
  }

  const featured = [];
  const scholarship = _all.find((o) => o.type === "scholarship");
  const course = _all.find((o) => o.type === "course");
  const internship = _all.find((o) => o.type === "internship");

  if (scholarship) featured.push(scholarship);
  if (course) featured.push(course);
  if (internship) featured.push(internship);

  for (const item of _all) {
    if (featured.length >= count) break;
    if (!featured.some((f) => f.id === item.id)) {
      featured.push(item);
    }
  }
  return featured;
}

/**
 * Return dynamic filter options for scholarship categories
 * @returns {object} { countries, levels, fields, fundingTypes }
 */
export function getFilterOptions() {
  if (_all.length === 0 && !_loadError) {
    loadOpportunities();
  }
  return getScholarshipFilterOptions(_all);
}

/**
 * Asynchronous loader with fetch fallback for runtime environments
 * @returns {Promise<Array<object>>}
 */
export async function loadOpportunitiesAsync() {
  if (_all.length > 0) return _all;
  try {
    loadOpportunities();
    if (_all.length > 0) return _all;
  } catch {}

  try {
    const baseUrl = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";
    const cleanBase = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    const res = await fetch(`${cleanBase}opportunities.json`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        _all = data.filter(isValidOpportunity);
        return _all;
      }
    }
  } catch (err) {
    console.warn("[Store] Runtime fetch fallback failed:", err);
  }
  return _all;
}



