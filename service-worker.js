const CACHE_NAME = "chhapola-agriculture-v3";

const urlsToCache = [
  "./",
  "./index.html",
  "./Style.css",
  "./Script.js",
  "./manifest.json",
  "./icon-192-1.png",
  "./icon-512-1.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
