/* Blakey Trades — self-destruct kill switch.
   The demo intentionally runs WITHOUT a service worker. This file exists only to
   evict any stale SW (and its caches) left over from an earlier build, then get
   out of the way. A caching SW was serving a stale app.js / a broken cached logo
   (the "greyed-out screen with a sad-face image"). Browsers re-fetch sw.js on every
   navigation, so this version is guaranteed to be picked up and tear the old one down. */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // 1. delete every cache this origin ever created
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    // 2. unregister this service worker
    await self.registration.unregister();
    // 3. reload every open tab so it loads fresh, with no controller
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach((c) => c.navigate(c.url));
  })());
});

// No fetch handler on purpose — every request goes straight to the network.
// Nothing is ever served from cache, so stale assets can't come back.
