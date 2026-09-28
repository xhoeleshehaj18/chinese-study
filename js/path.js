// The course path: one stage at a time, each unlocked only when the previous one is mastered.
import { UNITS } from './content.js';
import { PHRASE_LEVELS } from './phrase-tones.js';
import { NUMBER_LEVELS } from './numbers.js';
import { state, save, today, markStudied, State, KINDS } from './store.js';

// Listening drills pass at 98% of the last 50 answers. Saying tones is judged by an automatic
// pitch tracker, which is itself less accurate than 98%, so those stages pass lower: 90% for
// single syllables, and 80% for tone pairs, where the tracker has to split the word in two first.
// A stage with `levels` (their labels) moves up a level each time it reaches the pass mark, and passes on the last one.
export const STAGES = [
  { id: 'tones', kind: 'drill', emoji: '👂', title: 'Hear the four tones', window: 50, need: 49 },
  { id: 'pairs', kind: 'drill', emoji: '👂', title: 'Hear tone pairs', window: 50, need: 49 },
  { id: 'changes', kind: 'drill', emoji: '👂', title: 'Hear tone changes', window: 50, need: 49 },
  { id: 'phrases', kind: 'drill', emoji: '👂', title: 'Hear tones in phrases', window: 50, need: 49, levels: PHRASE_LEVELS.map(l => l.label) },
  { id: 'sounds', kind: 'drill', emoji: '👂', title: 'Hear tricky sounds', window: 50, need: 49 },
  { id: 'say', kind: 'drill', emoji: '🗣', title: 'Say the four tones', window: 50, need: 45 },
  { id: 'saypairs', kind: 'drill', emoji: '🗣', title: 'Say tone pairs', window: 50, need: 40 },
  ...UNITS.map(u => ({ id: u.id, kind: 'unit', emoji: u.emoji, title: u.title, unit: u })),
];
// Numbers come right after the unit that teaches 1–10.
STAGES.splice(STAGES.findIndex(s => s.id === 'u3') + 1, 0,
  { id: 'numbers', kind: 'drill', emoji: '👂', title: 'Catch the numbers', window: 50, need: 49, levels: NUMBER_LEVELS.map(l => l.label) });

// Stages whose questions can be mixed into the daily warm-up: the listening drills.
export const LISTENING = ['tones', 'pairs', 'changes', 'phrases', 'sounds', 'numbers'];

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

// The level you're working on (1-based). A passed or skipped stage is practised at its top level.
export function levelOf(stage) {
  if (!stage.levels) return 1;
  return isPassed(stage) ? stage.levels.length : Math.min(state.path.level[stage.id] || 1, stage.levels.length);
}

export function passStage(stage) {
  state.path.passed[stage.id] = today();
  if (stage === currentStage()) state.path.stage++;
  save();
}

// Drills lean towards what you get wrong. Each miss makes that item (a tone, a word, a sound
// contrast) come up more often, up to 4× as often; each right answer slowly brings it back to normal.
const missesFor = stage => (state.path.miss[stage.id] ||= {});
let lastBatch = null; // the last question's answers, for undo

export const missWeight = (stage, key) => 1 + (missesFor(stage)[key] || 0);

export function weightedPick(stage, options, keyOf) {
  const weights = options.map(o => missWeight(stage, keyOf(o)));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  return options.find((_, i) => (r -= weights[i]) < 0) ?? options[options.length - 1];
}

function noteMiss(stage, key, correct) {
  const m = missesFor(stage);
  const prev = m[key] || 0;
  lastBatch.misses.push({ key, prev });
  const next = correct ? Math.max(0, prev - 0.5) : Math.min(3, prev + 1);
  if (next) m[key] = next;
  else delete m[key];
}

// Records one drill answer. `key` names what was asked, for weighting.
// Returns true when this answer passed the current stage.
export function recordAnswer(stage, correct, key) {
  return recordAnswers(stage, [{ correct, key }]) === 'passed';
}

// Records several answers from one question (e.g. each tone in a phrase).
// Returns 'passed' when they passed the current stage, 'level' when they finished a level.
export function recordAnswers(stage, answers) {
  const h = (state.path.hist[stage.id] ||= []);
  lastBatch = { stage, n: answers.length, misses: [] };
  for (const { correct, key } of answers) {
    h.push(correct ? 1 : 0);
    if (key !== undefined) noteMiss(stage, key, correct);
  }
  if (h.length > stage.window) h.splice(0, h.length - stage.window);
  markStudied();
  save();
  if (stage !== currentStage() || !gateStatus(stage).met) return null;
  if (stage.levels && levelOf(stage) < stage.levels.length) {
    state.path.level[stage.id] = levelOf(stage) + 1;
    state.path.hist[stage.id] = []; // each level starts its count afresh
    save();
    return 'level';
  }
  passStage(stage);
  return 'passed';
}

// Takes back the last question's answers (all its parts).
export function undoLastAnswer(stage) {
  if (lastBatch?.stage !== stage) return;
  state.path.hist[stage.id]?.splice(-lastBatch.n);
  const m = missesFor(stage);
  for (const { key, prev } of lastBatch.misses.reverse()) {
    if (prev) m[key] = prev;
    else delete m[key];
  }
  lastBatch = null;
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
