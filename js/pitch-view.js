// Side-by-side pitch picture for phrases: the model melody (left) next to your voice (right).
// The model is the native voice's own pitch, measured from its clip (see clipPitch in speech.js)
// and split into syllables so each can be coloured by its tone. For text without a clip (or
// before it has loaded) the melody is drawn from the pinyin tones instead, with the everyday
// tone changes applied, on Chao's 1 (low) – 5 (high) scale.
import { segment } from './pinyin.js';
import { cleanContour, clipPitch } from './speech.js';

const HALF_THIRD = [[0, 2], [1, 1]];          // 3rd tone before another tone: just low
const FULL = {
  1: [[0, 5], [1, 5]],
  2: [[0, 3], [1, 5]],
  3: [[0, 2], [0.5, 1], [1, 3.5]],             // 3rd tone before a pause: dips and comes back up
  4: [[0, 5], [1, 1]],
};
// A neutral tone is short, and its height depends on the tone before it.
const NEUTRAL_AFTER = { 1: [[0, 2.5], [1, 2]], 2: [[0, 3], [1, 2.5]], 3: [[0, 3.5], [1, 3.5]], 4: [[0, 2], [1, 1]] };
const NEUTRAL_WIDTH = 0.55;

const TO_SECOND = { ǎ: 'á', ě: 'é', ǐ: 'í', ǒ: 'ó', ǔ: 'ú', ǚ: 'ǘ', Ǎ: 'Á', Ě: 'É', Ǐ: 'Í', Ǒ: 'Ó', Ǔ: 'Ú', Ǚ: 'Ǘ' };
const PAUSE = /[，,。.!?！？—…;；:：]/;

// Returns [{ text, said, tone, pts, w, pauseBefore }] per syllable, where tone is the tone actually spoken.
export function modelContour(py) {
  const syl = [];
  let pauseBefore = false;
  for (const s of segment(py.split('/')[0])) {
    if (s.tone === null) { if (PAUSE.test(s.text)) pauseBefore = true; continue; }
    syl.push({ text: s.text, tone: s.tone, pauseBefore });
    pauseBefore = false;
  }
  // Two or more 3rd tones in a row (without a pause): all but the last are said as 2nd tones.
  for (let i = 0; i < syl.length - 1; i++) {
    if (syl[i].tone === 3 && syl[i + 1].tone === 3 && !syl[i + 1].pauseBefore) syl[i].said = 2;
  }
  return syl.map((s, i) => {
    const tone = s.said || s.tone;
    const next = syl[i + 1];
    const prev = syl[i - 1];
    let pts;
    if (tone === 5) pts = NEUTRAL_AFTER[prev && !s.pauseBefore ? (prev.said || prev.tone) : 0] || [[0, 3], [1, 2.5]];
    else if (tone === 3 && next && !next.pauseBefore) pts = HALF_THIRD;
    else pts = FULL[tone];
    const said = s.said ? [...s.text].map(c => TO_SECOND[c] || c).join('') : s.text;
    return { text: s.text, said, tone, pts, w: tone === 5 ? NEUTRAL_WIDTH : 1, pauseBefore: s.pauseBefore };
  });
}

// Syllables whose tone changes in speech: [{ text: 'nǐ', said: 'ní', sure }]. In a run of three
// or more 3rd tones only the one before the last always changes; whether the earlier ones do
// depends on how the speaker groups the words (我很好 is wó hén hǎo or wǒ hén hǎo), so they
// aren't `sure`.
export function toneChanges(py) {
  const syl = modelContour(py);
  return syl.flatMap((s, i) => (s.said === s.text ? []
    : [{ text: s.text, said: s.said, sure: syl[i + 1].said === syl[i + 1].text }]));
}

// ---------- The native voice's melody ----------

// Resolves with the native voice's melody for `zh` (see clipModel), or null when it has no usable
// clip. Text with alternatives (他 / 她) is said as a list, which wouldn't line up with its pinyin.
export function loadModel(zh, py) {
  if (zh.includes('/')) return Promise.resolve(null);
  return clipPitch(zh).then(frames => clipModel(py, frames));
}

const QUIET = 0.15;

// Turns a clip's frames (from clipPitch) into { contour, syl }: the pitch in semitones around the
// voice's median (nulls = unvoiced), and the syllables of `py` (as modelContour gives them) with
// the frames [from, to) each one covers. Null when the clip has too little voice to use.
export function clipModel(py, frames) {
  if (!frames) return null;
  // Frames far quieter than the rest (the voice fading out, where the pitch tracker slips) count
  // as unvoiced: Safari's decoder leaves a faint tail that otherwise reads as a sudden rise.
  const peak = Math.max(...frames.rms);
  const hz = frames.hz.map((v, i) => (frames.rms[i] >= QUIET * peak ? v : null));
  const first = hz.findIndex(v => v);
  let last = hz.length - 1;
  while (last > first && !hz[last]) last--;
  if (first < 0) return null;
  const contour = cleanContour(hz.slice(first, last + 1));
  // Drop blips of voice under 3 frames (a creak at the end, say): they'd pass for syllables.
  for (let i = 0; i < contour.length;) {
    let j = i;
    while (j < contour.length && contour[j] !== null) j++;
    if (j - i < 3) contour.fill(null, i, j);
    i = j + 1;
  }
  const syl = modelContour(py);
  if (!syl.length || contour.filter(v => v !== null).length < 2) return null;
  const cuts = splitClip(contour, frames.rms.slice(first, last + 1), syl.map(s => s.w));
  if (!cuts) return null;
  return { contour, syl: syl.map((s, i) => ({ ...s, from: cuts[i], to: cuts[i + 1] })) };
}

// Finds where each syllable starts, as frame indices [0, c1, …, n]. Syllables usually meet at a dip
// in loudness (a consonant, a pause), and each gets a share of the voiced frames in proportion to
// its expected length (a neutral tone is short). A dynamic programme weighs the two.
function splitClip(contour, rms, weights) {
  const n = contour.length, k = weights.length;
  if (k === 1) return [0, n];
  // Loudness, lightly smoothed, from 0 (silent) to 1 (loudest frame); unvoiced frames count as silent.
  const loud = rms.map((_, i) => (contour[i] === null ? 0 : (rms[i - 1] ?? rms[i]) + rms[i] + (rms[i + 1] ?? rms[i])));
  const top = Math.max(...loud) || 1;
  for (let i = 0; i < n; i++) loud[i] /= top;
  const voicedBefore = [0];
  for (let i = 0; i < n; i++) voicedBefore.push(voicedBefore[i] + (contour[i] === null ? 0 : 1));
  const total = voicedBefore[n];
  const wsum = weights.reduce((a, b) => a + b, 0);
  if (total < 2 * k) return null;
  const lengthCost = (j, a, b) => {
    const want = (weights[j] / wsum) * total;
    const got = voicedBefore[b] - voicedBefore[a];
    // A neutral tone can be almost voiceless (the shi of 认识), but a full tone can't.
    return ((got - want) / want) ** 2 + (weights[j] === 1 && got < 3 ? 2 : 0);
  };
  // cost[j][c]: best cost with syllables 0…j-1 covering frames [0, c); from[j][c] is the previous cut.
  const cost = Array.from({ length: k + 1 }, () => new Float64Array(n + 1).fill(Infinity));
  const from = Array.from({ length: k + 1 }, () => new Int32Array(n + 1));
  cost[0][0] = 0;
  for (let j = 1; j <= k; j++) {
    for (let c = j; c <= n - (k - j); c++) {
      if (j < k && c === n) continue;
      const cut = j < k ? 3 * loud[c] : 0;
      for (let a = j - 1; a < c; a++) {
        const v = cost[j - 1][a] + lengthCost(j - 1, a, c) + cut;
        if (v < cost[j][c]) { cost[j][c] = v; from[j][c] = a; }
      }
    }
  }
  if (!isFinite(cost[k][n])) return null;
  const cuts = [n];
  for (let j = k, c = n; j > 0; j--) cuts.unshift(c = from[j][c]);
  return cuts;
}

// Chao 1–5 → semitones around the middle of the voice (about 2.5 semitones per step).
const chaoToSt = c => (c - 3) * 2.5;

// Draws the model (left) and `contour` (right, semitones around your median, nulls = unvoiced).
// `model` is the native voice's melody from clipModel; without it the melody is drawn from the pinyin.
// With hideModel, the left panel stays blank (so a Speak card doesn't give the answer away).
export function drawCompare(canvas, py, contour, { hideModel = false, model = null } = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const css = getComputedStyle(document.body);
  const col = name => css.getPropertyValue(name).trim();
  const gap = 20, top = 44, bottom = 46, side = 16;
  const panelW = (W - gap) / 2 - side * 2;
  const left = side, right = W / 2 + gap / 2 + side;
  const mid = top + (H - top - bottom) / 2;
  const y = st => mid - (Math.max(-8, Math.min(8, st)) / 8) * ((H - top - bottom) / 2);

  ctx.clearRect(0, 0, W, H);
  // Divider, guide lines and panel titles.
  ctx.strokeStyle = col('--line');
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2, 12); ctx.lineTo(W / 2, H - 12); ctx.stroke();
  ctx.lineWidth = 1;
  for (const x0 of [left, right]) {
    for (const st of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(x0, y(st)); ctx.lineTo(x0 + panelW, y(st)); ctx.stroke(); }
  }
  ctx.fillStyle = col('--muted');
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Model', left, 28);
  ctx.fillText('You', right, 28);

  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (hideModel) {
    ctx.fillStyle = col('--muted');
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Shown with the answer', left + panelW / 2, mid + 7);
  } else if (model) drawClipModel(ctx, model, { left, panelW, y, H, col });
  else drawShapes(ctx, modelContour(py), { left, panelW, y, H, col });

  // You: your pitch, centred on your own average so only the shape matters.
  const voiced = contour.filter(v => v !== null);
  if (voiced.length < 2) {
    ctx.fillStyle = col('--muted');
    ctx.textAlign = 'center';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(contour.length ? 'Listening…' : 'Tap 📈 and speak', right + panelW / 2, mid + 7);
    return;
  }
  // Trim unvoiced frames at both ends so your line fills the panel like the model does.
  const first = contour.findIndex(v => v !== null);
  let last = contour.length - 1;
  while (contour[last] === null) last--;
  const seg = contour.slice(first, last + 1);
  const mean = voiced.reduce((a, b) => a + b, 0) / voiced.length;
  ctx.strokeStyle = col('--ink');
  ctx.lineWidth = 6;
  ctx.beginPath();
  let pen = false;
  seg.forEach((v, i) => {
    if (v === null) { pen = false; return; }
    const X = right + (seg.length > 1 ? i / (seg.length - 1) : 0.5) * panelW, Y = y(v - mean);
    pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    pen = true;
  });
  ctx.stroke();
}

// The melody drawn from the pinyin: one coloured stroke per syllable, with small gaps between them.
function drawShapes(ctx, syl, { left, panelW, y, H, col }) {
  const total = syl.reduce((a, s) => a + s.w, 0) || 1;
  const unit = panelW / total;
  const pad = Math.min(8, unit * 0.12);
  let x = left;
  ctx.textAlign = 'center';
  const labelSize = Math.max(14, Math.min(22, unit * 0.34));
  ctx.font = `${labelSize}px system-ui, sans-serif`;
  const showLabels = unit >= 34;
  for (const s of syl) {
    const w = s.w * unit;
    ctx.strokeStyle = col(`--t${s.tone}`);
    ctx.lineWidth = s.tone === 5 ? 7 : 9;
    ctx.beginPath();
    s.pts.forEach(([px, c], i) => {
      const X = x + pad + px * (w - 2 * pad), Y = y(chaoToSt(c));
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    });
    ctx.stroke();
    if (showLabels) {
      ctx.fillStyle = col(`--t${s.tone}`);
      ctx.fillText(s.said, x + w / 2, H - 16);
    }
    x += w;
  }

}

// The native voice's melody, coloured by each syllable's tone, centred on its average like yours.
function drawClipModel(ctx, { contour, syl }, { left, panelW, y, H, col }) {
  const voiced = contour.filter(v => v !== null);
  const mean = voiced.reduce((a, b) => a + b, 0) / voiced.length;
  const X = i => left + (contour.length > 1 ? i / (contour.length - 1) : 0.5) * panelW;
  ctx.lineWidth = 7;
  for (const s of syl) {
    ctx.strokeStyle = col(`--t${s.tone}`);
    ctx.beginPath();
    // Start from the previous syllable's last point, so the line only breaks where the voice does.
    let pen = false;
    for (let i = Math.max(0, s.from - 1); i < s.to; i++) {
      const v = contour[i];
      if (v === null) { pen = false; continue; }
      pen ? ctx.lineTo(X(i), y(v - mean)) : ctx.moveTo(X(i), y(v - mean));
      pen = true;
    }
    ctx.stroke();
  }
  // Each syllable under the middle of its voiced part, nudged along so labels don't overlap.
  const unit = panelW / syl.reduce((a, s) => a + s.w, 0);
  if (unit < 34) return; // too many syllables to label legibly, as with the drawn melody
  const labelSize = Math.max(14, Math.min(22, unit * 0.34));
  ctx.font = `${labelSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  let edge = -Infinity;
  for (const s of syl) {
    const idx = [];
    for (let i = s.from; i < s.to; i++) if (contour[i] !== null) idx.push(i);
    const centre = idx.length ? (X(idx[0]) + X(idx[idx.length - 1])) / 2 : (X(s.from) + X(Math.max(s.from, s.to - 1))) / 2;
    const half = ctx.measureText(s.said).width / 2;
    const x = Math.max(centre, edge + 6 + half);
    ctx.fillStyle = col(`--t${s.tone}`);
    ctx.fillText(s.said, x, H - 16);
    edge = x + half;
  }
}
