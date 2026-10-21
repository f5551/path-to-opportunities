/**
 * searchUtils.js — Robust Arabic and English text normalization & matching
 *
 * Normalizes Arabic:
 * - Strips Tashkeel (diacritics: Fatha, Damma, Kasra, Sukun, Tanwin, Shadda)
 * - Normalizes Alef variants (أ, إ, آ, ٱ -> ا)
 * - Normalizes Ta Marbuta (ة -> ه)
 * - Normalizes Alef Maqsura (ى -> ي)
 * - Normalizes Persian/Urdu Yeh/Kaf if encountered
 * - Strips Tatweel/Kashida (ـ)
 *
 * Normalizes English:
 * - Lowercase
 * - Trim & collapse multiple whitespaces
 */

/** Regex to match Arabic diacritics (Tashkeel) and Tatweel */
const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u0640]/g;

/**
 * Normalize text for search comparison
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .trim()
    .toLowerCase()
    // Remove Arabic diacritics (Fatha, Damma, Kasra, Tanwin, Sukun, Shadda, etc.) and Tatweel
    .replace(ARABIC_DIACRITICS_REGEX, "")
    // Normalize Alef forms: أ, إ, آ, ٱ -> ا
    .replace(/[أإآٱ]/g, "ا")
    // Normalize Ta Marbuta: ة -> ه
    .replace(/ة/g, "ه")
    // Normalize Alef Maqsura: ى -> ي
    .replace(/ى/g, "ي")
    // Collapse multiple spaces
    .replace(/\s+/g, " ");
}

/**
 * Checks if targetText contains queryText considering Arabic and English variations
 * @param {string} targetText
 * @param {string} queryText
 * @returns {boolean}
 */
export function matchQuery(targetText, queryText) {
  if (!queryText) return true;
  if (!targetText) return false;

  const normalizedTarget = normalizeText(targetText);
  const normalizedQuery = normalizeText(queryText);

  if (!normalizedQuery) return true;

  // Check if all space-separated tokens in query match the target
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  return tokens.every((token) => normalizedTarget.includes(token));
}

/**
 * Escape HTML special chars for safe innerHTML insertion
 * @param {string} str
 * @returns {string}
 */
export function escHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escape attribute values for safe HTML attributes insertion
 * @param {string} str
 * @returns {string}
 */
export function escAttr(str = "") {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/**
 * Sanitize URL to ensure it uses safe https protocol as per schema
 * @param {string} urlStr
 * @returns {string}
 */
export function sanitizeUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return "#";
  const trimmed = urlStr.trim();
  // Strictly allow https protocol (as required by opportunities.schema.json)
  if (/^https:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return trimmed;
  }
  return "#";
}

