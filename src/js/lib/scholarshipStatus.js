/**
 * scholarshipStatus.js — Intelligent Scholarship Status & Remaining Days Engine
 *
 * Computes calendar-accurate days remaining and status badges for opportunities.
 * Handles:
 * - Specific deadlines (open, closing soon, last day, closed)
 * - Multiple application rounds by applicant audience (domestic vs international)
 * - Automatic consideration per academic course deadline
 * - Rolling review / year-round allocations
 * - Review and audit flags
 *
 * Zero time-zone or DST drift. Full bilingual (AR / EN) support.
 */

import { formatDate } from "./i18n.js";

/**
 * Parses YYYY-MM-DD into a UTC midnight Date object to avoid timezone/DST drift
 * @param {string|null} dateStr
 * @returns {Date|null}
 */
export function parseCalendarDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  return new Date(Date.UTC(year, month, day));
}

/**
 * Calculates calendar day difference between target date and current date
 * @param {string|null} targetDateStr - YYYY-MM-DD
 * @returns {number|null} positive for future, 0 for today, negative for past
 */
export function getDayDiff(targetDateStr) {
  const target = parseCalendarDate(targetDateStr);
  if (!target) return null;

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return Math.round((target.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get unified status metadata for any opportunity item
 * @param {object} opp - Opportunity record
 * @param {string} [lang] - "ar" or "en"
 * @returns {object} Status descriptor
 */
export function getOpportunityStatus(opp, lang) {
  const currentLang = lang || (typeof document !== "undefined" ? document.documentElement?.lang : "ar") || "ar";
  const isAr = currentLang === "ar";
  const app = opp?.application || null;
  const deadline = opp?.deadline || null;
  const diff = deadline ? getDayDiff(deadline) : null;
  const isDemo = opp?.id?.includes("demo") || opp?.title_ar?.includes("[تجريبي]") || opp?.source_url?.includes("example.org");

  // 1. Automatic Consideration (course_based / automatic)
  if (app?.status === "automatic" || app?.kind === "course_based") {
    return {
      code: "automatic",
      badgeText: isAr ? "تقييم تلقائي" : "Automatic Assessment",
      badgeClass: "status-auto",
      subtitle: isAr ? "حسب موعد البرنامج المؤهل" : "Per Course Deadline",
      daysRemaining: null,
      isClosed: false,
      isUrgent: false,
      canApply: true,
      needsReview: !!app?.needs_manual_review || !!opp?.verification?.needs_manual_review,
      statusGroup: "open",
    };
  }

  // 2. Rolling Review / Year-Round
  if (app?.status === "rolling" || app?.kind === "rolling_review") {
    const roundsText = app.rounds_per_year
      ? (isAr ? `${app.rounds_per_year} جولات مراجعة سنويًا` : `${app.rounds_per_year} Review Rounds Annually`)
      : (isAr ? "التقديم مستمر على مدار العام" : "Open Year-Round");
    return {
      code: "rolling",
      badgeText: isAr ? "التقديم مستمر" : "Continuous Application",
      badgeClass: "status-rolling",
      subtitle: roundsText,
      daysRemaining: null,
      isClosed: false,
      isUrgent: false,
      canApply: true,
      needsReview: !!app?.needs_manual_review || !!opp?.verification?.needs_manual_review,
      statusGroup: "open",
    };
  }

  // 3. Multiple Rounds
  if (app?.status === "rounds" || app?.kind === "multiple_rounds") {
    const rounds = Array.isArray(app.rounds) ? app.rounds : [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Find upcoming open rounds for international candidates
    const openIntlRounds = rounds.filter((r) => {
      const isIntl =
        !r.audience ||
        r.audience.includes("international") ||
        r.audience.includes("middle_east");
      const notPast = r.deadline && r.deadline >= todayStr;
      return isIntl && (r.status === "open" || notPast);
    });

    if (openIntlRounds.length > 0) {
      openIntlRounds.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
      const nextRound = openIntlRounds[0];
      const roundDiff = getDayDiff(nextRound.deadline);

      let roundBadgeText = isAr ? "مواعيد متعددة" : "Multiple Rounds";
      if (roundDiff !== null) {
        if (roundDiff === 0) {
          roundBadgeText = isAr ? "آخر يوم للتقديم" : "Last Day to Apply";
        } else if (roundDiff > 0 && roundDiff <= 7) {
          roundBadgeText = isAr ? `ينتهي قريبًا (متبقي ${roundDiff} أيام)` : `Closing Soon (${roundDiff}d)`;
        } else if (roundDiff > 7) {
          roundBadgeText = isAr ? `متبقي ${roundDiff} يومًا` : `${roundDiff} days left`;
        }
      }

      return {
        code: "rounds_open",
        badgeText: roundBadgeText,
        badgeClass: roundDiff !== null && roundDiff <= 7 ? "status-urgent" : "status-open",
        subtitle: isAr
          ? `مواعيد متعددة • الجولة القادمة: ${formatDate(nextRound.deadline)}`
          : `Multiple Rounds • Next: ${formatDate(nextRound.deadline)}`,
        daysRemaining: roundDiff,
        isClosed: false,
        isUrgent: roundDiff !== null && roundDiff <= 7,
        canApply: true,
        rounds,
        activeRound: nextRound,
        hasMultipleRounds: true,
        needsReview: !!app?.needs_manual_review || !!opp?.verification?.needs_manual_review,
        statusGroup: "open",
      };
    } else {
      // Check if domestic round exists
      const hasOpenDomestic = rounds.some((r) => r.deadline && r.deadline >= todayStr);
      const isReviewNeeded = !!app?.needs_manual_review || !!opp?.verification?.needs_manual_review;
      return {
        code: "rounds_closed",
        badgeText: isAr ? "انتهت الجولة الدولية" : "Int'l Round Closed",
        badgeClass: "status-closed",
        subtitle: hasOpenDomestic
          ? (isAr ? "مواعيد متعددة (الجولة المحلية مستمرة)" : "Multiple Rounds (Domestic Open)")
          : (isAr ? "انتهى التقديم لدورة 2027" : "2027 Cycle Closed"),
        daysRemaining: null,
        isClosed: true,
        isUrgent: false,
        canApply: false,
        rounds,
        hasMultipleRounds: true,
        needsReview: isReviewNeeded,
        statusGroup: isReviewNeeded ? "review" : "closed",
      };
    }
  }

  // 4. Closed by past deadline or explicit status
  if (app?.status === "closed" || (diff !== null && diff < 0)) {
    const isReviewNeeded = !!app?.needs_manual_review || !!opp?.verification?.needs_manual_review;
    return {
      code: "closed",
      badgeText: isAr ? "انتهى التقديم" : "Applications Closed",
      badgeClass: "status-closed",
      subtitle: deadline
        ? (isAr ? `انتهى في ${formatDate(deadline)}` : `Closed ${formatDate(deadline)}`)
        : (isAr ? "دورة 2027 مغلقة" : "2027 Cycle Closed"),
      daysRemaining: diff,
      isClosed: true,
      isUrgent: false,
      canApply: false,
      needsReview: isReviewNeeded,
      statusGroup: isReviewNeeded ? "review" : "closed",
    };
  }

  // 5. Active Upcoming Deadline
  if (diff !== null) {
    if (diff === 0) {
      return {
        code: "today",
        badgeText: isAr ? "آخر يوم للتقديم" : "Last Day to Apply",
        badgeClass: "status-urgent",
        subtitle: isAr ? "ينتهي بنهاية اليوم" : "Closes today",
        daysRemaining: 0,
        isClosed: false,
        isUrgent: true,
        canApply: true,
        needsReview: !!app?.needs_manual_review || !!opp?.verification?.needs_manual_review,
        statusGroup: "open",
      };
    }

    if (diff >= 1 && diff <= 7) {
      return {
        code: "closing_soon",
        badgeText: isAr ? `ينتهي قريبًا (متبقي ${diff} أيام)` : `Closing Soon (${diff} days left)`,
        badgeClass: "status-urgent",
        subtitle: formatDate(deadline),
        daysRemaining: diff,
        isClosed: false,
        isUrgent: true,
        canApply: true,
        needsReview: !!app?.needs_manual_review || !!opp?.verification?.needs_manual_review,
        statusGroup: "open",
      };
    }

    if (diff > 7) {
      return {
        code: "open",
        badgeText: isAr ? `متبقي ${diff} يومًا` : `${diff} days left`,
        badgeClass: "status-open",
        subtitle: formatDate(deadline),
        daysRemaining: diff,
        isClosed: false,
        isUrgent: false,
        canApply: true,
        needsReview: !!app?.needs_manual_review || !!opp?.verification?.needs_manual_review,
        statusGroup: "open",
      };
    }
  }

  // 6. Needs Review Flag
  if (app?.needs_manual_review || opp?.verification?.official_source_checked === false || opp?.verification?.needs_manual_review) {
    return {
      code: "needs_review",
      badgeText: isAr ? "تحتاج تحديثًا" : "Needs Update",
      badgeClass: "status-review",
      subtitle: isAr ? "راجع المصدر الرسمي" : "Check Official Source",
      daysRemaining: null,
      isClosed: false,
      isUrgent: false,
      canApply: true,
      needsReview: true,
      statusGroup: "review",
    };
  }

  // 7. General Ongoing Fallback (for demo items or general items without deadline)
  return {
    code: "open_general",
    badgeText: isAr ? "متاحة للتقديم" : "Open for Application",
    badgeClass: "status-open",
    subtitle: isAr ? "التقديم مستمر" : "Ongoing Application",
    daysRemaining: null,
    isClosed: false,
    isUrgent: false,
    canApply: true,
    needsReview: false,
    statusGroup: "open",
  };
}
