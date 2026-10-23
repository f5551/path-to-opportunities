/**
 * shareModal.js — Accessible "Share an Opportunity" Modal & Bottom Sheet Controller
 *
 * Implements:
 * - Mobile-first Bottom Sheet on mobile / Centered modal on desktop
 * - Progressive disclosure (Expandable Form with input preservation)
 * - Optional field submission without forced required fields
 * - Anti-empty submission validation & URL format check
 * - Formspree integration with honest unconfigured handling (no fake success)
 * - Full WCAG 2.2 accessibility, keyboard focus trap, and RTL/LTR support
 */

import { t } from "../lib/i18n.js";

/**
 * Formspree Endpoint Configuration.
 * Can be overridden via window.PTO_FORMSPREE_URL (e.g. "https://formspree.io/f/mzbnpoyq")
 */
export const FORMSPREE_SHARE_ENDPOINT =
  (typeof window !== "undefined" && window.PTO_FORMSPREE_URL) || "";

export function initShareModal() {
  const triggerBtn = document.getElementById("btn-open-share-modal");
  const modal = document.getElementById("share-opportunity-modal");
  if (!triggerBtn || !modal) return;

  const backdrop = document.getElementById("share-modal-backdrop");
  const closeBtn = document.getElementById("share-modal-close");
  const toggleFormBtn = document.getElementById("btn-toggle-share-form");
  const toggleFormText = document.getElementById("toggle-form-text");
  const collapseFormBtn = document.getElementById("btn-collapse-form");
  const formWrapper = document.getElementById("share-form-wrapper");
  const form = document.getElementById("share-opportunity-form");
  const feedbackEl = document.getElementById("share-form-feedback");
  const submitBtn = document.getElementById("btn-submit-share");
  const submitText = submitBtn?.querySelector(".submit-text");
  const submitSpinner = submitBtn?.querySelector(".submit-spinner");
  const mainView = document.getElementById("share-main-view");
  const successView = document.getElementById("share-success-view");
  const shareAnotherBtn = document.getElementById("btn-share-another");

  let previousActiveElement = null;

  // ─── Modal Open / Close ──────────────────────────────────
  function openModal() {
    previousActiveElement = document.activeElement;
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    triggerBtn.setAttribute("aria-expanded", "true");

    // Scroll panel back to top
    const panel = modal.querySelector(".share-modal-panel");
    if (panel) panel.scrollTop = 0;

    // Clear any previous feedback alert
    hideFeedback();

    // Focus the primary action in the modal
    if (toggleFormBtn) {
      toggleFormBtn.focus();
    } else if (closeBtn) {
      closeBtn.focus();
    }
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    triggerBtn.setAttribute("aria-expanded", "false");
    hideFeedback();

    // Return focus to trigger button
    if (previousActiveElement && typeof previousActiveElement.focus === "function") {
      previousActiveElement.focus();
    } else {
      triggerBtn.focus();
    }
  }

  triggerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  });

  backdrop?.addEventListener("click", () => {
    closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      e.preventDefault();
      closeModal();
    }
  });

  // Focus trap inside modal
  modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || modal.classList.contains("hidden")) return;

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(", ");

    const focusable = Array.from(modal.querySelectorAll(focusableSelectors)).filter(
      (el) => el.offsetParent !== null && !el.closest(".hidden")
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // ─── Expand / Collapse Form (Preserving Inputs) ─────────
  function toggleForm(expandOnly = false) {
    if (!formWrapper) return;
    const isExpanded = formWrapper.classList.contains("expanded");

    if (!isExpanded) {
      // Expand
      formWrapper.classList.add("expanded");
      toggleFormBtn?.setAttribute("aria-expanded", "true");
      toggleFormBtn?.classList.add("active");
      if (toggleFormText) {
        toggleFormText.textContent = t("shareModal.collapseBtn");
      }
      // Focus first field
      const firstInput = form?.querySelector("select, input");
      setTimeout(() => firstInput?.focus(), 150);
    } else if (!expandOnly) {
      // Collapse — DOES NOT reset or clear inputs!
      formWrapper.classList.remove("expanded");
      toggleFormBtn?.setAttribute("aria-expanded", "false");
      toggleFormBtn?.classList.remove("active");
      if (toggleFormText) {
        toggleFormText.textContent = t("shareModal.expandBtn");
      }
      hideFeedback();
      toggleFormBtn?.focus();
    }
  }

  toggleFormBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleForm();
  });

  collapseFormBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleForm(false);
  });

  // ─── Feedback Alert Helpers ──────────────────────────────
  function showFeedback(message, type = "error") {
    if (!feedbackEl) return;
    feedbackEl.textContent = message;
    feedbackEl.className = `share-feedback-banner ${type}`;
    feedbackEl.classList.remove("hidden");
    feedbackEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideFeedback() {
    if (!feedbackEl) return;
    feedbackEl.textContent = "";
    feedbackEl.className = "share-feedback-banner hidden";
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    if (isSubmitting) {
      submitBtn.classList.add("loading");
      if (submitText) submitText.textContent = t("shareModal.submitting");
      submitSpinner?.classList.remove("hidden");
    } else {
      submitBtn.classList.remove("loading");
      if (submitText) submitText.textContent = t("shareModal.submitBtn");
      submitSpinner?.classList.add("hidden");
    }
  }

  // ─── Form Submission Handling ────────────────────────────
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFeedback();

    const formData = new FormData(form);
    const type = (formData.get("type") || "").toString().trim();
    const title = (formData.get("title") || "").toString().trim();
    const organization = (formData.get("organization") || "").toString().trim();
    const sourceUrl = (formData.get("sourceUrl") || "").toString().trim();
    const deadline = (formData.get("deadline") || "").toString().trim();
    const notes = (formData.get("notes") || "").toString().trim();

    // 1. Check that form is not completely empty
    const hasAnyUsefulInfo = Boolean(
      type || title || organization || sourceUrl || deadline || notes
    );

    if (!hasAnyUsefulInfo) {
      showFeedback(t("shareModal.errorEmpty"), "warning");
      const titleInput = document.getElementById("share-title");
      titleInput?.focus();
      return;
    }

    // 2. Validate URL only if entered
    if (sourceUrl) {
      let isValidUrl = false;
      try {
        const parsed = new URL(sourceUrl);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          isValidUrl = true;
        }
      } catch {
        isValidUrl = false;
      }

      if (!isValidUrl) {
        showFeedback(t("shareModal.errorUrl"), "error");
        const urlInput = document.getElementById("share-url");
        urlInput?.focus();
        return;
      }
    }

    const payload = {
      type: type || "unspecified",
      title,
      organization,
      sourceUrl,
      deadline,
      notes,
      submittedAt: new Date().toISOString(),
      page: "opportunities.html",
      language: document.documentElement.lang || "ar",
    };

    // 3. Check Formspree configuration
    const isConfigured = Boolean(
      FORMSPREE_SHARE_ENDPOINT &&
      !FORMSPREE_SHARE_ENDPOINT.includes("YOUR_FORM_ID") &&
      (FORMSPREE_SHARE_ENDPOINT.startsWith("https://formspree.io/") ||
       FORMSPREE_SHARE_ENDPOINT.startsWith("http://localhost"))
    );

    if (!isConfigured) {
      // Per Requirement 4: Honest unconfigured state, no fake success!
      // Save locally as backup so user doesn't lose entered submission
      try {
        const stored = JSON.parse(localStorage.getItem("pto_pending_shared_opps") || "[]");
        stored.push(payload);
        localStorage.setItem("pto_pending_shared_opps", JSON.stringify(stored));
      } catch {
        // storage ignored
      }

      showFeedback(t("shareModal.errorNotConfigured"), "warning");
      return;
    }

    // 4. Send to Formspree
    try {
      setSubmitting(true);
      const res = await fetch(FORMSPREE_SHARE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Record backup locally
        try {
          const stored = JSON.parse(localStorage.getItem("pto_shared_opps_archive") || "[]");
          stored.push(payload);
          localStorage.setItem("pto_shared_opps_archive", JSON.stringify(stored));
        } catch {
          // ignore
        }

        // Show success state view
        if (mainView && successView) {
          mainView.classList.add("hidden");
          successView.classList.remove("hidden");
          const successTitle = successView.querySelector("h3");
          successTitle?.focus();
        }

        // Reset form for future submissions
        form.reset();
        formWrapper?.classList.remove("expanded");
        if (toggleFormText) toggleFormText.textContent = t("shareModal.expandBtn");
        toggleFormBtn?.setAttribute("aria-expanded", "false");
        toggleFormBtn?.classList.remove("active");
      } else {
        const resData = await res.json().catch(() => ({}));
        const message =
          resData?.errors?.map((err) => err.message).join(", ") ||
          t("shareModal.errorGeneral");
        showFeedback(message, "error");
      }
    } catch {
      showFeedback(t("shareModal.errorGeneral"), "error");
    } finally {
      setSubmitting(false);
    }
  });

  // ─── Share Another Opportunity ───────────────────────────
  shareAnotherBtn?.addEventListener("click", () => {
    if (mainView && successView) {
      successView.classList.add("hidden");
      mainView.classList.remove("hidden");
    }
    hideFeedback();
    toggleFormBtn?.focus();
  });
}
