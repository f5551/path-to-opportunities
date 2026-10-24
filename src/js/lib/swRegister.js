/**
 * swRegister.js — Service Worker Registration & Lifecycle Management
 * Handles graceful registration for both localhost and GitHub Pages subpaths.
 * Registered only in production builds (or when window.__ENABLE_SW__ is set).
 */

/**
 * Dynamically determines the current base scope directory.
 * Works seamlessly whether hosted at root domain (/) or repository subpath (/path-to-opportunities/).
 * @returns {string} Fully qualified base scope URL
 */
export function getBaseScope() {
  const loc = window.location;
  const dir = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
  return `${loc.origin}${dir}`;
}

/**
 * Initializes and registers the Service Worker safely.
 * Non-blocking, fails gracefully without impacting the user interface.
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function initServiceWorker() {
  const isProd = import.meta.env.PROD;
  const isExplicitlyEnabled = typeof window !== 'undefined' && window.__ENABLE_SW__ === true;

  // Do not register in Vite dev mode to avoid caching HMR scripts
  if (!isProd && !isExplicitlyEnabled) {
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const baseScope = getBaseScope();
    const swUrl = `${baseScope}sw.js`;

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: baseScope,
    });

    // Check for updates when coming back online
    window.addEventListener('online', () => {
      registration.update().catch(() => {});
    });

    return registration;
  } catch (error) {
    // Graceful fallback: offline mode will be unavailable but site works normally
    console.warn('[SW] Service Worker registration failed gracefully:', error?.message || error);
    return null;
  }
}
