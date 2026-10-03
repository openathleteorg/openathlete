/*
 * OpenAthlete service worker: makes the web app installable and lets it
 * open without a connection. Deliberately small:
 * - Page loads always try the network first, so a deploy is visible on the
 *   next load. The app shell (index.html) is kept only as an offline fallback.
 * - Vite build files under /assets/ have content hashes and never change:
 *   they are served from the cache once fetched.
 * - Everything else (API, Socket.IO, other origins, non-GET) is not touched.
 * Bump VERSION to drop all caches of previous versions.
 */
const VERSION = 'v1';
const SHELL_CACHE = `openathlete-shell-${VERSION}`;
const ASSET_CACHE = `openathlete-assets-${VERSION}`;
const SHELL_URL = '/index.html';
// Several deploys of hashed files; the oldest entries are dropped first.
const MAX_ASSETS = 300;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add(new Request(SHELL_URL, { cache: 'no-store' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith('openathlete-') &&
                key !== SHELL_CACHE &&
                key !== ASSET_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function refreshShell() {
  try {
    const response = await fetch(SHELL_URL, { cache: 'no-store' });
    if (response.ok)
      await (await caches.open(SHELL_CACHE)).put(SHELL_URL, response);
  } catch {
    // Keep the previous shell.
  }
}

async function navigate(event) {
  try {
    const response = await fetch(event.request);
    // Refresh the offline shell without delaying the page.
    event.waitUntil(refreshShell());
    return response;
  } catch (error) {
    const shell = await caches.match(SHELL_URL, { cacheName: SHELL_CACHE });
    if (shell) return shell;
    throw error;
  }
}

async function trim(cache) {
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((key) =>
      cache.delete(key),
    ),
  );
}

async function asset(event) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok && response.type === 'basic') {
    await cache.put(event.request, response.clone());
    event.waitUntil(trim(cache));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigate(event));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(asset(event));
  }
});
