// sw.js — Service Worker for The Log
// IMPORTANT: bump the version number below every time you push updates to GitHub
// e.g. "thelog-v1" -> "thelog-v2" -> "thelog-v3" etc.
// This forces the old cache to be deleted and all files to be re-downloaded.
const CACHE = "thelog-v2";

const STATIC = [
  "/routine/",
  "/routine/index.html",
  "/routine/css/styles.css",
  "/routine/js/data.js",
  "/routine/js/api.js",
  "/routine/js/app.js",
  "/routine/data/routines.js",
  "/routine/pages/bible.html",
  "/routine/pages/trading.html",
  "/routine/pages/money.html",
  "/routine/pages/food.html",
  "/routine/pages/planner.html",
  "/routine/pages/weekly-review.html",
  "/routine/pages/workout-routines.html",
  "/routine/pages/workout-routines.html",
  "/routine/manifest.json",
  "/routine/icons/icon-192.png",
  "/routine/icons/icon-512.png"
];

// Install — cache all static files
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting()) // activate immediately, don't wait for old SW to die
  );
});

// Activate — delete ALL old caches so updates take effect immediately
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log("SW: deleting old cache", k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// Fetch — network first for HTML pages (so updates are always picked up),
// cache first for everything else (CSS, JS, images)
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Always go to network for API calls — never cache Notion data
  if (url.hostname.includes("workers.dev")) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          headers: { "Content-Type": "application/json" }
        })
      )
    );
    return;
  }

  // Network first for HTML — ensures you always get the latest page after a GitHub push
  if (e.request.destination === "document") {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request)) // offline fallback
    );
    return;
  }

  // Cache first for CSS/JS/images — fast loads, updated when cache version bumps
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      });
    })
  );
});
