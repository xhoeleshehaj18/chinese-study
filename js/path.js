// The course path: one stage at a time, each unlocked only when the previous one is mastered.
import { UNITS } from './content.js';
import { state, save, today, markStudied, State, KINDS } from './store.js';

// Listening drills pass at 98% of the last 50 answers. Saying tones is judged by an automatic
// pitch tracker, which is itself less accurate than 98%, so that stage passes at 90%.
export const STAGES = [
  { id: 'tones', kind: 'drill', emoji: '👂', title: 'Hear the four tones', window: 50, need: 49 },
  { id: 'pairs', kind: 'drill', emoji: '👂', title: 'Hear tone pairs', window: 50, need: 49 },
  { id: 'changes', kind: 'drill', emoji: '👂', title: 'Hear tone changes', window: 50, need: 49 },
  { id: 'sounds', kind: 'drill', emoji: '👂', title: 'Hear tricky sounds', window: 50, need: 49 },
  { id: 'say', kind: 'drill', emoji: '🗣', title: 'Say the four tones', window: 50, need: 45 },
  ...UNITS.map(u => ({ id: u.id, kind: 'unit', emoji: u.emoji, title: u.title, unit: u })),
];

export const stageIndex = s => STAGES.indexOf(s);
export const currentStage = () => STAGES[state.path.stage] || null; // null once the whole course is passed
export const isPassed = s => !!state.path.passed[s.id];
export const isUnlocked = s => stageIndex(s) <= state.path.stage;
export const unlockedUnitIds = () => new Set(STAGES.filter(s => s.kind === 'unit' && isUnlocked(s)).map(s => s.id));

export function gateStatus(stage) {
  const hist = state.path.hist[stage.id] || [];
  const right = hist.reduce((a, b) => a + b, 0);
  return { hist, right, n: hist.length, met: hist.length >= stage.window && right >= stage.need };
}

export function passStage(stage) {
  state.path.passed[stage.id] = today();
  if (stage === currentStage()) state.path.stage++;
  save();
}

// Drills lean towards what you get wrong. Each miss makes that item (a tone, a word, a sound
// contrast) come up more often, up to 4× as often; each right answer slowly brings it back to normal.
const missesFor = stage => (state.path.miss[stage.id] ||= {});
let lastMiss = null; // for undo

export function weightedPick(stage, options, keyOf) {
  const m = missesFor(stage);
  const weights = options.map(o => 1 + (m[keyOf(o)] || 0));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  return options.find((_, i) => (r -= weights[i]) < 0) ?? options[options.length - 1];
}

function noteMiss(stage, key, correct) {
  const m = missesFor(stage);
  const prev = m[key] || 0;
  lastMiss = { stage, key, prev };
  const next = correct ? Math.max(0, prev - 0.5) : Math.min(3, prev + 1);
  if (next) m[key] = next;
  else delete m[key];
}

// Records one drill answer. `key` names what was asked, for weighting.
// Returns true when this answer passed the current stage.
export function recordAnswer(stage, correct, key) {
  const h = (state.path.hist[stage.id] ||= []);
  h.push(correct ? 1 : 0);
  if (h.length > stage.window) h.splice(0, h.length - stage.window);
  if (key !== undefined) noteMiss(stage, key, correct);
  markStudied();
  save();
  if (stage === currentStage() && gateStatus(stage).met) { passStage(stage); return true; }
  return false;
}

export function undoLastAnswer(stage) {
  state.path.hist[stage.id]?.pop();
  if (lastMiss?.stage === stage) {
    const m = missesFor(stage);
    if (lastMiss.prev) m[lastMiss.key] = lastMiss.prev;
    else delete m[lastMiss.key];
    lastMiss = null;
  }
  save();
}

// Where a phrase unit stands. The unit test opens once every phrase is learned and graduated
// from same-day learning, on a later day than the last new phrase, and at most once a day.
export function unitStatus(stage) {
  const items = stage.unit.items;
  const introduced = items.filter(i => state.learned.includes(i.id)).length;
  const graduated = items.every(i => KINDS.every(k => state.cards[`${i.id}:${k}`]?.state === State.Review));
  const learnedToday = state.path.unitIntro[stage.id] === today();
  const triedToday = state.path.testTried[stage.id] === today();
  const questions = items.length * KINDS.length;
  return {
    introduced, total: items.length, graduated, learnedToday, triedToday, questions,
    need: Math.ceil(questions * 0.98),
    testReady: introduced === items.length && graduated && !learnedToday && !triedToday,
  };
}
