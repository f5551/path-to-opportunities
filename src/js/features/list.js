/**
 * list.js — Opportunities List Feature Logic & In-Memory Smart Indexing
 *
 * Encapsulates filtering, fast in-memory search indexing, and multi-criteria sorting
 * separated from DOM manipulation.
 */

import { normalizeText } from "../lib/searchUtils.js";
import { getOpportunityStatus } from "../lib/scholarshipStatus.js";

/** Valid opportunity types supported by schema */
export const VALID_TYPES = ["all", "scholarship", "course", "internship"];

// In-Memory Search Index Store
let _cachedItems = null;
const _searchIndexMap = new WeakMap();

// Geographic & Domain synonyms for rich cross-language discovery
const COUNTRY_SYNONYMS = {
  Australia: "استراليا أستراليا australia",
  "New Zealand": "نيوزيلندا نيوزيلندة new zealand",
  Canada: "كندا canada",
  "United States": "امريكا أمريكا الولايات المتحدة الامريكية united states usa us",
  Thailand: "تايلاند تايلند thailand",
  "United Kingdom": "بريطانيا المملكه المتحدة united kingdom uk britain",
  Germany: "المانيا ألمانيا germany deutschland",
  Japan: "اليابان japan",
  "المملكة العربية السعودية": "السعودية ksa saudi arabia",
  "الإمارات العربية المتحدة": "الامارات uae united arab emirates",
};

const LEVEL_SYNONYMS = {
  "Bachelor's": "بكالوريوس جامعي undergraduate bachelors",
  "Master's": "ماجستير دراسات عليا masters",
  "Master's by Research": "ماجستير بحثي masters research",
  PhD: "دكتوراه دكتوراة phd doctorate doctoral",
  "Professional Doctorate": "دكتوراه مهنية professional doctorate",
  "Postgraduate coursework": "دراسات عليا تخصصي coursework",
  "Professional postgraduate degree": "دراسات عليا مهنية professional",
  بكالوريوس: "بكالوريوس bachelor undergraduate",
  ماجستير: "ماجستير master postgraduate",
  دكتوراه: "دكتوراه phd doctorate",
  "دراسات عليا": "دراسات عليا postgraduate master phd",
};

const FUNDING_SYNONYMS = {
  full: "تمويل كامل ممولة بالكامل full fully funded",
  partial: "تمويل جزئي جزئية partial",
  unspecified: "غير محدد unspecified",
};

/**
 * Builds or refreshes the in-memory search index for all items.
 * Processes titles, organizations, geographic entities, study levels, fields,
 * funding classifications, and rich curricular details once.
 * @param {Array<object>} items
 */
export function buildSearchIndex(items = []) {
  if (!Array.isArray(items)) return;
  items.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const parts = [
      normalizeText(item.title_ar || ""),
      normalizeText(item.title_en || ""),
      normalizeText(item.organization || ""),
      normalizeText(item.field || ""),
    ];

    // Country with synonyms
    if (item.country) {
      parts.push(normalizeText(item.country));
      const syn = COUNTRY_SYNONYMS[item.country];
      if (syn) parts.push(normalizeText(syn));
    }

    // Level with synonyms
    if (Array.isArray(item.level)) {
      item.level.forEach((lvl) => {
        parts.push(normalizeText(lvl));
        const lvlSyn = LEVEL_SYNONYMS[lvl];
        if (lvlSyn) parts.push(normalizeText(lvlSyn));
      });
    } else if (item.level) {
      parts.push(normalizeText(item.level));
      const lvlSyn = LEVEL_SYNONYMS[item.level];
      if (lvlSyn) parts.push(normalizeText(lvlSyn));
    }

    // Funding type with synonyms
    if (item.funding_type) {
      parts.push(normalizeText(item.funding_type));
      const fundSyn = FUNDING_SYNONYMS[item.funding_type];
      if (fundSyn) parts.push(normalizeText(fundSyn));
    }

    // Rich curricular details
    if (item.details) {
      const ar = item.details.ar;
      const en = item.details.en;

      if (ar?.summary) parts.push(normalizeText(ar.summary));
      if (en?.summary) parts.push(normalizeText(en.summary));

      if (Array.isArray(ar?.fields_and_programs)) {
        parts.push(normalizeText(ar.fields_and_programs.join(" ")));
      }
      if (Array.isArray(en?.fields_and_programs)) {
        parts.push(normalizeText(en.fields_and_programs.join(" ")));
      }

      if (Array.isArray(ar?.funding_and_benefits)) {
        parts.push(normalizeText(ar.funding_and_benefits.join(" ")));
      }
      if (Array.isArray(ar?.eligibility)) {
        parts.push(normalizeText(ar.eligibility.join(" ")));
      }
      if (Array.isArray(ar?.important_notes)) {
        parts.push(normalizeText(ar.important_notes.join(" ")));
      }
    }

    const unifiedSearchable = parts.filter(Boolean).join(" ");
    _searchIndexMap.set(item, unifiedSearchable);
  });
  _cachedItems = items;
}

/**
 * Filter and search opportunities list based on criteria (AND logic)
 * @param {Array<object>} items - Raw opportunities array
 * @param {object} criteria
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
    status = "",
    sort = "default",
    lang = "ar",
  } = {}
) {
  if (!Array.isArray(items)) return [];

  // Build or verify in-memory index
  if (_cachedItems !== items) {
    buildSearchIndex(items);
  }

  let results = items;

  // 1. Filter by Type Category
  if (type && type !== "all" && VALID_TYPES.includes(type)) {
    results = results.filter((item) => item && item.type === type);
  }

  // 2. Advanced Criteria Filters (Strict AND logic)
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

  // 3. Status Filter (all, open, closed, review)
  if (status && status !== "all") {
    results = results.filter((item) => {
      if (!item) return false;
      const st = getOpportunityStatus(item, lang);
      if (status === "open") {
        return !st.isClosed;
      }
      if (status === "closed") {
        return st.isClosed === true;
      }
      if (status === "review") {
        return st.needsReview === true || item.verification?.needs_manual_review === true;
      }
      return true;
    });
  }

  // 4. In-Memory Search Index Query Matching
  const q = query ? query.trim() : "";
  if (q) {
    const rawTokens = normalizeText(q).split(" ").filter((tok) => tok.length > 0);
    // Ignore pure single-letter tokens if multiple tokens exist to prevent noise
    const queryTokens = rawTokens.length > 1 ? rawTokens.filter((tok) => tok.length >= 2) : rawTokens;

    if (queryTokens.length > 0) {
      results = results.filter((item) => {
        if (!item) return false;
        let searchable = _searchIndexMap.get(item);
        if (!searchable) {
          // Fallback if not yet indexed
          const levelStr = Array.isArray(item.level) ? item.level.join(" ") : item.level || "";
          searchable = normalizeText(`${item.title_ar} ${item.title_en} ${item.organization} ${item.field} ${item.country} ${levelStr}`);
        }
        return queryTokens.every((token) => searchable.includes(token));
      });
    }
  }

  // 5. Intelligent Result Ranking & Sorting
  results = sortOpportunities(results, sort, lang);

  return results;
}

/**
 * Sorts opportunities according to specified ranking strategy
 * @param {Array<object>} items
 * @param {string} [sortMode="default"]
 * @param {string} [lang="ar"]
 * @returns {Array<object>}
 */
export function sortOpportunities(items = [], sortMode = "default", lang = "ar") {
  if (!Array.isArray(items) || items.length <= 1) return items;

  const copy = [...items];

  if (sortMode === "deadline") {
    // Earliest deadline first
    return copy.sort((a, b) => {
      const stA = getOpportunityStatus(a, lang);
      const stB = getOpportunityStatus(b, lang);

      // 1. Items with active upcoming deadline
      const diffA = stA.daysRemaining !== null && !stA.isClosed ? stA.daysRemaining : 99999;
      const diffB = stB.daysRemaining !== null && !stB.isClosed ? stB.daysRemaining : 99999;

      if (diffA !== diffB) return diffA - diffB;

      // 2. Open rolling / auto items
      if (!stA.isClosed && stB.isClosed) return -1;
      if (stA.isClosed && !stB.isClosed) return 1;

      return 0;
    });
  }

  if (sortMode === "newest") {
    // Most recently verified / added first
    return copy.sort((a, b) => {
      const dateA = a.verified_at || "";
      const dateB = b.verified_at || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (a.id || "").localeCompare(b.id || "");
    });
  }

  if (sortMode === "name") {
    // Alphabetical by title according to current locale
    const isAr = lang === "ar";
    return copy.sort((a, b) => {
      const titleA = isAr ? a.title_ar || a.title_en : a.title_en || a.title_ar;
      const titleB = isAr ? b.title_ar || b.title_en : b.title_en || b.title_ar;
      return (titleA || "").localeCompare(titleB || "", isAr ? "ar" : "en");
    });
  }

  // Default: Smart Ranking Strategy
  // 1. Open scholarships with specific upcoming deadline (ordered ascending by closest deadline)
  // 2. Open scholarships with rolling review or confirmed automatic evaluation
  // 3. Open scholarships with multiple rounds or status needing review
  // 4. Closed scholarships at the end of results
  return copy.sort((a, b) => {
    const stA = getOpportunityStatus(a, lang);
    const stB = getOpportunityStatus(b, lang);

    function getRank(st, opp) {
      if (st.isClosed) return 4;
      if (st.daysRemaining !== null && st.daysRemaining >= 0 && !st.hasMultipleRounds) return 1;
      if (st.code === "rolling" || st.code === "automatic") return 2;
      return 3; // multiple rounds or needs review
    }

    const rankA = getRank(stA, a);
    const rankB = getRank(stB, b);

    if (rankA !== rankB) return rankA - rankB;

    // Within Rank 1: Sort by closest deadline
    if (rankA === 1) {
      return (stA.daysRemaining || 0) - (stB.daysRemaining || 0);
    }

    // Within Rank 2: Most recently verified, then name
    if (rankA === 2) {
      const vComp = (b.verified_at || "").localeCompare(a.verified_at || "");
      if (vComp !== 0) return vComp;
    }

    // Within Rank 3: Upcoming round days if present
    if (rankA === 3) {
      if (stA.daysRemaining !== null && stB.daysRemaining !== null) {
        return stA.daysRemaining - stB.daysRemaining;
      }
    }

    // Within Rank 4: Most recently closed first
    if (rankA === 4) {
      const dA = a.deadline || "";
      const dB = b.deadline || "";
      if (dA !== dB) return dB.localeCompare(dA);
    }

    return (a.id || "").localeCompare(b.id || "");
  });
}

/**
 * Dynamically extract distinct filter options from scholarship records
 * @param {Array<object>} items
 * @returns {{ countries: string[], levels: string[], fields: string[], fundingTypes: string[], statuses: string[], sortOptions: string[] }}
 */
export function getScholarshipFilterOptions(items = []) {
  if (!Array.isArray(items)) {
    return {
      countries: [],
      levels: [],
      fields: [],
      fundingTypes: [],
      statuses: ["open", "closed", "review"],
      sortOptions: ["default", "deadline", "newest", "name"],
    };
  }

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

  const statuses = ["open", "closed", "review"];
  const sortOptions = ["default", "deadline", "newest", "name"];

  return { countries, levels, fields, fundingTypes, statuses, sortOptions };
}
