// Side-by-side pitch picture for phrases: the expected melody (left) next to your voice (right).
// The browser can't give us the pitch of its own text-to-speech, so the model is drawn from the
// pinyin tones, with the everyday tone changes applied, on Chao's 1 (low) – 5 (high) scale.
import { segment } from './pinyin.js';

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

// Chao 1–5 → semitones around the middle of the voice (about 2.5 semitones per step).
const chaoToSt = c => (c - 3) * 2.5;

// Draws the model (left) and `contour` (right, semitones around your median, nulls = unvoiced).
// With hideModel, the left panel stays blank (so a Speak card doesn't give the answer away).
export function drawCompare(canvas, py, contour, { hideModel = false } = {}) {
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

  // Model: one coloured stroke per syllable, with small gaps between syllables.
  const syl = hideModel ? [] : modelContour(py);
  if (hideModel) {
    ctx.fillStyle = col('--muted');
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Shown with the answer', left + panelW / 2, mid + 7);
  }
  const total = syl.reduce((a, s) => a + s.w, 0) || 1;
  const unit = panelW / total;
  const pad = Math.min(8, unit * 0.12);
  let x = left;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
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

  // You: your pitch, centred on your own average so only the shape matters.
  const voiced = contour.filter(v => v !== null);
  if (voiced.length < 2) {
    ctx.fillStyle = col('--muted');
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
