/**
 * Service Worker — Path to Opportunities | طريق الفرص
 * Provides reliable offline browsing and caching for all pages, assets, and data.
 * Fully compatible with root domain (localhost) and GitHub Pages subpaths.
 */

const CACHE_NAME = /* __CACHE_NAME__ */ 'pto-cache-v1';

// Injected during Vite build if available; defaults to empty array
const BUILD_ASSETS = /* __BUILD_ASSETS__ */ [];

/**
 * Core assets required to run the application offline
 */
const getPrecacheUrls = (scope) => {
  const baseFiles = [
    '',
    'index.html',
    'opportunities.html',
    'detail.html',
    'guide.html',
    'login.html',
    'register.html',
    'opportunities.json',
    'favicon.svg',
    'favicon.ico',
    'fonts/NotoSansArabic-Variable.woff2',
    'fonts/InterVariable.woff2',
    'assets/images/brand-icon.png',
    'assets/images/brand-icon-light.png',
    'assets/images/hero-student.jpg',
  ];

  const allFiles = [...baseFiles, ...BUILD_ASSETS];
  const uniqueFiles = Array.from(new Set(allFiles));

  return uniqueFiles.map((file) => new URL(file, scope).href);
};

// 1. Install event: Precache core shell and assets safely (no automatic skipWaiting to protect open pages)
self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const urlsToCache = getPrecacheUrls(scope);

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        urlsToCache.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response && response.status === 200) {
              await cache.put(url, response);
            }
          } catch (err) {
            // Optional asset fetch failed; continuing so install never breaks
          }
        })
      );
    })
  );
});

// Allow clients to trigger skipWaiting explicitly when safe
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 2. Activate event: Cleanup stale project caches (pto-cache-*) and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('pto-cache-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Strategic caching for documents, data, and static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Ignore browser extensions or other protocols
  if (!url.protocol.startsWith('http')) return;

  const isNavigation = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
  const isDataJson = url.pathname.endsWith('opportunities.json');

  // Strategy A: Network-First with Cache Fallback for HTML navigations & opportunities.json
  if (isNavigation || isDataJson) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);

          // 1. Exact match
          let match = await cache.match(request);
          if (match) return match;

          // 2. Match ignoring query parameters (e.g. detail.html?id=..., opportunities.html?q=...)
          match = await cache.match(request, { ignoreSearch: true });
          if (match) return match;

          // 3. Fallback to clean page pathname or index.html for root navigation
          const pathname = url.pathname;
          const scope = self.registration.scope;
          const scopePath = new URL(scope).pathname;

          if (isNavigation) {
            if (pathname === scopePath || pathname.endsWith('/') || pathname === '') {
              const rootMatch = await cache.match(new URL('index.html', scope).href);
              if (rootMatch) return rootMatch;
            }

            // Extract filename from path (e.g. /opportunities.html -> opportunities.html)
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            if (filename) {
              const fileMatch = await cache.match(new URL(filename, scope).href);
              if (fileMatch) return fileMatch;
            }

            // Ultimate fallback for navigations: index.html
            return cache.match(new URL('index.html', scope).href);
          }

          return null;
        })
    );
    return;
  }

  // Strategy B: Cache-First with Network Fallback for static assets (JS, CSS, fonts, images)
  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        // Return undefined/null so browser handles error naturally
        return cachedResponse;
      }
    })
  );
});
