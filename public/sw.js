// Minimaler Service Worker. Ziel ist in erster Linie "Installierbarkeit"
// (Browser verlangen einen registrierten Service Worker, bevor sie das
// Installations-Icon/den "App installieren"-Dialog anbieten) — nicht
// vollständiges Offline-Trading, das ergibt bei Live-Marktdaten ohnehin
// wenig Sinn.
const CACHE_NAME = "tradevault-pro-v1";
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL, "/manifest.json"]))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: Trading-Daten sollen so aktuell wie möglich sein.
// Nur bei Netzwerkfehler (z. B. kurzer Verbindungsabbruch) greift der Cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((r) => r || caches.match(OFFLINE_URL)))
  );
});
