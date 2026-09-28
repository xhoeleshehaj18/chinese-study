// Numbers for the "Catch the numbers" stage: how they're said, and a fixed set per level
// (fixed so each one has a recorded clip; tools/make_audio.py reads this file).

const DIGIT_ZH = '零一二三四五六七八九';
const DIGIT_PY = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];

// 1–99 → [zh, pinyin syllables]. 十 alone at the start (十五, not 一十五).
function upTo99(n) {
  if (n < 10) return [DIGIT_ZH[n], [DIGIT_PY[n]]];
  const t = Math.floor(n / 10), u = n % 10;
  const zh = (t > 1 ? DIGIT_ZH[t] : '') + '十' + (u ? DIGIT_ZH[u] : '');
  const py = [...(t > 1 ? [DIGIT_PY[t]] : []), 'shí', ...(u ? [DIGIT_PY[u]] : [])];
  return [zh, py];
}

// 一 is said yì before 百 (3rd tone) and 千 (1st tone). 两 is used for 200.
function upTo999(n) {
  if (n < 100) return upTo99(n);
  const h = Math.floor(n / 100), rest = n % 100;
  let zh = (h === 2 ? '两' : DIGIT_ZH[h]) + '百';
  const py = [h === 1 ? 'yì' : h === 2 ? 'liǎng' : DIGIT_PY[h], 'bǎi'];
  if (!rest) return [zh, py];
  // A gap in the tens is filled with 零 (一百零五); 110 is 一百一十, with the 一 said.
  if (rest < 10) return [zh + '零' + DIGIT_ZH[rest], [...py, 'líng', DIGIT_PY[rest]]];
  const [rz, rp] = upTo99(rest);
  return rest < 20 ? [zh + '一' + rz, [...py, 'yī', ...rp]] : [zh + rz, [...py, ...rp]];
}

// Syllables are spaced out (shí èr), which reads more easily than one long word.
const word = syl => syl.join(' ');

// Prices: whole yuan (块), optionally with tenths said after 块 (三块五 = 3.5). 2 is 两块.
function price(yuan, tenth) {
  // 一 before 块 (4th tone) is said yí.
  let [zh, py] = yuan === 2 ? ['两', ['liǎng']] : yuan === 1 ? ['一', ['yí']] : upTo999(yuan);
  zh += '块';
  py = [word(py), 'kuài'];
  if (tenth) { zh += DIGIT_ZH[tenth]; py.push(DIGIT_PY[tenth]); }
  return { zh, py: py.join(' '), answer: tenth ? `${yuan}.${tenth}` : String(yuan) };
}

// Phone numbers are read digit by digit in groups of 3-4-4, with 1 said yāo (幺).
function phone(digits) {
  const zhOf = d => (d === '1' ? '幺' : DIGIT_ZH[d]);
  const pyOf = d => (d === '1' ? 'yāo' : DIGIT_PY[d]);
  const groups = [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7)];
  return {
    zh: groups.map(g => [...g].map(zhOf).join('')).join('，'),
    py: groups.map(g => [...g].map(pyOf).join(' ')).join(', '),
    answer: digits,
  };
}

// A small fixed pseudo-random generator, so the sets (and their clips) never change.
function rng(seed) {
  return () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
}

function build() {
  const r = rng(20260928);
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const uniq = (make, n) => {
    const out = new Map();
    while (out.size < n) { const x = make(); out.set(x.answer, x); }
    return [...out.values()];
  };
  const num = n => { const [zh, py] = upTo999(n); return { zh, py: word(py), answer: String(n) }; };

  const teens = Array.from({ length: 89 }, (_, i) => num(i + 11));
  // Hundreds: every round hundred, the tricky ones with 零 or 一十, and a spread of the rest.
  const hundreds = [
    ...Array.from({ length: 9 }, (_, i) => num((i + 1) * 100)),
    ...[101, 105, 108, 110, 115, 203, 209, 210, 304, 407, 506, 610, 702, 811, 909].map(num),
    ...uniq(() => num(int(120, 999)), 36),
  ];
  const prices = [
    ...[[2, 0], [2, 5], [3, 5], [5, 0], [8, 8], [10, 0], [12, 0], [15, 5], [20, 0], [22, 0]].map(([y, t]) => price(y, t)),
    ...uniq(() => price(int(1, 99), r() < 0.5 ? int(1, 9) : 0), 26),
    ...uniq(() => price(int(100, 999), 0), 14),
  ];
  const phones = uniq(() => phone('1' + [3, 5, 7, 8, 9][int(0, 4)] + Array.from({ length: 9 }, () => int(0, 9)).join('')), 40);
  return [teens, hundreds, prices, phones];
}

// One list per level of the stage, in the same order as NUMBER_LEVELS.
export const NUMBER_SETS = build();

export const NUMBER_LEVELS = [
  { label: 'Numbers 11–99', keys: '0123456789' },
  { label: 'Hundreds: 100–999', keys: '0123456789' },
  { label: 'Prices in 块', keys: '0123456789.' },
  { label: 'Phone numbers', keys: '0123456789' },
];
