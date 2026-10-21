/**
 * i18n.js — Localization module using i18next
 *
 * Handles language detection, locale switching, DOM binding,
 * RTL/LTR direction, and localStorage persistence.
 */

import i18next from "i18next";
import ar from "../../locales/ar/translation.json" with { type: "json" };
import en from "../../locales/en/translation.json" with { type: "json" };

const STORAGE_KEY = "pto_lang";
const SUPPORTED = ["ar", "en"];
const DEFAULT_LANG = "ar";

/** Get persisted language or fall back to default */
function getSavedLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {
    // storage unavailable
  }
  return DEFAULT_LANG;
}

/** Persist language preference */
function saveLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

/** Initialize i18next */
export async function initI18n() {
  const lang = getSavedLang();

  await i18next.init({
    lng: lang,
    fallbackLng: DEFAULT_LANG,
    resources: {
      ar: { translation: ar.translation },
      en: { translation: en.translation },
    },
    interpolation: { escapeValue: false },
  });

  applyLang(lang);
  return i18next;
}

/**
 * Apply language to the document:
 * - Updates <html lang> and <html dir>
 * - Re-renders all data-i18n elements
 * - Updates placeholder text
 * - Updates aria-labels on lang toggle
 */
export function applyLang(lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
  html.dataset.lang = lang;

  // data-i18n bindings — text content
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const text = i18next.t(key);
    if (text && text !== key) el.textContent = text;
  });

  // data-i18n-placeholder bindings
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const text = i18next.t(key);
    if (text && text !== key) el.placeholder = text;
  });

  // aria-label on lang toggle button
  const langToggle = document.getElementById("lang-toggle");
  if (langToggle) {
    langToggle.setAttribute(
      "aria-label",
      lang === "ar" ? "Switch to English" : "التبديل إلى العربية"
    );
  }
}

/** Switch to the other language */
export async function toggleLang() {
  const current = i18next.language;
  const next = current === "ar" ? "en" : "ar";
  await i18next.changeLanguage(next);
  saveLang(next);
  applyLang(next);
  return next;
}

/** Convenience: translate a key */
export function t(key, opts) {
  return i18next.t(key, opts);
}

/**
 * Format a YYYY-MM-DD date string using current document language
 * @param {string|null} dateStr
 * @returns {string|null}
 */
export function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const lang = document.documentElement.lang || "ar";
    const d = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default i18next;
