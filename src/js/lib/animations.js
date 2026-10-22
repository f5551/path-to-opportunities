/**
 * animations.js — Motion for JavaScript integration
 *
 * Provides lightweight, purposeful animations.
 * All animations respect prefers-reduced-motion.
 *
 * Based on web-animation-design skill principles:
 * - ease-out for entering elements
 * - opacity + transform only (GPU composited)
 * - <300ms duration for UI animations
 * - No animation for frequently-repeated interactions
 */

let motionLib = null;

/** Dynamically load Motion for JavaScript (tree-shakeable) */
async function getMotion() {
  if (motionLib) return motionLib;
  try {
    const mod = await import("motion");
    motionLib = mod;
    return motionLib;
  } catch {
    console.warn("[animations] Motion library not available, skipping animations.");
    return null;
  }
}

/** Whether the user prefers reduced motion */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animate a list of elements entering the DOM
 * Fast, non-blocking staggered fade-up — ease-out-cubic
 * Safe: Never leaves elements hidden if animation is interrupted.
 * @param {HTMLElement[]} elements
 */
export async function animateCardsEnter(elements) {
  if (prefersReducedMotion() || !elements || !elements.length) return;

  try {
    const motion = await getMotion();
    if (!motion) return;

    const { animate, stagger } = motion;

    // Use a fast micro-stagger that settles in <250ms
    const animationPromise = animate(
      elements,
      { opacity: [0.35, 1], transform: ["translateY(8px)", "translateY(0px)"] },
      {
        duration: 0.18,
        easing: [0.215, 0.61, 0.355, 1],
        delay: stagger(0.02, { start: 0.01 }),
      }
    );

    await animationPromise;
  } catch (err) {
    // Graceful fallback: ensure all elements are visible
  } finally {
    elements.forEach((el) => {
      if (el) {
        el.style.opacity = "";
        el.style.transform = "";
      }
    });
  }
}

/**
 * Animate the search results refresh — subtle fast fade
 * @param {HTMLElement} container
 */
export async function animateGridRefresh(container) {
  if (prefersReducedMotion() || !container) return;

  try {
    const motion = await getMotion();
    if (!motion) return;
    const { animate } = motion;
    await animate(
      container,
      { opacity: [0.65, 1] },
      { duration: 0.1, easing: "ease-out" }
    );
  } catch {}
}

/**
 * Animate filter tab press feedback
 * @param {HTMLElement} tab
 */
export async function animateTabPress(tab) {
  if (prefersReducedMotion()) return;

  const motion = await getMotion();
  if (!motion) return;

  const { animate } = motion;

  await animate(
    tab,
    { transform: ["scale(0.97)", "scale(1)"] },
    { duration: 0.12, easing: [0.215, 0.61, 0.355, 1] }
  );
}

/**
 * Animate hero section fade-in on first load
 * @param {HTMLElement} heroSection
 */
export async function animateHeroEnter(heroSection) {
  if (prefersReducedMotion()) return;

  const motion = await getMotion();
  if (!motion) return;

  const { animate } = motion;

  const title = heroSection.querySelector(".hero-title");
  const subtitle = heroSection.querySelector(".hero-subtitle");
  const search = heroSection.querySelector(".search-wrapper");

  const els = [title, subtitle, search].filter(Boolean);

  els.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
  });

  const { stagger } = motion;

  await animate(
    els,
    { opacity: [0, 1], transform: ["translateY(8px)", "translateY(0px)"] },
    {
      duration: 0.3,
      easing: [0.215, 0.61, 0.355, 1],
      delay: stagger(0.06, { start: 0.05 }),
    }
  );

  els.forEach((el) => {
    el.style.opacity = "";
    el.style.transform = "";
  });
}

let _scrollObserver = null;

/**
 * Initialize subtle scroll reveal on elements with [data-reveal]
 * Uses native IntersectionObserver for high performance, zero layout shift
 */
export function initScrollReveal() {
  const elements = document.querySelectorAll("[data-reveal]");
  if (!elements.length) return;

  // Reduced motion: reveal all immediately
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    elements.forEach((el) => el.classList.add("revealed"));
    return;
  }

  // Immediately reveal elements already near or within viewport on first paint
  const vh = window.innerHeight || 800;
  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh + 100) {
      el.classList.add("revealed");
    }
  });

  // Disconnect previous observer to prevent duplicate memory leaks on re-runs
  if (_scrollObserver) {
    _scrollObserver.disconnect();
    _scrollObserver = null;
  }

  _scrollObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.01,
      rootMargin: "0px 0px 600px 0px",
    }
  );

  elements.forEach((el) => {
    if (!el.classList.contains("revealed")) {
      _scrollObserver.observe(el);
    }
  });
}

