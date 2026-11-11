/* AceTalk 3.4 Dahlia service worker.
   It lets browsers install AceTalk as an app and opens the last loaded version when the
   device is offline. Messages, calls, PeerJS, news and photos never pass through it:
   only files from AceTalk's own site are handled here. */
const CACHE = 'acetalk-3.4-dahlia';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'acetalk-icon-192.png', 'acetalk-icon-512.png', 'acetalk-icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Network first, so a new AceTalk version shows up right away; the saved copy is used only offline.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req)
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined))
        .then(res => res || Response.error()))
  );
});
