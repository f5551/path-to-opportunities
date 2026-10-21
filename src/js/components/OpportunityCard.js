/**
 * OpportunityCard.js — Card component factory
 *
 * Returns an <article> DOM element for a single opportunity.
 * Uses the current i18next language for title/badge text.
 */

import { t, formatDate } from "../lib/i18n.js";
import { escHtml, escAttr, sanitizeUrl } from "../lib/searchUtils.js";

export { sanitizeUrl };

/** Icons (inline SVG strings) keyed by type */
const TYPE_ICONS = {
  scholarship: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  course: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  internship: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
};

const META_ICONS = {
  org: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
  country: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  field: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  clock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  external: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>`,
};

/**
 * Determine deadline display info
 * @param {string|null} deadline
 * @returns {{ label: string, urgent: boolean, open: boolean }}
 */
function parseDeadline(deadline) {
  if (!deadline) {
    return { label: t("card.deadlineOpen"), urgent: false, open: true };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline + "T00:00:00");
  const diff = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return { label: t("card.deadline") + ": " + formatDate(deadline), urgent: false, open: false };
  }
  if (diff === 0) {
    return { label: t("card.deadlineUrgent"), urgent: true, open: false };
  }
  if (diff <= 7) {
    return { label: formatDate(deadline), urgent: true, open: false };
  }

  return { label: formatDate(deadline), urgent: false, open: false };
}

/**
 * Build a card DOM element for one opportunity
 * @param {object} opp - opportunity data object
 * @returns {HTMLElement}
 */
export function createCard(opp) {
  const lang = document.documentElement.lang || "ar";
  const title = lang === "ar" ? opp.title_ar : opp.title_en;
  const badgeLabel = t(`badge.${opp.type}`);
  const { label: deadlineLabel, urgent } = parseDeadline(opp.deadline);

  const isDemo = opp.id?.includes("demo") || opp.title_ar?.includes("[تجريبي]") || opp.source_url?.includes("example.org");
  const demoBadgeLabel = t("card.demoBadge", { defaultValue: "تجريبي" });
  const demoDisabledLabel = t("card.demoApplyDisabled", { defaultValue: "تقديم تجريبي معطّل" });

  const levelDisplay = Array.isArray(opp.level) ? opp.level.join(" • ") : (opp.level || "");
  const fundingLabel = opp.funding_type ? t(`funding.${opp.funding_type}`, { defaultValue: opp.funding_type }) : null;

  const article = document.createElement("article");
  article.className = "opp-card group";
  article.setAttribute("role", "listitem");
  article.setAttribute("tabindex", "0");
  article.setAttribute(
    "aria-label",
    `${title} — ${opp.organization} — ${badgeLabel}`
  );
  article.dataset.id = opp.id;
  article.dataset.type = opp.type;

  article.innerHTML = `
    <div class="card-header">
      <div class="card-badges">
        <span class="type-badge ${opp.type}" aria-label="${badgeLabel}">
          ${TYPE_ICONS[opp.type] || ""}
          <span>${badgeLabel}</span>
        </span>
        ${
          fundingLabel && opp.type === "scholarship"
            ? `<span class="funding-badge funding-${escAttr(opp.funding_type)}" aria-label="${escHtml(fundingLabel)}">${escHtml(fundingLabel)}</span>`
            : ""
        }
        ${
          isDemo
            ? `<span class="demo-tag" aria-label="فرصة تجريبية">${escHtml(demoBadgeLabel)}</span>`
            : ""
        }
      </div>
      <span class="level-badge" title="${t("card.level")}">
        ${escHtml(levelDisplay)}
      </span>
    </div>

    <div class="card-body-content">
      <h3 class="card-title">
        <a href="detail.html?id=${escAttr(opp.id)}" class="card-title-link">
          ${escHtml(title)}
        </a>
      </h3>
      
      <div class="card-meta">
        <div class="card-meta-item">
          <span class="card-meta-icon">${META_ICONS.org}</span>
          <span class="card-meta-text" title="${escHtml(opp.organization)}">${escHtml(opp.organization)}</span>
        </div>
        <div class="card-meta-item">
          <span class="card-meta-icon">${META_ICONS.field}</span>
          <span class="card-meta-text" title="${escHtml(opp.field)}">${escHtml(opp.field)}</span>
        </div>
        <div class="card-meta-item">
          <span class="card-meta-icon">${META_ICONS.country}</span>
          <span class="card-meta-text">${escHtml(opp.country)}</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <span class="card-deadline${urgent ? " urgent" : ""}" aria-label="${t("card.deadline")}: ${deadlineLabel}">
        ${META_ICONS.clock}
        <span>${escHtml(deadlineLabel)}</span>
      </span>
      <a
        href="detail.html?id=${escAttr(opp.id)}"
        class="card-cta card-cta-details"
        aria-label="${t("card.viewDetails")} — ${escHtml(title)}"
      >
        <span>${t("card.viewDetails")}</span>
        <svg class="cta-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </a>
    </div>
  `;

  // Clicking anywhere on card navigates to detail, unless clicked on another anchor
  article.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    window.location.href = `detail.html?id=${encodeURIComponent(opp.id)}`;
  });

  // Keyboard: Enter/Space activates the detail link
  article.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      if (!e.target.closest("a")) {
        e.preventDefault();
        window.location.href = `detail.html?id=${encodeURIComponent(opp.id)}`;
      }
    }
  });

  return article;
}

/** Build a skeleton placeholder card for loading state */
export function createSkeletonCard() {
  const div = document.createElement("div");
  div.className = "card-skeleton";
  div.setAttribute("aria-hidden", "true");
  div.innerHTML = `
    <div class="skel-badge skeleton"></div>
    <div class="skel-title-1 skeleton"></div>
    <div class="skel-title-2 skeleton"></div>
    <div class="skel-meta skeleton"></div>
    <div class="skel-meta-sm skeleton"></div>
    <div class="skel-footer"></div>
    <div style="display:flex; justify-content: space-between; align-items:center;">
      <div class="skel-meta skeleton" style="width:80px"></div>
      <div class="skel-cta skeleton"></div>
    </div>
  `;
  return div;
}
