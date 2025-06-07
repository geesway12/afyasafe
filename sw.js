const CACHE_NAME = "afyasafe-cache-v2";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/analytics.html",
  "/learn.html",
  "/market.html",
  "/style.css",
  "/app.js",
  "/sw.js",
  "/manifest.json",
  // Add all images and icons you want available offline:
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/t1.png",
  "/ad1.png",
  "/y1.png",
  "/ya2.png",
  "/m1.png",
  "/m2.PNG",
  "/m3.PNG",
  "/m4.PNG",
  "/m5.PNG",
  "/m6.PNG",
  // ...add all other images used in your app...
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
