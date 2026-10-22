/**
 * OpportunityCard.js — Modern Minimal Opportunity Card Component
 *
 * Renders an accessible, structured, mobile-first <article> card for educational opportunities.
 * Features:
 * - Priority-driven visual hierarchy: Status -> Institution & Title -> Country, Level, Field -> Funding Badge -> Deadline & View Details CTA
 * - Complete removal of legacy monogram initials/avatar (UT, KS, GU, etc.) from the UI
 * - Mobile-first layout with >=44x44px touch targets
 * - Smooth micro-interactions and prefers-reduced-motion compliance
 * - Zero timezone drift calendar-accurate status engine
 */

import { t, formatDate } from "../lib/i18n.js";
import { escHtml, escAttr, sanitizeUrl } from "../lib/searchUtils.js";
import { getOpportunityStatus } from "../lib/scholarshipStatus.js";

export { sanitizeUrl };

/** Icons (inline SVG strings) */
const ICONS = {
  scholarship: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  course: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  internship: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  institution: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2l10 8H2z"/></svg>`,
  country: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  level: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  field: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  funding: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  calendar: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  arrow: `<svg class="cta-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
};

/**
 * Generate 2-character monogram / initials for organization
 * Preserved for programmatic/unit test compatibility (QA test 3.3)
 * @param {string} orgName
 * @returns {string}
 */
export function getOrgInitials(orgName) {
  if (!orgName || typeof orgName !== "string") return "OP";
  const words = orgName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "OP";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  // Pattern: "University of [Melbourne]" -> "UM"
  if (words[0].toLowerCase() === "university" && words[1]?.toLowerCase() === "of" && words[2]) {
    return ("U" + words[2][0]).toUpperCase();
  }
  // Pattern: "The University of [Queensland]" -> "UQ"
  if (words[0].toLowerCase() === "the" && words[1]?.toLowerCase() === "university" && words[2]?.toLowerCase() === "of" && words[3]) {
    return ("U" + words[3][0]).toUpperCase();
  }
  // Pattern: "جامعة [ملبورن]" -> "جم"
  if (words[0] === "جامعة" && words[1]) {
    return ("ج" + words[1][0]);
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Build a modern minimal card DOM element for one opportunity
 * @param {object} opp - opportunity data object
 * @returns {HTMLElement}
 */
export function createCard(opp) {
  const lang = (typeof document !== "undefined" && document.documentElement?.lang) || "ar";
  const isAr = lang === "ar";
  const title = isAr ? opp.title_ar : opp.title_en;
  const badgeLabel = t(`badge.${opp.type}`);

  // Compute calendar-accurate status via status engine
  const status = getOpportunityStatus(opp, lang);

  const isDemo = opp.id?.includes("demo") || opp.title_ar?.includes("[تجريبي]") || opp.source_url?.includes("example.org");
  const demoBadgeLabel = t("card.demoBadge", { defaultValue: isAr ? "تجريبي" : "Demo" });

  const levelsList = Array.isArray(opp.level) ? opp.level : (opp.level ? [opp.level] : []);
  const levelDisplay = levelsList.map((lvl) => t(`levels.${lvl}`, { defaultValue: lvl })).join(" • ");

  const fundingLabel = opp.funding_type ? t(`funding.${opp.funding_type}`, { defaultValue: opp.funding_type }) : null;
  const countryDisplay = t(`countries.${opp.country}`, { defaultValue: opp.country });

  let fieldDisplay = opp.field;
  if (isAr && opp.details?.ar?.fields_and_programs?.length) {
    const rawFields = opp.details.ar.fields_and_programs;
    const cleanDiscipline = rawFields.find((f) => !f.toLowerCase().includes("higher degree") && !f.includes("برامج") && !f.includes("جميع")) || rawFields[0];
    if (cleanDiscipline) fieldDisplay = cleanDiscipline;
  }

  const footerText = status.subtitle || (opp.deadline ? formatDate(opp.deadline) : t("card.deadlineOpen"));

  const article = document.createElement("article");
  article.className = `opp-card group ${status.isClosed ? "card-closed" : ""}`;
  article.setAttribute("role", "listitem");
  article.setAttribute("tabindex", "0");
  article.setAttribute(
    "aria-label",
    `${title} — ${opp.organization} — ${status.badgeText}`
  );
  article.dataset.id = opp.id;
  article.dataset.type = opp.type;

  article.innerHTML = `
    <div class="card-header">
      <div class="card-status-wrap">
        <span class="status-badge ${status.badgeClass}">
          <span class="status-dot" aria-hidden="true"></span>
          <span>${escHtml(status.badgeText)}</span>
        </span>
        ${
          isDemo
            ? `<span class="demo-tag" aria-label="${isAr ? "فرصة تجريبية" : "Demo opportunity"}">${escHtml(demoBadgeLabel)}</span>`
            : ""
        }
      </div>
      ${
        opp.type !== "scholarship"
          ? `<span class="type-badge ${opp.type}" aria-label="${badgeLabel}">
              ${ICONS[opp.type] || ""}
              <span>${badgeLabel}</span>
            </span>`
          : ""
      }
    </div>

    <div class="card-institution" title="${escHtml(opp.organization)}">
      <span class="card-institution-icon" aria-hidden="true">${ICONS.institution}</span>
      <span class="card-institution-name">${escHtml(opp.organization)}</span>
    </div>

    <h3 class="card-title">
      <a href="detail.html?id=${escAttr(opp.id)}" class="card-title-link">
        ${escHtml(title)}
      </a>
    </h3>

    <div class="card-meta">
      <div class="card-meta-item">
        <span class="card-meta-icon" aria-hidden="true">${ICONS.country}</span>
        <span class="card-meta-text">${escHtml(countryDisplay)}</span>
      </div>
      ${
        levelDisplay
          ? `<div class="card-meta-item">
              <span class="card-meta-icon" aria-hidden="true">${ICONS.level}</span>
              <span class="card-meta-text" title="${escHtml(levelDisplay)}">${escHtml(levelDisplay)}</span>
            </div>`
          : ""
      }
      <div class="card-meta-item">
        <span class="card-meta-icon" aria-hidden="true">${ICONS.field}</span>
        <span class="card-meta-text" title="${escHtml(fieldDisplay)}">${escHtml(fieldDisplay)}</span>
      </div>
    </div>

    ${
      fundingLabel && opp.type === "scholarship"
        ? `<div class="card-funding-wrap">
            <span class="funding-badge funding-${escAttr(opp.funding_type)}" aria-label="${escHtml(fundingLabel)}">
              <span class="funding-badge-icon" aria-hidden="true">${ICONS.funding}</span>
              <span>${escHtml(fundingLabel)}</span>
            </span>
          </div>`
        : ""
    }

    <div class="card-footer">
      <div class="card-deadline ${status.isUrgent ? "urgent" : ""}" aria-label="${escHtml(footerText)}">
        <span class="card-deadline-icon" aria-hidden="true">${ICONS.calendar}</span>
        <span class="card-deadline-text">${escHtml(footerText)}</span>
      </div>
      <a
        href="detail.html?id=${escAttr(opp.id)}"
        class="card-cta card-cta-details"
        aria-label="${t("card.viewDetails")} — ${escHtml(title)}"
      >
        <span>${t("card.viewDetails")}</span>
        ${ICONS.arrow}
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

/** Build a matching skeleton placeholder card for loading state */
export function createSkeletonCard() {
  const div = document.createElement("div");
  div.className = "opp-card card-skeleton";
  div.setAttribute("aria-hidden", "true");
  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.625rem;">
      <div class="skeleton" style="width:96px; height:1.375rem; border-radius:9999px;"></div>
      <div class="skeleton" style="width:56px; height:1.375rem; border-radius:9999px;"></div>
    </div>
    <div style="display:flex; align-items:center; gap:0.35rem; margin-bottom:0.375rem;">
      <div class="skeleton" style="width:14px; height:14px; border-radius:3px;"></div>
      <div class="skeleton" style="width:130px; height:0.875rem; border-radius:4px;"></div>
    </div>
    <div class="skeleton" style="width:92%; height:1.25rem; border-radius:4px; margin-bottom:0.35rem;"></div>
    <div class="skeleton" style="width:68%; height:1.25rem; border-radius:4px; margin-bottom:0.75rem;"></div>
    <div style="display:flex; flex-direction:column; gap:0.45rem; padding-block:0.625rem; border-top:1px dashed var(--color-border); border-bottom:1px dashed var(--color-border); margin-bottom:0.75rem;">
      <div class="skeleton" style="width:75%; height:0.875rem; border-radius:4px;"></div>
      <div class="skeleton" style="width:65%; height:0.875rem; border-radius:4px;"></div>
      <div class="skeleton" style="width:85%; height:0.875rem; border-radius:4px;"></div>
    </div>
    <div class="skeleton" style="width:88px; height:1.375rem; border-radius:9999px; margin-bottom:0.75rem;"></div>
    <div style="margin-top:auto; padding-top:0.875rem; border-top:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center; gap:0.75rem;">
      <div class="skeleton" style="width:110px; height:0.875rem; border-radius:4px;"></div>
      <div class="skeleton" style="width:100px; height:44px; border-radius:9999px;"></div>
    </div>
  `;
  return div;
}
