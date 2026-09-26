// Decides which tone a pitch contour sounds like (single syllable, citation form).
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
