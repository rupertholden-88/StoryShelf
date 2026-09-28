// Service worker: makes the app installable and lets it open offline.
// Bump VERSION when this file's caching rules change; old caches are deleted on activate.
const VERSION = "v2";
const PAGES = `story-shelf-pages-${VERSION}`;
const ASSETS = `story-shelf-assets-${VERSION}`;
const SHELL = ["/", "/for-you", "/scan", "/manifest.webmanifest", "/icon-192.png"];
// Each deploy brings new build files, so keep only the most recent ones.
const MAX_ASSETS = 80;
const MAX_PAGES = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  // Oldest entries come first.
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

async function put(name, max, req, res) {
  const cache = await caches.open(name);
  await cache.delete(req); // re-adding moves it to the end, so trimming drops the least recently fetched
  await cache.put(req, res);
  await trim(name, max);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Build files have content hashes in their names, so a cached copy is always right.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) event.waitUntil(put(ASSETS, MAX_ASSETS, req, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Pages and everything else: network first, cached copy when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) event.waitUntil(put(PAGES, MAX_PAGES, req, res.clone()));
        return res;
      })
      .catch(() =>
        caches.match(req).then((r) => r || (req.mode === "navigate" ? caches.match("/") : Response.error()))
      )
  );
});
