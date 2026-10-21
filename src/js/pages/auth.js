/**
 * auth.js — Client-Side Authentication Controller
 *
 * Implements interactive form validation, password visibility toggles,
 * and transparent system notices regarding offline/pending backend state.
 * STRICT SECURITY: Zero passwords or credentials stored in localStorage/cookies.
 */

import { initI18n, t } from "../lib/i18n.js";
import { initNav } from "../lib/nav.js";

// ─── Password Visibility Toggle ───────────────────────────
function wirePasswordToggles() {
  const toggleBtns = document.querySelectorAll(".btn-toggle-password");

  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const inputId = btn.dataset.target;
      const input = document.getElementById(inputId);
      if (!input) return;

      const isPassword = input.getAttribute("type") === "password";
      input.setAttribute("type", isPassword ? "text" : "password");

      // Update icon
      btn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

      btn.setAttribute(
        "aria-label",
        isPassword ? t("auth.hidePassword") : t("auth.showPassword")
      );
    });
  });
}

// ─── Inline Error Helpers ─────────────────────────────────
function setError(inputEl, errorId, message) {
  inputEl?.classList.add("error");
  const errEl = document.getElementById(errorId);
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.remove("hidden");
  }
}

function clearError(inputEl, errorId) {
  inputEl?.classList.remove("error");
  const errEl = document.getElementById(errorId);
  if (errEl) {
    errEl.textContent = "";
    errEl.classList.add("hidden");
  }
}

// ─── Form Validation ──────────────────────────────────────
function wireLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const alertFeedback = document.getElementById("auth-alert-feedback");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let hasError = false;

    clearError(emailInput, "email-error");
    clearError(passwordInput, "password-error");
    if (alertFeedback) alertFeedback.classList.add("hidden");

    // Email check
    const emailVal = emailInput?.value?.trim() || "";
    if (!emailVal) {
      setError(emailInput, "email-error", t("auth.validation.emailRequired"));
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setError(emailInput, "email-error", t("auth.validation.emailInvalid"));
      hasError = true;
    }

    // Password check
    const passVal = passwordInput?.value || "";
    if (!passVal) {
      setError(passwordInput, "password-error", t("auth.validation.passwordRequired"));
      hasError = true;
    } else if (passVal.length < 8) {
      setError(passwordInput, "password-error", t("auth.validation.passwordMin"));
      hasError = true;
    }

    if (!hasError && alertFeedback) {
      alertFeedback.textContent = t("auth.validation.successLoginDemo");
      alertFeedback.className = "auth-alert-feedback auth-alert-success";
      alertFeedback.classList.remove("hidden");
    }
  });
}

function wireRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const termsCheckbox = document.getElementById("terms");
  const alertFeedback = document.getElementById("auth-alert-feedback");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let hasError = false;

    clearError(nameInput, "name-error");
    clearError(emailInput, "email-error");
    clearError(passwordInput, "password-error");
    clearError(confirmPasswordInput, "confirm-error");
    clearError(termsCheckbox, "terms-error");
    if (alertFeedback) alertFeedback.classList.add("hidden");

    // Name check
    const nameVal = nameInput?.value?.trim() || "";
    if (!nameVal) {
      setError(nameInput, "name-error", t("auth.validation.nameRequired"));
      hasError = true;
    } else if (nameVal.length < 3) {
      setError(nameInput, "name-error", t("auth.validation.nameMin"));
      hasError = true;
    }

    // Email check
    const emailVal = emailInput?.value?.trim() || "";
    if (!emailVal) {
      setError(emailInput, "email-error", t("auth.validation.emailRequired"));
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setError(emailInput, "email-error", t("auth.validation.emailInvalid"));
      hasError = true;
    }

    // Password check
    const passVal = passwordInput?.value || "";
    if (!passVal) {
      setError(passwordInput, "password-error", t("auth.validation.passwordRequired"));
      hasError = true;
    } else if (passVal.length < 8) {
      setError(passwordInput, "password-error", t("auth.validation.passwordMin"));
      hasError = true;
    }

    // Confirm Password check
    const confirmVal = confirmPasswordInput?.value || "";
    if (!confirmVal) {
      setError(confirmPasswordInput, "confirm-error", t("auth.validation.confirmRequired"));
      hasError = true;
    } else if (confirmVal !== passVal) {
      setError(confirmPasswordInput, "confirm-error", t("auth.validation.passwordMismatch"));
      hasError = true;
    }

    // Terms check
    if (termsCheckbox && !termsCheckbox.checked) {
      setError(termsCheckbox, "terms-error", t("auth.validation.termsRequired"));
      hasError = true;
    }

    if (!hasError && alertFeedback) {
      alertFeedback.textContent = t("auth.validation.successRegisterDemo");
      alertFeedback.className = "auth-alert-feedback auth-alert-success";
      alertFeedback.classList.remove("hidden");
    }
  });
}

// ─── Boot ─────────────────────────────────────────────────
async function boot() {
  await initI18n();
  initNav();
  wirePasswordToggles();
  wireLoginForm();
  wireRegisterForm();
}

boot().catch(console.error);
