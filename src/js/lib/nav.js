/**
 * nav.js — Shared Navigation, Mobile Drawer & Language Switching
 *
 * Provides accessible mobile drawer toggle, active link indicators,
 * and seamless language switching across all 6 pages.
 */

import { toggleLang, setLanguage } from "./i18n.js";
import { getFavoritesCount } from "./favoritesStore.js";
import { initServiceWorker } from "./swRegister.js";

/**
 * Initialize shared navigation interactions on any page
 * @param {object} options
 * @param {Function} [options.onLangChange] - Callback invoked when language changes
 */
export function initNav(options = {}) {
  const { onLangChange } = options;

  // 1. Language Switcher Dropdown & Mobile Segmented Controls
  initLanguageSwitchers(onLangChange);

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

  // Close drawer when clicking any drawer link
  mobileDrawer?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeDrawer();
    });
  });

  // 3. Highlight Current Active Nav Link
  highlightActiveNavLinks();
  window.addEventListener("hashchange", highlightActiveNavLinks);

  // 4. Mobile Bottom Navigation
  initBottomNav();

  // 5. Service Worker (Offline Support)
  initServiceWorker();
}

/**
 * Matches window.location to nav anchors
 */
function highlightActiveNavLinks() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const navLinks = document.querySelectorAll(".nav-link, .drawer-nav-link");

  const isHome = path.endsWith("/") || path.endsWith("index.html") || path === "";
  const isOpportunities = path.endsWith("opportunities.html");
  const isAboutHash = hash === "#about";

  navLinks.forEach((link) => {
    const rawHref = link.getAttribute("href") || "";
    const href = rawHref.toLowerCase();
    let isActive = false;

    if (href.endsWith("#about") || href === "#about") {
      isActive = isHome && isAboutHash;
    } else if (href === "/" || href === "index.html" || href === "./" || href === "./index.html") {
      isActive = isHome && !isAboutHash;
    } else if (href.includes("opportunities.html")) {
      isActive = isOpportunities;
    } else {
      const cleanHref = href.split("#")[0].replace("./", "");
      if (cleanHref && path.endsWith(cleanHref)) {
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

/**
 * Initialize accessible dropdown and drawer language switcher components
 */
function initLanguageSwitchers(onLangChange) {
  const switchers = document.querySelectorAll(".lang-switcher");

  switchers.forEach((switcher) => {
    const trigger = switcher.querySelector(".lang-btn, #lang-toggle");
    const menu = switcher.querySelector(".lang-menu");
    const options = Array.from(switcher.querySelectorAll(".lang-option"));

    if (!trigger) return;

    // Fallback if no dropdown menu attached
    if (!menu || options.length === 0) {
      trigger.addEventListener("click", async () => {
        const newLang = await toggleLang();
        if (typeof onLangChange === "function") {
          await onLangChange(newLang);
        }
      });
      return;
    }

    function openMenu() {
      closeAllLangMenus();
      switcher.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
      // Focus currently selected option or first option
      const activeOpt =
        options.find((o) => o.getAttribute("aria-selected") === "true") ||
        options[0];
      activeOpt?.focus();
    }

    function closeMenu(returnFocus = false) {
      if (!switcher.classList.contains("open")) return;
      switcher.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
      if (returnFocus) {
        trigger.focus();
      }
    }

    // Toggle menu on trigger click
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = switcher.classList.contains("open");
      if (isOpen) {
        closeMenu(false);
      } else {
        openMenu();
      }
    });

    // Keyboard trigger: ArrowDown / ArrowUp / Enter / Space opens menu
    trigger.addEventListener("keydown", (e) => {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        openMenu();
      }
    });

    // Options selection and keyboard navigation
    options.forEach((opt, idx) => {
      opt.addEventListener("click", async (e) => {
        e.stopPropagation();
        const targetLang = opt.dataset.langValue;
        closeMenu(true);
        if (targetLang) {
          const newLang = await setLanguage(targetLang);
          if (typeof onLangChange === "function") {
            await onLangChange(newLang);
          }
        }
      });

      opt.addEventListener("keydown", async (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const nextIdx = (idx + 1) % options.length;
          options[nextIdx]?.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prevIdx = (idx - 1 + options.length) % options.length;
          options[prevIdx]?.focus();
        } else if (e.key === "Home") {
          e.preventDefault();
          options[0]?.focus();
        } else if (e.key === "End") {
          e.preventDefault();
          options[options.length - 1]?.focus();
        } else if (e.key === "Escape") {
          e.preventDefault();
          closeMenu(true);
        } else if (e.key === "Tab") {
          closeMenu(false);
        }
      });
    });
  });

  // Drawer segmented language buttons
  const drawerLangBtns = document.querySelectorAll(".drawer-lang-btn");
  drawerLangBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetLang = btn.dataset.langValue;
      if (targetLang) {
        const newLang = await setLanguage(targetLang);
        if (typeof onLangChange === "function") {
          await onLangChange(newLang);
        }
      }
    });
  });

  // Click outside to close open menus
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".lang-switcher")) {
      closeAllLangMenus(false);
    }
  });

  // Global ESC to close any open language menu
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllLangMenus(true);
    }
  });
}

function closeAllLangMenus(returnFocus = false) {
  const openMenus = document.querySelectorAll(".lang-switcher.open");
  openMenus.forEach((switcher) => {
    switcher.classList.remove("open");
    const trigger = switcher.querySelector(".lang-btn, #lang-toggle");
    trigger?.setAttribute("aria-expanded", "false");
    if (returnFocus) {
      trigger?.focus();
    }
  });
}

/**
 * Initialize fixed Mobile Bottom Navigation
 */
function initBottomNav() {
  const bottomNav = document.querySelector(".bottom-nav");
  if (!bottomNav) return;

  const path = window.location.pathname.toLowerCase();
  const isHome = path.endsWith("/") || path.endsWith("index.html") || path === "";
  const isOpportunities = path.endsWith("opportunities.html");
  const isGuide = path.endsWith("guide.html");

  const homeItem = bottomNav.querySelector('[data-nav="home"]');
  const oppsItem = bottomNav.querySelector('[data-nav="opportunities"]');
  const favItem = bottomNav.querySelector('#bottom-nav-fav-btn, [data-nav="favorites"]');
  const guideItem = bottomNav.querySelector('[data-nav="guide"]');
  const moreItem = bottomNav.querySelector('#bottom-nav-more-btn, [data-nav="more"]');
  const favBadge = bottomNav.querySelector("#bottom-fav-count-badge");

  // Sync favorites badge count
  function syncFavBadge() {
    try {
      const count = getFavoritesCount();
      if (favBadge) {
        favBadge.textContent = String(count);
        favBadge.classList.toggle("hidden", count === 0);
      }
    } catch {}
  }
  syncFavBadge();
  window.addEventListener("pto:favorites-updated", syncFavBadge);

  // Set active item based on page
  const updateActiveStates = () => {
    bottomNav.querySelectorAll(".bottom-nav-item").forEach((el) => {
      el.classList.remove("active");
      el.removeAttribute("aria-current");
    });

    const urlParams = new URLSearchParams(window.location.search);
    const hasFavParam = urlParams.get("favorites") === "1" || urlParams.get("favorites") === "true";
    const filterFavBtn = document.getElementById("filter-favorites-btn");
    const isFavActive = filterFavBtn?.classList.contains("active") || (isOpportunities && hasFavParam);

    if (isHome) {
      homeItem?.classList.add("active");
      homeItem?.setAttribute("aria-current", "page");
    } else if (isOpportunities) {
      if (isFavActive) {
        favItem?.classList.add("active");
      } else {
        oppsItem?.classList.add("active");
        oppsItem?.setAttribute("aria-current", "page");
      }
    } else if (isGuide) {
      guideItem?.classList.add("active");
      guideItem?.setAttribute("aria-current", "page");
    }
  };

  updateActiveStates();

  // Wire Favorites button
  favItem?.addEventListener("click", () => {
    if (isOpportunities) {
      const filterFavBtn = document.getElementById("filter-favorites-btn");
      filterFavBtn?.click();
    } else {
      window.location.href = "opportunities.html?favorites=1";
    }
  });

  // Wire Opportunities button on opportunities page: exit favorites if active
  oppsItem?.addEventListener("click", (e) => {
    if (isOpportunities) {
      const filterFavBtn = document.getElementById("filter-favorites-btn");
      if (filterFavBtn && filterFavBtn.classList.contains("active")) {
        e.preventDefault();
        const allTab = document.querySelector('.filter-tab[data-filter="all"]');
        if (allTab) {
          allTab.click();
        } else {
          filterFavBtn.click();
        }
      }
    }
  });

  // Wire More button
  moreItem?.addEventListener("click", () => {
    const menuToggleBtn = document.getElementById("mobile-menu-toggle");
    menuToggleBtn?.click();
  });
}
