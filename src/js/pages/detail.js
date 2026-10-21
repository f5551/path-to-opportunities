/**
 * detail.js — Opportunity Detail View Controller
 *
 * Reads ?id=... from URL, loads opportunity record,
 * renders comprehensive metadata, breadcrumbs, and official source link.
 */

import { initI18n, t, formatDate } from "../lib/i18n.js";
import { initNav } from "../lib/nav.js";
import { getById } from "../lib/opportunitiesStore.js";
import { escHtml, sanitizeUrl } from "../lib/searchUtils.js";

// ─── DOM References ───────────────────────────────────────
const detailContainer = document.getElementById("detail-container");
const notFoundState = document.getElementById("not-found-state");
const breadcrumbTitle = document.getElementById("breadcrumb-title");
const detailTitle = document.getElementById("detail-title");
const detailBadges = document.getElementById("detail-badges");
const detailOrg = document.getElementById("detail-org");
const detailMetaGrid = document.getElementById("detail-meta-grid");
const detailAboutText = document.getElementById("detail-about-text");
const detailEligibilityText = document.getElementById("detail-eligibility-text");
const sidebarCtaBox = document.getElementById("sidebar-cta-box");

/**
 * Render single opportunity details
 */
function renderDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const opp = getById(id);

  if (!opp) {
    detailContainer?.classList.add("hidden");
    notFoundState?.classList.remove("hidden");
    return;
  }

  detailContainer?.classList.remove("hidden");
  notFoundState?.classList.add("hidden");

  const lang = document.documentElement.lang || "ar";
  const title = lang === "ar" ? opp.title_ar : opp.title_en;
  const isDemo = opp.id?.includes("demo") || opp.title_ar?.includes("[تجريبي]") || opp.source_url?.includes("example.org");
  const typeBadgeLabel = t(`badge.${opp.type}`);
  const fundingLabel = opp.funding_type ? t(`funding.${opp.funding_type}`, { defaultValue: opp.funding_type }) : null;
  const levelDisplay = Array.isArray(opp.level) ? opp.level.join(" • ") : (opp.level || "—");
  const deadlineDisplay = opp.deadline ? formatDate(opp.deadline) : t("card.deadlineOpen");
  const verifiedDisplay = opp.verified_at ? formatDate(opp.verified_at) : (lang === "ar" ? "مُتحقق منه حديثًا" : "Recently verified");

  // Breadcrumbs
  if (breadcrumbTitle) breadcrumbTitle.textContent = title;

  // Title & Org
  if (detailTitle) detailTitle.textContent = title;
  if (detailOrg) detailOrg.textContent = opp.organization;

  // Badges
  if (detailBadges) {
    let badgesHtml = `<span class="type-badge ${opp.type}">${typeBadgeLabel}</span>`;
    if (fundingLabel && opp.type === "scholarship") {
      badgesHtml += `<span class="funding-badge funding-${opp.funding_type}">${fundingLabel}</span>`;
    }
    if (isDemo) {
      badgesHtml += `<span class="demo-tag">${t("card.demoBadge", { defaultValue: "تجريبي" })}</span>`;
    }
    detailBadges.innerHTML = badgesHtml;
  }

  // Meta Grid Tiles
  if (detailMetaGrid) {
    detailMetaGrid.innerHTML = `
      <div class="detail-meta-tile">
        <span class="meta-tile-label">${t("detail.country")}</span>
        <span class="meta-tile-value">${escHtml(opp.country)}</span>
      </div>
      <div class="detail-meta-tile">
        <span class="meta-tile-label">${t("detail.field")}</span>
        <span class="meta-tile-value">${escHtml(opp.field)}</span>
      </div>
      <div class="detail-meta-tile">
        <span class="meta-tile-label">${t("detail.level")}</span>
        <span class="meta-tile-value">${escHtml(levelDisplay)}</span>
      </div>
      <div class="detail-meta-tile">
        <span class="meta-tile-label">${t("detail.deadline")}</span>
        <span class="meta-tile-value" style="color: var(--color-primary-dark);">${escHtml(deadlineDisplay)}</span>
      </div>
    `;
  }

  // Description / Details text
  if (detailAboutText) {
    if (lang === "ar") {
      detailAboutText.innerHTML = `
        <p>تُعد هذه الفرصة (${escHtml(typeBadgeLabel)}) المقدمة من <strong>${escHtml(opp.organization)}</strong> في <strong>${escHtml(opp.country)}</strong> من أبرز البرامج المتاحة في مجال <strong>${escHtml(opp.field)}</strong> للمستوى التعليمي (${escHtml(levelDisplay)}).</p>
        <p style="margin-top: 0.75rem;">تتيح هذه الفرصة للمشاركين اكتساب المعرفة النظرية والمهارات التطبيقية المتوافقة مع معايير الجودة الدولية، وبناء شبكة علاقات أكاديمية ومهنية واسعة.</p>
      `;
    } else {
      detailAboutText.innerHTML = `
        <p>This opportunity (${escHtml(typeBadgeLabel)}) hosted by <strong>${escHtml(opp.organization)}</strong> in <strong>${escHtml(opp.country)}</strong> is offered in the field of <strong>${escHtml(opp.field)}</strong> for candidates at level: (${escHtml(levelDisplay)}).</p>
        <p style="margin-top: 0.75rem;">Participants benefit from high quality curriculum, practical exposure to modern methodologies, and international networking.</p>
      `;
    }
  }

  // Eligibility / Notes text
  if (detailEligibilityText) {
    if (lang === "ar") {
      detailEligibilityText.innerHTML = `
        <ul style="list-style-type: disc; padding-inline-start: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <li>توفّر المؤهل الأكاديمي المطلوب لمستوى (${escHtml(levelDisplay)}) قبل موعد بدء البرنامج.</li>
          <li>تقديم السيرة الذاتية وخطاب الدافع بصيغة معتمدة.</li>
          <li>${opp.deadline ? `الالتزام بكافة المواعيد المحددة وإتمام الطلب قبل (${escHtml(deadlineDisplay)}).` : `التقديم متاح حالياً بصورة مستمرة / دورية وفق دورات القبول الجامعي.`}</li>
          <li>تاريخ آخر مراجعة وتحقق للبيانات: ${escHtml(verifiedDisplay)}.</li>
        </ul>
      `;
    } else {
      detailEligibilityText.innerHTML = `
        <ul style="list-style-type: disc; padding-inline-start: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <li>Meet prerequisite credentials for level (${escHtml(levelDisplay)}) prior to program intake.</li>
          <li>Submit a structured Curriculum Vitae and a tailored Statement of Purpose.</li>
          <li>${opp.deadline ? `Ensure final submission prior to the deadline: (${escHtml(deadlineDisplay)}).` : `Applications are currently open on an ongoing basis according to intake rounds.`}</li>
          <li>Record verification timestamp: ${escHtml(verifiedDisplay)}.</li>
        </ul>
      `;
    }
  }

  // Sidebar CTA Box
  if (sidebarCtaBox) {
    if (isDemo) {
      sidebarCtaBox.innerHTML = `
        <h3 class="sidebar-title">${t("detail.officialSource")}</h3>
        <div class="detail-demo-alert">
          <div class="demo-alert-title">${t("detail.demoWarningTitle")}</div>
          <p class="demo-alert-desc">${t("detail.demoWarningDesc")}</p>
        </div>
        <button type="button" class="btn-detail-apply disabled" disabled aria-disabled="true">
          <span>${t("card.demoApplyDisabled")}</span>
        </button>
        <p style="font-size: 0.8125rem; color: var(--color-text-3); text-align: center;">${t("detail.officialSourceNote")}</p>
        <button type="button" id="btn-share" class="btn-detail-back" style="margin-top: 0.5rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span id="share-label">${t("detail.share")}</span>
        </button>
        <a href="opportunities.html" class="btn-detail-back">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          <span>${t("detail.backToOpps")}</span>
        </a>
      `;
    } else {
      sidebarCtaBox.innerHTML = `
        <h3 class="sidebar-title">${t("detail.officialSource")}</h3>
        <p style="font-size: 0.875rem; color: var(--color-text-2);">${t("detail.officialSourceNote")}</p>
        <a
          href="${escHtml(sanitizeUrl(opp.source_url))}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-detail-apply"
        >
          <span>${t("detail.applyOfficialBtn")}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
        </a>
        <button type="button" id="btn-share" class="btn-detail-back" style="margin-top: 0.5rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span id="share-label">${t("detail.share")}</span>
        </button>
        <a href="opportunities.html" class="btn-detail-back">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          <span>${t("detail.backToOpps")}</span>
        </a>
      `;
    }

    // Share action
    const btnShare = document.getElementById("btn-share");
    const shareLabel = document.getElementById("share-label");
    btnShare?.addEventListener("click", () => {
      navigator.clipboard?.writeText(window.location.href).then(() => {
        if (shareLabel) {
          const original = shareLabel.textContent;
          shareLabel.textContent = t("detail.copied");
          setTimeout(() => {
            shareLabel.textContent = original;
          }, 2000);
        }
      });
    });
  }
}

async function boot() {
  await initI18n();
  initNav({
    onLangChange: async () => {
      renderDetail();
    },
  });
  renderDetail();
}

boot().catch(console.error);
