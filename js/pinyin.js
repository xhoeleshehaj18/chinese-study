// Split pinyin into syllables and find each syllable's tone (1–4, 5 = neutral).

const TONED = {
  1: 'āēīōūǖĀĒĪŌŪǕ', 2: 'áéíóúǘÁÉÍÓÚǗ', 3: 'ǎěǐǒǔǚǍĚǏǑǓǙ', 4: 'àèìòùǜÀÈÌÒÙǛ',
};
const V = 'aeiouüvAEIOUÜ' + Object.values(TONED).join('');
const SYL = new RegExp(
  `(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[${V}]+(ng(?![${V}])|n(?![${V}])|r(?![${V}]))?`,
  'gi'
);

export function toneOf(syllable) {
  for (const [t, chars] of Object.entries(TONED)) {
    for (const ch of syllable) if (chars.includes(ch)) return +t;
  }
  return 5;
}

// Returns [{ text, tone }] where tone is null for non-syllable text.
export function segment(py) {
  const out = [];
  let last = 0;
  for (const m of py.matchAll(SYL)) {
    if (m.index > last) out.push({ text: py.slice(last, m.index), tone: null });
    out.push({ text: m[0], tone: toneOf(m[0]) });
    last = m.index + m[0].length;
  }
  if (last < py.length) out.push({ text: py.slice(last), tone: null });
  return out;
}

export function syllables(py) {
  return segment(py).filter(s => s.tone !== null);
}

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function colorPinyin(py) {
  return segment(py)
    .map(s => (s.tone ? `<span class="t${s.tone}">${esc(s.text)}</span>` : esc(s.text)))
    .join('');
}
