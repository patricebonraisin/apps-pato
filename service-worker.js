const CACHE_NAME = "pato-apps-v2";

const FILES_TO_CACHE = [
  "./",
  "index.html",
  "patolife.png",
  "melovia.png",
  "finelio.png",
  "loopamove.png",
  "pato-life-blog-page.html",
  "melovia-blog-page.html",
  "finelio-blog-page.html",
  "loopa-move-blog-page.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
