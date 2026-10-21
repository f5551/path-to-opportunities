/**
 * detail.js — Opportunity Detail View Controller
 *
 * Reads ?id=... from URL, loads opportunity record from verified store,
 * renders comprehensive metadata, breadcrumbs, structured details,
 * application rounds, audit verification, and official source links.
 */

import { initI18n, t, formatDate } from "../lib/i18n.js";
import { initNav } from "../lib/nav.js";
import { getById } from "../lib/opportunitiesStore.js";
import { escHtml, escAttr, sanitizeUrl } from "../lib/searchUtils.js";
import { getOpportunityStatus, getDayDiff } from "../lib/scholarshipStatus.js";

// ─── Inline SVG Icons ───────────────────────────────────────
const ICONS = {
  check: `<svg class="detail-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  dot: `<svg class="detail-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/></svg>`,
  document: `<svg class="detail-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  external: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>`,
  shieldCheck: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  calendar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  clock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  share: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  back: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`,
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

// ─── DOM References ───────────────────────────────────────
const detailContainer = document.getElementById("detail-container");
const notFoundState = document.getElementById("not-found-state");
const breadcrumbTitle = document.getElementById("breadcrumb-title");
const detailTitle = document.getElementById("detail-title");
const detailBadges = document.getElementById("detail-badges");
const detailOrg = document.getElementById("detail-org");
const detailMetaGrid = document.getElementById("detail-meta-grid");
const sectionsContainer = document.getElementById("detail-sections-container");
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
  const isAr = lang === "ar";
  const title = isAr ? opp.title_ar : opp.title_en;
  const isDemo = opp.id?.includes("demo") || opp.title_ar?.includes("[تجريبي]") || opp.source_url?.includes("example.org");
  const typeBadgeLabel = t(`badge.${opp.type}`);
  const fundingLabel = opp.funding_type ? t(`funding.${opp.funding_type}`, { defaultValue: opp.funding_type }) : null;
  const levelsList = Array.isArray(opp.level) ? opp.level : (opp.level ? [opp.level] : []);
  const levelDisplay = levelsList.map((lvl) => t(`levels.${lvl}`, { defaultValue: lvl })).join(" • ");
  const countryDisplay = t(`countries.${opp.country}`, { defaultValue: opp.country });

  // Status calculation via status engine
  const status = getOpportunityStatus(opp, lang);

  // 1. Breadcrumbs
  if (breadcrumbTitle) breadcrumbTitle.textContent = title;

  // 2. Title & Org
  if (detailTitle) detailTitle.textContent = title;
  if (detailOrg) detailOrg.textContent = opp.organization;

  // 3. Badges Header
  if (detailBadges) {
    let badgesHtml = `
      <span class="type-badge ${opp.type}">${typeBadgeLabel}</span>
      <span class="status-badge ${status.badgeClass}">${escHtml(status.badgeText)}</span>
    `;
    if (fundingLabel && opp.type === "scholarship") {
      badgesHtml += `<span class="funding-badge funding-${escAttr(opp.funding_type)}">${escHtml(fundingLabel)}</span>`;
    }
    if (isDemo) {
      badgesHtml += `<span class="demo-tag">${t("card.demoBadge", { defaultValue: isAr ? "تجريبي" : "Demo" })}</span>`;
    }
    detailBadges.innerHTML = badgesHtml;
  }

  // 4. Meta Grid Tiles
  if (detailMetaGrid) {
    detailMetaGrid.innerHTML = `
      <div class="detail-meta-tile">
        <span class="meta-tile-label">${t("detail.country")}</span>
        <span class="meta-tile-value">${escHtml(countryDisplay)}</span>
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
        <span class="meta-tile-value" style="color: ${status.isUrgent ? "oklch(0.55 0.18 25)" : "var(--color-primary-dark)"};">
          ${escHtml(status.subtitle || (opp.deadline ? formatDate(opp.deadline) : t("card.deadlineOpen")))}
        </span>
      </div>
    `;
  }

  // 5. Rich Content Sections
  const richDetails = opp.details?.[lang] || (isAr ? opp.details?.ar : opp.details?.en);

  if (sectionsContainer) {
    if (richDetails) {
      // Build rich sections
      let contentHtml = "";

      // Section: Program Summary
      if (richDetails.summary) {
        contentHtml += `
          <div class="detail-card-block">
            <h2 class="detail-card-title">${t("detail.summary")}</h2>
            <div class="detail-prose">
              <p>${escHtml(richDetails.summary)}</p>
            </div>
          </div>
        `;
      }

      // Section: Funding and Benefits
      if (Array.isArray(richDetails.funding_and_benefits) && richDetails.funding_and_benefits.length > 0) {
        contentHtml += `
          <div class="detail-card-block">
            <h2 class="detail-card-title">${t("detail.benefits")}</h2>
            <ul class="detail-list">
              ${richDetails.funding_and_benefits
                .map((benefit) => `
                  <li class="detail-list-item">
                    ${ICONS.check}
                    <span>${escHtml(benefit)}</span>
                  </li>
                `)
                .join("")}
            </ul>
          </div>
        `;
      }

      // Section: Fields and Eligible Programs
      if (Array.isArray(richDetails.fields_and_programs) && richDetails.fields_and_programs.length > 0) {
        contentHtml += `
          <div class="detail-card-block">
            <h2 class="detail-card-title">${t("detail.fields")}</h2>
            <ul class="detail-list">
              ${richDetails.fields_and_programs
                .map((field) => `
                  <li class="detail-list-item">
                    ${ICONS.dot}
                    <span>${escHtml(field)}</span>
                  </li>
                `)
                .join("")}
            </ul>
          </div>
        `;
      }

      // Section: Eligibility Criteria
      if (Array.isArray(richDetails.eligibility) && richDetails.eligibility.length > 0) {
        contentHtml += `
          <div class="detail-card-block">
            <h2 class="detail-card-title">${t("detail.eligibility")}</h2>
            <ul class="detail-list">
              ${richDetails.eligibility
                .map((criterion) => `
                  <li class="detail-list-item">
                    ${ICONS.check}
                    <span>${escHtml(criterion)}</span>
                  </li>
                `)
                .join("")}
            </ul>
          </div>
        `;
      }

      // Section: Required Documents
      if (Array.isArray(richDetails.required_documents) && richDetails.required_documents.length > 0) {
        contentHtml += `
          <div class="detail-card-block">
            <h2 class="detail-card-title">${t("detail.documents")}</h2>
            <ul class="detail-list">
              ${richDetails.required_documents
                .map((doc) => `
                  <li class="detail-list-item">
                    ${ICONS.document}
                    <span>${escHtml(doc)}</span>
                  </li>
                `)
                .join("")}
            </ul>
          </div>
        `;
      }

      // Section: Application Steps
      if (Array.isArray(richDetails.application_steps) && richDetails.application_steps.length > 0) {
        contentHtml += `
          <div class="detail-card-block">
            <h2 class="detail-card-title">${t("detail.steps")}</h2>
            <ol class="detail-steps-list">
              ${richDetails.application_steps
                .map((step, idx) => `
                  <li class="detail-step-item">
                    <span class="detail-step-num">${idx + 1}</span>
                    <span>${escHtml(step)}</span>
                  </li>
                `)
                .join("")}
            </ol>
          </div>
        `;
      }

      // Section: Application Rounds Table (if rounds exist)
      if (opp.application?.rounds && Array.isArray(opp.application.rounds) && opp.application.rounds.length > 0) {
        contentHtml += `
          <div class="detail-card-block">
            <h2 class="detail-card-title">${t("detail.roundsTitle")}</h2>
            ${opp.application.notes_ar || opp.application.notes_en ? `
              <p class="detail-prose" style="font-size: 0.875rem; margin-bottom: 0.75rem;">
                ${escHtml(isAr ? opp.application.notes_ar : opp.application.notes_en)}
              </p>
            ` : ""}
            <div class="detail-rounds-table-wrap">
              <table class="detail-rounds-table">
                <thead>
                  <tr>
                    <th>${t("detail.roundName")}</th>
                    <th>${t("detail.targetAudience")}</th>
                    <th>${t("detail.deadlineCol")}</th>
                    <th>${t("detail.notificationCol")}</th>
                    <th>${t("detail.statusCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${opp.application.rounds.map((r) => {
                    const rName = isAr ? r.round_name_ar : r.round_name_en;
                    const rAudience = Array.isArray(r.audience) ? r.audience.join(", ") : (r.audience || "All");
                    const rDeadline = r.deadline ? formatDate(r.deadline) : "—";
                    const rNotif = r.notification_date ? formatDate(r.notification_date) : "—";
                    const rDiff = r.deadline ? getDayDiff(r.deadline) : null;
                    const isRoundClosed = rDiff !== null && rDiff < 0;
                    const isRoundUrgent = rDiff !== null && rDiff >= 0 && rDiff <= 7;
                    let roundBadge = "";

                    if (isRoundClosed) {
                      roundBadge = `<span class="status-badge status-closed">${isAr ? "مغلق" : "Closed"}</span>`;
                    } else if (isRoundUrgent) {
                      roundBadge = `<span class="status-badge status-urgent">${isAr ? "ينتهي قريبًا" : "Closing Soon"}</span>`;
                    } else {
                      roundBadge = `<span class="status-badge status-open">${isAr ? "مفتوح" : "Open"}</span>`;
                    }

                    return `
                      <tr>
                        <td style="font-weight: 600;">${escHtml(rName)}</td>
                        <td><span style="font-size: 0.8125rem; color: var(--color-text-2);">${escHtml(rAudience)}</span></td>
                        <td style="color: var(--color-primary-dark); font-weight: 600;">${escHtml(rDeadline)}</td>
                        <td>${escHtml(rNotif)}</td>
                        <td>${roundBadge}</td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      // Section: Important Notes
      if (Array.isArray(richDetails.important_notes) && richDetails.important_notes.length > 0) {
        contentHtml += `
          <div class="detail-card-block">
            <h2 class="detail-card-title">${t("detail.notes")}</h2>
            <div class="detail-notes-box">
              <ul class="detail-list" style="gap: 0.5rem;">
                ${richDetails.important_notes
                  .map((note) => `
                    <li class="detail-list-item" style="color: oklch(0.35 0.08 75);">
                      ${ICONS.info}
                      <span>${escHtml(note)}</span>
                    </li>
                  `)
                  .join("")}
              </ul>
            </div>
          </div>
        `;
      }

      // Section: Verification & Audit Box
      if (opp.verification) {
        const v = opp.verification;
        const auditNote = isAr ? v.audit_note_ar : v.audit_note_en;
        contentHtml += `
          <div class="detail-card-block" style="padding: 1.5rem;">
            <h2 class="detail-card-title" style="font-size: 1.0625rem; margin-bottom: 0.75rem;">
              <span style="display: inline-flex; align-items: center; gap: 0.375rem; color: var(--color-primary);">
                ${ICONS.shieldCheck}
                ${t("detail.auditTitle")}
              </span>
            </h2>
            <div class="detail-audit-box">
              <div class="detail-audit-row">
                <span class="detail-audit-label">${t("detail.auditReviewedAt")}</span>
                <span>${escHtml(formatDate(v.reviewed_at))}</span>
              </div>
              ${(v.official_reference_document || v.source_document) ? `
                <div class="detail-audit-row">
                  <span class="detail-audit-label">${t("detail.auditSource")}</span>
                  <span>${escHtml(v.official_reference_document || v.source_document)}</span>
                </div>
              ` : ""}
              ${Array.isArray(v.original_notes_ar) && v.original_notes_ar.length > 0 && isAr ? `
                <div class="detail-audit-row" style="margin-top: 0.25rem; flex-direction: column; align-items: flex-start; gap: 0.25rem;">
                  <span class="detail-audit-label">ملاحظات التوثيق الرسمية</span>
                  <ul style="margin: 0; padding-inline-start: 1.25rem; list-style: disc; font-size: 0.8125rem; color: var(--color-text-2); line-height: 1.5;">
                    ${v.original_notes_ar.map((note) => `<li>${escHtml(note)}</li>`).join("")}
                  </ul>
                </div>
              ` : ""}
              ${auditNote ? `
                <div class="detail-audit-row" style="margin-top: 0.25rem;">
                  <span class="detail-audit-label">${t("detail.auditNotice")}</span>
                  <span style="line-height: 1.5;">${escHtml(auditNote)}</span>
                </div>
              ` : ""}
              ${v.needs_manual_review ? `
                <div style="margin-top: 0.375rem;">
                  <span class="status-badge status-review">${isAr ? "تنبيه: يتطلب مراجعة دورية قبل فتح الدورة القادمة" : "Periodic audit required prior to next cycle"}</span>
                </div>
              ` : ""}
            </div>
          </div>
        `;
      }

      sectionsContainer.innerHTML = contentHtml;
    } else {
      // Fallback for legacy demo records without structured rich details
      sectionsContainer.innerHTML = `
        <div class="detail-card-block">
          <h2 class="detail-card-title">${t("detail.aboutOpportunity")}</h2>
          <div class="detail-prose">
            ${
              isAr
                ? `<p>تُعد هذه الفرصة (${escHtml(typeBadgeLabel)}) المقدمة من <strong>${escHtml(opp.organization)}</strong> في <strong>${escHtml(opp.country)}</strong> من أبرز البرامج المتاحة في مجال <strong>${escHtml(opp.field)}</strong> للمستوى التعليمي (${escHtml(levelDisplay)}).</p>
                   <p style="margin-top: 0.75rem;">تتيح هذه الفرصة للمشاركين اكتساب المعرفة النظرية والمهارات التطبيقية المتوافقة مع معايير الجودة الدولية، وبناء شبكة علاقات أكاديمية ومهنية واسعة.</p>`
                : `<p>This opportunity (${escHtml(typeBadgeLabel)}) hosted by <strong>${escHtml(opp.organization)}</strong> in <strong>${escHtml(opp.country)}</strong> is offered in the field of <strong>${escHtml(opp.field)}</strong> for candidates at level: (${escHtml(levelDisplay)}).</p>
                   <p style="margin-top: 0.75rem;">Participants benefit from high quality curriculum, practical exposure to modern methodologies, and international networking.</p>`
            }
          </div>
        </div>
        <div class="detail-card-block">
          <h2 class="detail-card-title">${t("detail.eligibilityTitle")}</h2>
          <div class="detail-prose">
            <ul style="list-style-type: disc; padding-inline-start: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
              ${
                isAr
                  ? `<li>توفّر المؤهل الأكاديمي المطلوب لمستوى (${escHtml(levelDisplay)}) قبل موعد بدء البرنامج.</li>
                     <li>تقديم السيرة الذاتية وخطاب الدافع بصيغة معتمدة.</li>
                     <li>${opp.deadline ? `الالتزام بكافة المواعيد المحددة وإتمام الطلب قبل (${formatDate(opp.deadline)}).` : `التقديم متاح حالياً بصورة مستمرة / دورية وفق دورات القبول الجامعي.`}</li>
                     <li>تاريخ آخر مراجعة وتحقق للبيانات: ${formatDate(opp.verified_at)}.</li>`
                  : `<li>Meet prerequisite credentials for level (${escHtml(levelDisplay)}) prior to program intake.</li>
                     <li>Submit a structured Curriculum Vitae and a tailored Statement of Purpose.</li>
                     <li>${opp.deadline ? `Ensure final submission prior to the deadline: (${formatDate(opp.deadline)}).` : `Applications are currently open on an ongoing basis according to intake rounds.`}</li>
                     <li>Record verification timestamp: ${formatDate(opp.verified_at)}.</li>`
              }
            </ul>
          </div>
        </div>
      `;
    }
  }

  // 6. Sidebar CTA Box
  if (sidebarCtaBox) {
    if (isDemo) {
      // Demo opportunity: show clear warning and disabled apply action
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
          ${ICONS.share}
          <span id="share-label">${t("detail.share")}</span>
        </button>
        <a href="opportunities.html" class="btn-detail-back">
          ${ICONS.back}
          <span>${t("detail.backToOpps")}</span>
        </a>
      `;
    } else if (status.isClosed) {
      // Closed opportunity: show polite closed alert with link to check future cycles
      sidebarCtaBox.innerHTML = `
        <h3 class="sidebar-title">${t("detail.officialSource")}</h3>
        <div class="sidebar-status-box" style="border-color: oklch(0.85 0.05 250);">
          <div class="sidebar-status-header">
            <span class="status-badge ${status.badgeClass}">${escHtml(status.badgeText)}</span>
          </div>
          <div style="font-weight: 700; font-size: 0.9375rem; color: var(--color-text); margin-top: 0.25rem;">
            ${t("detail.closedAlertTitle")}
          </div>
          <p style="font-size: 0.8125rem; color: var(--color-text-2); line-height: 1.5;">
            ${t("detail.closedAlertDesc")}
          </p>
        </div>
        <a
          href="${escHtml(sanitizeUrl(opp.source_url))}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-detail-apply"
          style="background: var(--color-surface-2); color: var(--color-text); border: 1px solid var(--color-border); box-shadow: none;"
        >
          <span>${t("detail.visitOfficialSite")}</span>
          ${ICONS.external}
        </a>
        <p style="font-size: 0.8125rem; color: var(--color-text-3); text-align: center;">${t("detail.officialSourceNote")}</p>
        <button type="button" id="btn-share" class="btn-detail-back" style="margin-top: 0.5rem;">
          ${ICONS.share}
          <span id="share-label">${t("detail.share")}</span>
        </button>
        <a href="opportunities.html" class="btn-detail-back">
          ${ICONS.back}
          <span>${t("detail.backToOpps")}</span>
        </a>
      `;
    } else if (status.code === "automatic") {
      // Automatic evaluation opportunity
      sidebarCtaBox.innerHTML = `
        <h3 class="sidebar-title">${t("detail.officialSource")}</h3>
        <div class="sidebar-status-box" style="border-color: oklch(0.85 0.05 230);">
          <div class="sidebar-status-header">
            <span class="status-badge ${status.badgeClass}">${escHtml(status.badgeText)}</span>
          </div>
          <div style="font-weight: 700; font-size: 0.9375rem; color: var(--color-text); margin-top: 0.25rem;">
            ${t("detail.autoAlertTitle")}
          </div>
          <p style="font-size: 0.8125rem; color: var(--color-text-2); line-height: 1.5;">
            ${t("detail.autoAlertDesc")}
          </p>
        </div>
        <a
          href="${escHtml(sanitizeUrl(opp.source_url))}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-detail-apply"
        >
          <span>${t("detail.applyOfficialBtn")}</span>
          ${ICONS.external}
        </a>
        <p style="font-size: 0.8125rem; color: var(--color-text-3); text-align: center;">${t("detail.officialSourceNote")}</p>
        <button type="button" id="btn-share" class="btn-detail-back" style="margin-top: 0.5rem;">
          ${ICONS.share}
          <span id="share-label">${t("detail.share")}</span>
        </button>
        <a href="opportunities.html" class="btn-detail-back">
          ${ICONS.back}
          <span>${t("detail.backToOpps")}</span>
        </a>
      `;
    } else if (status.code === "rolling") {
      // Rolling admissions
      sidebarCtaBox.innerHTML = `
        <h3 class="sidebar-title">${t("detail.officialSource")}</h3>
        <div class="sidebar-status-box" style="border-color: oklch(0.85 0.05 175);">
          <div class="sidebar-status-header">
            <span class="status-badge ${status.badgeClass}">${escHtml(status.badgeText)}</span>
          </div>
          <div style="font-weight: 700; font-size: 0.9375rem; color: var(--color-text); margin-top: 0.25rem;">
            ${t("detail.rollingAlertTitle")}
          </div>
          <p style="font-size: 0.8125rem; color: var(--color-text-2); line-height: 1.5;">
            ${t("detail.rollingAlertDesc")}
          </p>
        </div>
        <a
          href="${escHtml(sanitizeUrl(opp.source_url))}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-detail-apply"
        >
          <span>${t("detail.applyOfficialBtn")}</span>
          ${ICONS.external}
        </a>
        <p style="font-size: 0.8125rem; color: var(--color-text-3); text-align: center;">${t("detail.officialSourceNote")}</p>
        <button type="button" id="btn-share" class="btn-detail-back" style="margin-top: 0.5rem;">
          ${ICONS.share}
          <span id="share-label">${t("detail.share")}</span>
        </button>
        <a href="opportunities.html" class="btn-detail-back">
          ${ICONS.back}
          <span>${t("detail.backToOpps")}</span>
        </a>
      `;
    } else {
      // Normal active / urgent opportunity
      sidebarCtaBox.innerHTML = `
        <h3 class="sidebar-title">${t("detail.officialSource")}</h3>
        <div class="sidebar-status-box">
          <div class="sidebar-status-header">
            <span class="status-badge ${status.badgeClass}">${escHtml(status.badgeText)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; color: var(--color-text-2); margin-top: 0.25rem;">
            ${ICONS.calendar}
            <span>${escHtml(status.subtitle || (opp.deadline ? formatDate(opp.deadline) : t("card.deadlineOpen")))}</span>
          </div>
        </div>
        <a
          href="${escHtml(sanitizeUrl(opp.source_url))}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-detail-apply"
        >
          <span>${t("detail.applyOfficialBtn")}</span>
          ${ICONS.external}
        </a>
        <p style="font-size: 0.8125rem; color: var(--color-text-3); text-align: center;">${t("detail.officialSourceNote")}</p>
        <button type="button" id="btn-share" class="btn-detail-back" style="margin-top: 0.5rem;">
          ${ICONS.share}
          <span id="share-label">${t("detail.share")}</span>
        </button>
        <a href="opportunities.html" class="btn-detail-back">
          ${ICONS.back}
          <span>${t("detail.backToOpps")}</span>
        </a>
      `;
    }

    // Share action clipboard interaction
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
