// Update checks. Whenever the app is opened or brought back from the background, it asks the
// server whether any of its files changed since this copy loaded (a HEAD request per file,
// comparing ETag / Last-Modified), so there's no version number to remember to bump.

// Keep in step with CORE in sw.js.
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'css/style.css',
  'js/app.js', 'js/content.js', 'js/path.js', 'js/pinyin.js', 'js/pitch-view.js',
  'js/speech.js', 'js/store.js', 'js/tone-grade.js', 'js/update.js',
  'vendor/ts-fsrs.mjs', 'sw.js', 'audio/manifest.json',
];
const MIN_GAP = 60 * 1000; // don't re-check more often than this when switching apps a lot

const fingerprint = headers => headers.get('etag') || headers.get('last-modified') || headers.get('content-length') || '';

// null when offline or the server didn't answer properly.
async function serverSignature() {
  try {
    const parts = await Promise.all(FILES.map(async f => {
      const res = await fetch(f, { method: 'HEAD', cache: 'no-store' }); // HEAD skips the service worker
      if (!res.ok) throw new Error(res.status);
      return fingerprint(res.headers);
    }));
    return parts.join('|');
  } catch { return null; }
}

// The signature of the copies the service worker has cached, i.e. what an offline start ran.
async function cachedSignature() {
  try {
    const parts = await Promise.all(FILES.map(async f => {
      const hit = await caches.match(f, { ignoreSearch: true });
      if (!hit) throw new Error('not cached');
      return fingerprint(hit.headers);
    }));
    return parts.join('|');
  } catch { return null; }
}

// status: 'checking' | 'current' | 'available' | 'offline'
export const update = { status: 'checking', checkedAt: null };

let running = null;    // signature of the files this page loaded
let lastCheck = 0;
let inFlight = null;
let listener = () => {};

function set(status) {
  update.status = status;
  if (status !== 'checking') update.checkedAt = new Date();
  listener(update);
}

export function checkForUpdate({ force = false } = {}) {
  if (inFlight) return inFlight;
  if (!force && Date.now() - lastCheck < MIN_GAP) return Promise.resolve(update);
  set('checking');
  inFlight = (async () => {
    const now = await serverSignature();
    lastCheck = Date.now();
    navigator.serviceWorker?.getRegistration().then(r => r?.update()).catch(() => {});
    if (now === null) set('offline');
    else if (running === null) { running = now; set('current'); } // first successful check
    else set(now === running ? 'current' : 'available');
    return update;
  })().finally(() => { inFlight = null; });
  return inFlight;
}

// Checks now, and again whenever the app comes back to the foreground (a Home Screen app is
// usually resumed from memory rather than restarted, so "opened" mostly means this).
export async function startUpdateChecks(onChange) {
  listener = onChange;
  // Online, the service worker has just fetched fresh files, so the server's current signature
  // is what's running. Offline, it ran the cached copies: compare against those once back online.
  const offlineStart = !navigator.onLine;
  if (offlineStart) running = await cachedSignature();
  checkForUpdate({ force: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
  window.addEventListener('pageshow', e => { if (e.persisted) checkForUpdate(); });
  window.addEventListener('online', () => checkForUpdate({ force: true }));
}

// Re-downloads every file past the browser's HTTP cache (which also refreshes the service
// worker's offline copy). Reports progress as onProgress(done, total) and returns whether every
// file arrived; the caller reloads. Nothing is thrown away before that, so failing offline is harmless.
export async function downloadUpdate(onProgress = () => {}) {
  let done = 0;
  onProgress(0, FILES.length);
  const ok = await Promise.all(FILES.map(f => fetch(f, { cache: 'reload' })
    .then(r => r.ok, () => false)
    .then(good => { onProgress(++done, FILES.length); return good; })));
  if (!ok.every(Boolean)) return false;
  try { await (await navigator.serviceWorker?.getRegistration())?.update(); } catch {}
  return true;
}
