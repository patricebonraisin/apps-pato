const CACHE_NAME = "pato-apps-v11";

const FILES_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",
  "accueil.png",
  "accueil_dark.png",
  "app-map.png",
  "ascens-logo.png",
  "hero-climber.png",
  "patolife.png",
  "melovia.png",
  "finelio.png",
  "loopamove.png",
  "encore_la.png",
  "pato-meteo.png",
  "pulse_game.png",
  "ascens_marketing.html",
  "ascens_privacy.html",
  "ascens_support.html",
  "pato-life-blog-page.html",
  "melovia-blog-page.html",
  "finelio-blog-page.html",
  "loopa-move-blog-page.html",
  "page-marketing-encore-la.html",
  "Pato_meteo_MarketingPage.html",
  "Pato_meteo_PrivacyPolicy.html",
  "pulse_marketing.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestURL = new URL(event.request.url);
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then(response => response || caches.match("index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
