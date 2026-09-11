/* Service Worker: legt die App beim ersten Besuch ab, danach läuft sie offline.
   Strategie: erst aus dem Cache antworten (sofort da, auch ohne Empfang),
   parallel im Hintergrund nach einer neueren Fassung schauen. */
const CACHE = "nochmal-v4";
const FILES = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const fresh = fetch(e.request).then(res => {
        if(res && res.status === 200)
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || fresh;
    })
  );
});
