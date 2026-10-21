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
 * - Updates dynamic page title
 * - Updates language switcher UI
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

  // Dynamic document title update (fallback/default for each page)
  updateDocumentTitle();

  // Update all language switcher triggers, menus, and drawer buttons
  updateLangSwitcherUI(lang);
}

/**
 * Updates document.title using localized meta titles
 */
function updateDocumentTitle() {
  const path = window.location.pathname.toLowerCase();
  let titleKey = "meta.homeTitle";
  if (path.includes("opportunities.html")) {
    titleKey = "meta.opportunitiesTitle";
  } else if (path.includes("guide.html")) {
    titleKey = "meta.guideTitle";
  } else if (path.includes("login.html")) {
    titleKey = "meta.loginTitle";
  } else if (path.includes("register.html")) {
    titleKey = "meta.registerTitle";
  } else if (path.includes("detail.html")) {
    titleKey = "meta.detailTitle";
  }
  const translated = i18next.t(titleKey);
  if (translated && translated !== titleKey) {
    document.title = translated;
  }
}

/**
 * Synchronize all language switcher widgets across the document
 */
export function updateLangSwitcherUI(lang) {
  const switchers = document.querySelectorAll(".lang-switcher");
  switchers.forEach((switcher) => {
    const trigger = switcher.querySelector(".lang-btn");
    const currentLabel = switcher.querySelector(".lang-current-label");
    if (currentLabel) {
      currentLabel.textContent = lang === "ar" ? "العربية" : "English";
    }
    if (trigger) {
      trigger.setAttribute(
        "aria-label",
        lang === "ar"
          ? "تغيير اللغة (الحالية: العربية)"
          : "Select language (Current: English)"
      );
    }

    const options = switcher.querySelectorAll(".lang-option");
    options.forEach((opt) => {
      const isSelected = opt.dataset.langValue === lang;
      opt.setAttribute("aria-selected", isSelected ? "true" : "false");
      opt.classList.toggle("active", isSelected);
    });
  });

  const drawerBtns = document.querySelectorAll(".drawer-lang-btn");
  drawerBtns.forEach((btn) => {
    const isSelected = btn.dataset.langValue === lang;
    btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    btn.classList.toggle("active", isSelected);
  });
}

/** Switch specifically to target language */
export async function setLanguage(next) {
  if (!SUPPORTED.includes(next)) return i18next.language;
  if (i18next.language !== next) {
    await i18next.changeLanguage(next);
    saveLang(next);
  }
  applyLang(next);
  return next;
}

/** Switch to the other language */
export async function toggleLang() {
  const current = i18next.language;
  const next = current === "ar" ? "en" : "ar";
  return setLanguage(next);
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
