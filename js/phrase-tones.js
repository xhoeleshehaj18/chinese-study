// Phrases for the "Hear tones in phrases" stage: the words and example sentences from the
// phrase units, split into syllables with the tone each one is actually spoken with.
import { UNITS } from './content.js';
import { modelContour } from './pitch-view.js';

// Each level asks for more tones in longer phrases (length in syllables). The stage moves up a
// level at the pass mark, and passes at the pass mark on the last level.
export const PHRASE_LEVELS = [
  { blanks: 1, min: 2, max: 4, label: 'One tone in a short phrase' },
  { blanks: 2, min: 3, max: 6, label: 'Two tones in a phrase' },
  { blanks: 3, min: 5, max: Infinity, label: 'Three tones in a longer phrase' },
  { blanks: Infinity, min: 2, max: Infinity, label: 'Every tone in the phrase' },
];

const PLAIN = { ā: 'a', á: 'a', ǎ: 'a', à: 'a', ē: 'e', é: 'e', ě: 'e', è: 'e', ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o', ū: 'u', ú: 'u', ǔ: 'u', ù: 'u', ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü' };

export function toneless(s) {
  return [...s].map(c => {
    const low = PLAIN[c.toLowerCase()];
    return !low ? c : c === c.toLowerCase() ? low : low.toUpperCase();
  }).join('');
}

const hanCount = s => (s.match(/\p{Script=Han}/gu) || []).length;

// [{ zh, py, en, syl: [{ text, said, tone, ask, ... }] }], `tone` being the spoken tone.
// A syllable isn't asked (ask = false) when its spoken tone depends on phrasing: in a run of
// three or more 3rd tones, which ones become 2nd tones depends on how the speaker groups the
// words (我很好 is wó hén hǎo or wǒ hén hǎo). The last of such a run always stays 3rd, so it's asked.
function build() {
  const seen = new Set();
  const out = [];
  const add = (zh, py, en) => {
    if (seen.has(zh) || /[A-Za-z…/]/.test(zh)) return;
    const syl = modelContour(py);
    // Skip anything where the pinyin doesn't line up one syllable per character (e.g. erhua).
    if (syl.length < 2 || syl.length !== hanCount(zh)) return;
    seen.add(zh);
    const third = s => s.tone === 3 || s.said !== s.text; // 3rd tone in the dictionary
    for (let i = 0; i < syl.length;) {
      let j = i;
      while (j + 1 < syl.length && third(syl[j]) && third(syl[j + 1]) && !syl[j + 1].pauseBefore) j++;
      for (let k = i; k <= j; k++) syl[k].ask = j - i < 2 || k === j;
      i = j + 1;
    }
    out.push({ zh, py, en, syl });
  };
  for (const u of UNITS) for (const it of u.items) { add(it.zh, it.py, it.en); add(...it.ex); }
  return out;
}

export const PHRASES = build();

export function phrasesFor(level) {
  const L = PHRASE_LEVELS[level - 1];
  return PHRASES.filter(p => p.syl.length >= L.min && p.syl.length <= L.max &&
    p.syl.filter(s => s.ask).length >= (L.blanks === Infinity ? 2 : L.blanks));
}

// Picks up to `n` of `items` without repeats, favouring heavier ones.
export function weightedSample(items, weightOf, n) {
  const pool = items.map(x => ({ x, w: weightOf(x) }));
  const out = [];
  while (out.length < n && pool.length) {
    let r = Math.random() * pool.reduce((a, b) => a + b.w, 0);
    let i = pool.findIndex(p => (r -= p.w) < 0);
    if (i === -1) i = pool.length - 1;
    out.push(pool.splice(i, 1)[0].x);
  }
  return out;
}

const MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };

// Puts tone `t` (1–4; 5 = neutral, no mark) on a toneless syllable, on the vowel pinyin marks:
// a or e if there is one, the o of "ou", otherwise the last vowel.
export function withTone(plain, t) {
  const low = plain.toLowerCase();
  let i = low.search(/[ae]/);
  if (i < 0) i = low.indexOf('ou');
  if (i < 0) i = Math.max(...[...'iouü'].map(v => low.lastIndexOf(v)));
  if (t === 5 || i < 0) return plain;
  const m = MARKS[low[i]][t - 1];
  return plain.slice(0, i) + (plain[i] === low[i] ? m : m.toUpperCase()) + plain.slice(i + 1);
}
