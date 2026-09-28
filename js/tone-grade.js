// Decides which tone a pitch contour sounds like: a single syllable, or a two-syllable word.
// Input: cleaned contour in semitones around the speaker's median (see cleanContour), nulls = unvoiced.

const N = 10;

function resample(contour) {
  const v = contour.filter(x => x !== null);
  if (v.length < 8) return null;
  const out = [];
  for (let i = 0; i < N; i++) {
    const seg = v.slice(Math.floor((i * v.length) / N), Math.floor(((i + 1) * v.length) / N));
    out.push(seg.reduce((a, b) => a + b, 0) / seg.length);
  }
  return out;
}

// Returns 1–4, or null when there isn't enough voice to judge.
export function classifyTone(contour) {
  const p = resample(contour);
  if (!p) return null;
  const start = (p[0] + p[1]) / 2, end = (p[N - 2] + p[N - 1]) / 2;
  const min = Math.min(...p), max = Math.max(...p);
  const at = p.indexOf(min);
  if (max - min < 2.2) return 1;                                              // level
  if (at >= 2 && at <= N - 3 && start - min >= 1 && end - min >= 1.5) return 3; // dip then rise
  if (end - start >= 2) return 2;                                             // rising
  if (start - end >= 2) return 4;                                             // falling
  return 1;
}

// ---------- Tone pairs ----------

// Splits a two-syllable contour between the syllables: preferably where the voice breaks (most
// words have a consonant there that stops it briefly) or the pitch jumps, near the middle.
// Returns [first, second] as arrays of voiced values, or null when there isn't enough voice.
export function splitSyllables(contour) {
  const idx = contour.map((v, i) => (v === null ? -1 : i)).filter(i => i >= 0);
  if (idx.length < 10) return null;
  let cut = -1, best = -Infinity;
  for (let k = 3; k <= idx.length - 3; k++) {
    const share = k / idx.length;
    if (share < 0.25 || share > 0.75) continue;
    const gap = Math.min(idx[k] - idx[k - 1] - 1, 8);
    const jump = Math.abs(contour[idx[k]] - contour[idx[k - 1]]);
    const score = gap + 0.5 * jump - 4 * Math.abs(share - 0.5);
    if (score > best) { best = score; cut = k; }
  }
  const vals = idx.map(i => contour[i]);
  return [vals.slice(0, cut), vals.slice(cut)];
}

const avg = v => v.reduce((a, b) => a + b, 0) / v.length;

function features(v) {
  const q = Math.max(2, Math.round(v.length / 3));
  const start = avg(v.slice(0, q)), end = avg(v.slice(-q));
  const early = v.slice(0, Math.max(2, Math.ceil(v.length * 0.7)));
  return {
    start, end, mean: avg(v),
    rise: end - Math.min(...early),                              // climbs to the end
    fall: Math.max(...v.slice(0, Math.ceil(v.length / 2))) - end, // drops from the first half
  };
}

// Checks each syllable of a two-syllable word against the tone it should have: [ok1, ok2], or
// null when there isn't enough voice. `tones` are the spoken tones (a 3rd tone before a 3rd is
// given as 2). Rules rather than a tone guess, since in real speech the two syllables pull on
// each other: a 1st tone only has to be level and not lower than its neighbour (or the end of a
// 4th before it), and a 3rd before another tone only has to sit lower than the other syllable.
// Measured on recorded native speech this accepts about 80–85% of correctly said syllables and
// about 20% of wrong ones, so it's a guide rather than an exact judge.
export function checkPair(contour, tones) {
  const parts = splitSyllables(contour);
  if (!parts || parts.some(p => p.length < 3)) return null;
  const f = parts.map(features);
  return tones.map((t, i) => {
    const s = f[i], o = f[1 - i];
    if (t === 4) return s.fall >= 2;
    if (t === 2) return s.rise >= 1.5 && s.fall < 2;
    if (t === 1) return Math.abs(s.end - s.start) <= 2 && s.mean >= (tones[1 - i] === 4 ? o.end : o.mean) - 1;
    return s.mean <= o.mean - 1 && (i === 1 || s.end - s.start <= 1); // 3rd: low
  });
}
