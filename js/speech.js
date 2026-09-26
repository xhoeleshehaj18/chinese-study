// Audio helpers: text-to-speech, speech recognition, recording, pitch tracking.

let voice = null;
let rate = 0.85;

function pickVoice() {
  const voices = speechSynthesis.getVoices().filter(v => /^zh[-_](CN|Hans)/i.test(v.lang) || v.lang === 'zh');
  const preferred = voices.find(v => /tingting|婷婷|xiaoxiao|google.*(普通话|mandarin)/i.test(v.name));
  voice = preferred || voices.find(v => v.localService) || voices[0] || null;
}

export function initTTS(onVoices) {
  if (!('speechSynthesis' in window)) return;
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', () => { pickVoice(); onVoices?.(); });
  // Some browsers load voices late without firing voiceschanged, so poll briefly too.
  let tries = 0;
  const poll = setInterval(() => {
    pickVoice();
    if (voice || ++tries > 20) { clearInterval(poll); onVoices?.(); }
  }, 250);
}

export function hasChineseVoice() {
  return 'speechSynthesis' in window && !!voice;
}

export function setRate(r) { rate = r; }

export function speak(text, { slow = false } = {}) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  speechSynthesis.cancel();
  // Strip the "…" placeholders used in pattern phrases like 我叫…
  const clean = text.replace(/[…]/g, '').replace(/\s*\/\s*/g, '，');
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = 'zh-CN';
  if (voice) u.voice = voice;
  u.rate = slow ? Math.max(0.5, rate - 0.3) : rate;
  return new Promise(res => {
    u.onend = u.onerror = () => res();
    speechSynthesis.speak(u);
  });
}

// ---------- Speech recognition ----------

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canRecognize = !!SR;

// Resolves with an array of candidate transcripts (best first).
export function recognize() {
  return new Promise((resolve, reject) => {
    if (!SR) return reject(new Error('unsupported'));
    speechSynthesis?.cancel();
    const r = new SR();
    r.lang = 'zh-CN';
    r.interimResults = false;
    r.maxAlternatives = 5;
    let done = false;
    r.onresult = e => {
      done = true;
      const alts = [];
      for (const res of e.results) for (const a of res) alts.push(a.transcript);
      resolve(alts);
    };
    r.onerror = e => { done = true; reject(new Error(e.error || 'error')); };
    r.onend = () => { if (!done) resolve([]); };
    r.start();
  });
}

const PUNCT = /[\s，。！？、,.!?…；;：:"“”'‘’（）()—\-]/g;
const norm = s => s.replace(PUNCT, '');

// Score how closely a transcript matches the target (0–1), by longest common subsequence.
export function matchScore(target, heard) {
  const options = target.split('/').map(norm).filter(Boolean);
  const h = norm(heard);
  let best = 0;
  for (const t of options) {
    if (!t.length) continue;
    const dp = Array(h.length + 1).fill(0);
    for (const tc of t) {
      let prev = 0;
      for (let j = 1; j <= h.length; j++) {
        const tmp = dp[j];
        dp[j] = tc === h[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]);
        prev = tmp;
      }
    }
    const lcs = dp[h.length];
    best = Math.max(best, (2 * lcs) / (t.length + h.length));
  }
  return best;
}

// ---------- Recording (for comparing your voice with the model) ----------

let stream = null;
async function getStream() {
  if (stream && stream.active) return stream;
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true } });
  return stream;
}
export function releaseMic() {
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
}

export const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

// Records for `ms` milliseconds (or until stop() is called). Returns { done: Promise<url>, stop }.
export async function record(ms = 4000) {
  const s = await getStream();
  const rec = new MediaRecorder(s);
  const chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const done = new Promise(res => {
    rec.onstop = () => res(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })));
  });
  rec.start();
  const timer = setTimeout(() => rec.state !== 'inactive' && rec.stop(), ms);
  return {
    done,
    stop() { clearTimeout(timer); if (rec.state !== 'inactive') rec.stop(); },
  };
}

// ---------- Pitch tracking ----------

let audioCtx = null;

// Averages every `f` samples. Voice pitch (70–450 Hz) survives easily at ~16 kHz,
// and the autocorrelation below gets about 9× cheaper, which matters on a phone at 60 frames a second.
function decimate(buf, f) {
  if (f === 1) return buf;
  const out = new Float32Array(Math.floor(buf.length / f));
  for (let i = 0; i < out.length; i++) {
    let s = 0;
    for (let k = 0; k < f; k++) s += buf[i * f + k];
    out[i] = s / f;
  }
  return out;
}

export function detectPitch(input, inputRate) {
  let rms = 0;
  for (let i = 0; i < input.length; i++) rms += input[i] * input[i];
  rms = Math.sqrt(rms / input.length);
  if (rms < 0.012) return null;

  const f = Math.max(1, Math.floor(inputRate / 16000));
  const buf = decimate(input, f);
  const sampleRate = inputRate / f;

  const minLag = Math.floor(sampleRate / 450);
  const maxLag = Math.floor(sampleRate / 70);
  const n = buf.length - maxLag;
  let best = -1, bestLag = -1;
  const corr = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let sum = 0, e1 = 0, e2 = 0;
    for (let i = 0; i < n; i++) {
      sum += buf[i] * buf[i + lag];
      e1 += buf[i] * buf[i];
      e2 += buf[i + lag] * buf[i + lag];
    }
    corr[lag] = sum / Math.sqrt(e1 * e2 || 1);
  }
  // First strong peak avoids octave errors.
  const peak = Math.max(...corr.slice(minLag, maxLag + 1));
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (corr[lag] > 0.9 * peak && corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1]) {
      best = corr[lag]; bestLag = lag; break;
    }
  }
  if (bestLag < 0 || best < 0.6) return null;
  // Parabolic interpolation for sub-sample accuracy.
  const a = corr[bestLag - 1], b = corr[bestLag], c = corr[bestLag + 1];
  const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  return sampleRate / (bestLag + shift);
}

// Tracks pitch for up to `ms` milliseconds. onFrame(hzOrNull, values) is called ~60×/s.
// Options: silenceMs stops early once you've spoken and then gone quiet for that long;
// signal (an AbortSignal) stops on demand.
// Resolves with the array of Hz values (null where unvoiced) and a recording URL.
export async function trackPitch(ms, onFrame, { silenceMs = 0, signal } = {}) {
  const s = await getStream();
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  const src = audioCtx.createMediaStreamSource(s);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  src.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  const values = [];
  const recording = canRecord ? await record(ms) : null;
  const start = performance.now();
  let lastVoice = null;
  await new Promise(res => {
    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      const hz = detectPitch(buf, audioCtx.sampleRate);
      const now = performance.now();
      if (hz) lastVoice = now;
      values.push(hz);
      onFrame?.(hz, values);
      const quiet = silenceMs && lastVoice !== null && now - lastVoice > silenceMs;
      if (now - start < ms && !quiet && !signal?.aborted) requestAnimationFrame(tick);
      else res();
    };
    tick();
  });
  src.disconnect();
  recording?.stop();
  const url = recording ? await recording.done : null;
  return { values, url };
}

// Keep the voiced part, drop isolated blips, convert to semitones around the median.
export function cleanContour(values) {
  let first = values.findIndex(v => v);
  let last = values.length - 1 - [...values].reverse().findIndex(v => v);
  if (first < 0) return [];
  const seg = values.slice(first, last + 1);
  const voiced = seg.filter(Boolean).sort((a, b) => a - b);
  if (voiced.length < 5) return [];
  const median = voiced[Math.floor(voiced.length / 2)];
  const st = seg.map(v => (v ? 12 * Math.log2(v / median) : null));
  // Remove octave jumps and outliers (> 9 semitones from median), then smooth.
  const filtered = st.map(v => (v !== null && Math.abs(v) < 9 ? v : null));
  return filtered.map((v, i) => {
    if (v === null) return null;
    const win = filtered.slice(Math.max(0, i - 2), i + 3).filter(x => x !== null);
    win.sort((a, b) => a - b);
    return win[Math.floor(win.length / 2)];
  });
}
