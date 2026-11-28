const CACHE_NAME = "pato-apps-v17";
const FILES_TO_CACHE = [
  "./", "index.html", "manifest.json", "offline.html",
  "AF_marketing.html", "AM_marketing.html", "EntreNous_marketing.html",
  "face-a-face-marketing.html", "pato-cash-marketing.html", "pato-pong-marketing.html",
  "ascens_marketing.html", "pato-life-blog-page.html", "melovia-blog-page.html",
  "finelio-blog-page.html", "loopa-move-blog-page.html", "page-marketing-encore-la.html",
  "Pato_meteo_MarketingPage.html", "pulse_marketing.html",
  "ascens_privacy.html", "ascens_support.html", "Pato_meteo_PrivacyPolicy.html",
  "icons-pato/app-192.png", "icons-pato/app-512.png", "icons-pato/app-maskable-512.png",
  "icons-pato/face-a-face.webp", "icons-pato/pato-cash.webp", "icons-pato/finelio.webp",
  "icons-pato/pato-pong-icon.webp", "icons-pato/assistant-maison-logo.webp", "icons-pato/entrenous.webp",
  "icons-pato/ascens-logo.webp", "icons-pato/encore_la.webp", "icons-pato/patolife.webp",
  "icons-pato/loopamove.webp", "icons-pato/melovia.webp", "icons-pato/pato-meteo.webp",
  "icons-pato/mon_arbre.webp", "icons-pato/pulse_game.webp"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(name => name.startsWith("pato-apps-") && name !== CACHE_NAME).map(name => caches.delete(name))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return await cache.match(request, { ignoreSearch: true }) || await cache.match("offline.html");
      }
    })());
    return;
  }

  if (request.destination === "image") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return await cache.match(request) || Response.error();
      }
    })());
  }
});
