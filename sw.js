// Network-first service worker: always fetch the latest version when online,
// fall back to the cached copy when offline.
// Bump this when CORE changes (and keep FILES in js/update.js in step).
const CACHE = 'shuo-zhongwen-v7';
// Voice clips are named by a hash of their text, so a cached clip never goes stale. They live in
// their own cache that survives app updates; clips no longer in the manifest are pruned.
const AUDIO = 'shuo-zhongwen-audio';

// Everything the app needs to run offline, cached up front so it works even before
// every screen has been opened once.
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-512.png',
  'css/style.css',
  'js/app.js', 'js/content.js', 'js/path.js', 'js/phrase-tones.js', 'js/pinyin.js', 'js/pitch-view.js',
  'js/speech.js', 'js/store.js', 'js/tone-grade.js', 'js/update.js',
  'vendor/ts-fsrs.mjs', 'audio/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== AUDIO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => { cacheClips(); }) // in the background: activation shouldn't wait for ~7 MB
  );
});

// Downloads every clip not cached yet, a few at a time, so the voice works offline.
async function cacheClips() {
  try {
    const manifest = await (await fetch('audio/manifest.json', { cache: 'no-cache' })).json();
    const wanted = new Set(Object.values(manifest).map(f => new URL(`audio/${f}`, self.registration.scope).href));
    const cache = await caches.open(AUDIO);
    for (const req of await cache.keys()) if (!wanted.has(req.url)) await cache.delete(req);
    const have = new Set((await cache.keys()).map(r => r.url));
    const todo = [...wanted].filter(u => !have.has(u));
    const worker = async () => {
      for (let url; (url = todo.pop());) {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  } catch {} // offline: clips are cached as they're played instead, and this runs again next update
}

async function clip(req) {
  const cache = await caches.open(AUDIO);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  const res = await fetch(req.url);
  if (res.ok) cache.put(req.url, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (/\/audio\/[^/]+\.mp3$/.test(new URL(e.request.url).pathname)) return e.respondWith(clip(e.request));
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
