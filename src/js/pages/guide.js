/**
 * guide.js — Application Guide Controller
 *
 * Manages the interactive FAQ accordion and scroll reveal animations.
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

async function boot() {
  await initI18n();
  initNav();
  wireAccordion();
  initScrollReveal();
}

boot().catch(console.error);
