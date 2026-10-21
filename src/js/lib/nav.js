/**
 * nav.js — Shared Navigation, Mobile Drawer & Language Switching
 *
 * Provides accessible mobile drawer toggle, active link indicators,
 * and seamless language switching across all 6 pages.
 */

import { toggleLang } from "./i18n.js";

/**
 * Initialize shared navigation interactions on any page
 * @param {object} options
 * @param {Function} [options.onLangChange] - Callback invoked when language changes
 */
export function initNav(options = {}) {
  const { onLangChange } = options;

  // 1. Language Toggle Buttons (desktop + mobile)
  const langToggleBtns = document.querySelectorAll(".btn-lang, #lang-toggle, #mobile-lang-toggle");
  langToggleBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const newLang = await toggleLang();
      if (typeof onLangChange === "function") {
        await onLangChange(newLang);
      }
    });
  });

  // 2. Mobile Drawer Elements
  const menuToggleBtn = document.getElementById("mobile-menu-toggle");
  const mobileDrawer = document.getElementById("mobile-drawer");
  const drawerCloseBtn = document.getElementById("drawer-close-btn");
  const drawerBackdrop = document.getElementById("drawer-backdrop");

  function openDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove("hidden");
    // Trigger transition next frame
    requestAnimationFrame(() => {
      mobileDrawer.classList.add("open");
    });
    menuToggleBtn?.setAttribute("aria-expanded", "true");
    document.body.classList.add("drawer-open");
    drawerCloseBtn?.focus();
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove("open");
    menuToggleBtn?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("drawer-open");
    setTimeout(() => {
      if (!mobileDrawer.classList.contains("open")) {
        mobileDrawer.classList.add("hidden");
      }
    }, 250);
    menuToggleBtn?.focus();
  }

  menuToggleBtn?.addEventListener("click", () => {
    const isOpen = mobileDrawer?.classList.contains("open");
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  drawerCloseBtn?.addEventListener("click", closeDrawer);
  drawerBackdrop?.addEventListener("click", closeDrawer);

  // Close drawer on ESC key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileDrawer?.classList.contains("open")) {
      closeDrawer();
    }
  });

  // 3. Highlight Current Active Nav Link
  highlightActiveNavLinks();
}

/**
 * Matches window.location.pathname to nav anchors
 */
function highlightActiveNavLinks() {
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const navLinks = document.querySelectorAll(".nav-link, .drawer-nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href")?.toLowerCase() || "";
    let isActive = false;

    if (href === "/" || href === "index.html" || href === "./" || href === "./index.html") {
      isActive = path.endsWith("/") || path.endsWith("index.html") || path === "";
    } else if (href.includes("opportunities.html")) {
      if (href.includes("?type=")) {
        isActive = search.includes(href.split("?")[1]);
      } else {
        isActive = path.endsWith("opportunities.html") && !search.includes("type=");
      }
    } else {
      const cleanHref = href.split("#")[0].replace("./", "");
      if (cleanHref && path.includes(cleanHref)) {
        isActive = true;
      }
    }

    if (isActive) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });
}
