/**
 * guide.js — Scholarship Application Guide Controller
 *
 * Manages:
 * 1. Stage navigation tabs and active scroll tracking.
 * 2. FAQ accordion expansion.
 * 3. Accessible Contact & Assistance Modal (WCAG 2.2 compliant).
 * 4. Scroll reveal animations.
 */

import { initI18n } from "../lib/i18n.js";
import { initNav } from "../lib/nav.js";
import { initScrollReveal } from "../lib/animations.js";

function wireAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const btn = item.querySelector(".faq-btn");
    btn?.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      // Close other open accordion items for clean focus
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains("open")) {
          other.classList.remove("open");
          other.querySelector(".faq-btn")?.setAttribute("aria-expanded", "false");
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function initContactModal() {
  const openBtn = document.getElementById("btn-open-contact-modal");
  const modal = document.getElementById("contact-team-modal");
  const closeBtn = document.getElementById("modal-close-btn");
  const backdrop = document.getElementById("modal-backdrop");
  const form = document.getElementById("contact-assistance-form");
  const formWrap = document.getElementById("modal-form-wrap");
  const successState = document.getElementById("modal-success-state");
  const resetFormBtn = document.getElementById("btn-new-request");

  if (!openBtn || !modal) return;

  function openModal() {
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    const firstInput = modal.querySelector("input, select, textarea");
    firstInput?.focus();
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    openBtn.focus();
  }

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Handle form submission
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const requestData = {
      id: "req-" + Date.now(),
      fullName: formData.get("fullName") || "",
      email: formData.get("email") || "",
      phone: formData.get("phone") || "",
      targetOpp: formData.get("targetOpp") || "",
      helpType: formData.get("helpType") || "",
      notes: formData.get("notes") || "",
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("pto_contact_requests") || "[]");
      existing.push(requestData);
      localStorage.setItem("pto_contact_requests", JSON.stringify(existing));
    } catch (err) {
      console.warn("Could not save assistance request locally:", err);
    }

    if (formWrap && successState) {
      formWrap.classList.add("hidden");
      successState.classList.remove("hidden");
      const title = successState.querySelector("h3");
      title?.focus();
    }
  });

  // Button to send another request
  resetFormBtn?.addEventListener("click", () => {
    form?.reset();
    formWrap?.classList.remove("hidden");
    successState?.classList.add("hidden");
    const firstInput = form?.querySelector("input");
    firstInput?.focus();
  });
}

function initStageTabs() {
  const tabs = document.querySelectorAll(".stage-tab-link");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const targetId = tab.getAttribute("href");
      if (targetId && targetId.startsWith("#")) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          tabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
        }
      }
    });
  });

  // IntersectionObserver for active tab sync
  const stages = document.querySelectorAll(".guide-stage-block");
  if ("IntersectionObserver" in window && stages.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tabs.forEach((tab) => {
              const matches = tab.getAttribute("href") === `#${id}`;
              tab.classList.toggle("active", matches);
            });
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    stages.forEach((s) => observer.observe(s));
  }
}

async function boot() {
  await initI18n();
  initNav();
  initStageTabs();
  initContactModal();
  wireAccordion();
  initScrollReveal();
}

boot().catch(console.error);
