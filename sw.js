// Service worker: hace que la app abra SIN internet.
// "Network-first": con internet trae SIEMPRE lo último; sin internet usa lo guardado.
// Subí la versión (v2 -> v3...) cada vez que cambies index.html o sw.js.
const CACHE = "stock-off-v4";
const SHELL = ["./", "index.html", "manifest.json", "icon.png"];

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
  // Datos (CSV de Google): que lo maneje la app (no lo tocamos acá).
  if (req.url.includes("output=csv") || req.url.includes("docs.google.com")) return;
  // App (html/js/json/png): PRIMERO la red (para tener siempre lo último);
  // si no hay internet, usa la copia guardada.
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
