// Network-first service worker: always fetch the latest version when online,
// fall back to the cached copy when offline.
// Bump this when CORE changes (and keep FILES in js/update.js in step).
const CACHE = 'shuo-zhongwen-v5';

// Everything the app needs to run offline, cached up front so it works even before
// every screen has been opened once.
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-512.png',
  'css/style.css',
  'js/app.js', 'js/content.js', 'js/path.js', 'js/pinyin.js', 'js/pitch-view.js',
  'js/speech.js', 'js/store.js', 'js/tone-grade.js', 'js/update.js',
  'vendor/ts-fsrs.mjs',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Revalidate with the server so a deploy never mixes old and new modules.
  const req = e.request.mode === 'navigate' ? e.request : new Request(e.request.url, { cache: 'no-cache' });
  e.respondWith(
    fetch(req)
      .then(res => {
        // Only cache real pages: a 404 or server error must never replace a good cached copy.
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        }
        return caches.match(e.request, { ignoreSearch: true }).then(hit => hit || res);
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
