const cacheName = "digipages-v4";
const appShell = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/apple-touch-icon.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];
const networkFirstAssets = new Set(
    ["./", "./index.html", "./style.css", "./script.js", "./manifest.json"]
        .map((path) => new URL(path, self.registration.scope).href)
);

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(cacheName).then((cache) => cache.addAll(appShell))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== cacheName)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    if (networkFirstAssets.has(event.request.url)) {
        event.respondWith(
            fetch(event.request, { cache: "no-store" })
                .then(async (response) => {
                    if (response.ok) {
                        const cache = await caches.open(cacheName);

                        await cache.put(event.request, response.clone());
                    }

                    return response;
                })
                .catch(() =>
                    caches.match(event.request).then((cachedResponse) =>
                        cachedResponse || Response.error()
                    )
                )
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) =>
            cachedResponse || fetch(event.request)
        )
    );
});
