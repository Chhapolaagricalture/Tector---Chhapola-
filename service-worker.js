const CACHE_NAME = "chhapola-agriculture-v11";

const urlsToCache = [
  "./",
  "./index.html",
  "./Style.css",
  "./Script.js",
  "./manifest.json",
  "./icon-192-v2.png",
  "./icon-512-v2.png"
];

// JS/AI files that must NEVER be stale
const NETWORK_FIRST_PATTERNS = [".js", "ai-"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url || "";
  const isJS = NETWORK_FIRST_PATTERNS.some(p => url.includes(p));

  if (isJS) {
    // Network-first for JS files — always get fresh code
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for static assets (images, CSS, HTML)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});
