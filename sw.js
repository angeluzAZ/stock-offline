// Service worker: cachea la app para que abra SIN internet.
// Subí la versión (v1 -> v2...) cada vez que cambies index.html para forzar update.
const CACHE = "stock-off-v2";
const SHELL = ["./", "index.html", "manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Datos (CSV de Google): siempre intentar red; si no hay, no rompe (la app usa lo guardado).
  if (req.url.includes("output=csv") || req.url.includes("docs.google.com")) return;
  // App shell: primero cache, si no red (y guarda copia).
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("index.html")))
  );
});
