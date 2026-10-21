/**
 * list.js — Opportunities List Feature Logic
 *
 * Encapsulates filtering, search logic, and state management
 * separated from DOM manipulation.
 */

import { matchQuery } from "../lib/searchUtils.js";

/** Valid opportunity types supported by schema */
export const VALID_TYPES = ["all", "scholarship", "course", "internship"];

/**
 * Filter and search opportunities list based on criteria (AND logic)
 * @param {Array<object>} items - Raw opportunities array
 * @param {object} criteria - { type?: string, query?: string, country?: string, level?: string, field?: string, fundingType?: string }
 * @returns {Array<object>}
 */
export function filterOpportunities(
  items = [],
  {
    type = "all",
    query = "",
    country = "",
    level = "",
    field = "",
    fundingType = "",
  } = {}
) {
  if (!Array.isArray(items)) return [];

  let results = items;

  // 1. Filter by Type
  if (type && type !== "all" && VALID_TYPES.includes(type)) {
    results = results.filter((item) => item && item.type === type);
  }

  // 2. Advanced Filters (for scholarships or general match)
  if (country) {
    results = results.filter((item) => item && item.country === country);
  }

  if (level) {
    results = results.filter((item) => {
      if (!item || !item.level) return false;
      if (Array.isArray(item.level)) {
        return item.level.includes(level);
      }
      return item.level === level;
    });
  }

  if (field) {
    results = results.filter((item) => item && item.field === field);
  }

  if (fundingType) {
    results = results.filter((item) => item && item.funding_type === fundingType);
  }

  // 3. Search by Query (Arabic with Tashkeel/Alef normalization, English case-insensitive)
  const q = query ? query.trim() : "";
  if (q) {
    results = results.filter((item) => {
      if (!item) return false;

      const levelStr = Array.isArray(item.level) ? item.level.join(" ") : item.level || "";
      const searchable = `${item.title_ar} ${item.title_en} ${item.organization} ${item.field} ${item.country} ${levelStr}`;

      return matchQuery(searchable, q);
    });
  }

  return results;
}

/**
 * Dynamically extract distinct filter options from scholarship records
 * @param {Array<object>} items
 * @returns {{ countries: string[], levels: string[], fields: string[], fundingTypes: string[] }}
 */
export function getScholarshipFilterOptions(items = []) {
  if (!Array.isArray(items)) return { countries: [], levels: [], fields: [], fundingTypes: [] };

  const scholarships = items.filter((item) => item && item.type === "scholarship");

  // Distinct countries
  const countries = Array.from(
    new Set(scholarships.map((s) => s.country).filter((c) => typeof c === "string" && c.trim()))
  ).sort();

  // Distinct levels (flatten arrays if any)
  const levelsSet = new Set();
  scholarships.forEach((s) => {
    if (Array.isArray(s.level)) {
      s.level.forEach((l) => l && typeof l === "string" && levelsSet.add(l.trim()));
    } else if (typeof s.level === "string" && s.level.trim()) {
      levelsSet.add(s.level.trim());
    }
  });
  const levels = Array.from(levelsSet).sort();

  // Distinct fields
  const fields = Array.from(
    new Set(scholarships.map((s) => s.field).filter((f) => typeof f === "string" && f.trim()))
  ).sort();

  // Distinct funding types
  const fundingTypes = Array.from(
    new Set(scholarships.map((s) => s.funding_type).filter((ft) => typeof ft === "string" && ft.trim()))
  );

  return { countries, levels, fields, fundingTypes };
}

