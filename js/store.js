// Progress storage (browser localStorage) and FSRS scheduling.
import { fsrs, generatorParameters, createEmptyCard, Rating, State } from '../vendor/ts-fsrs.mjs';
import { UNITS } from './content.js';

const KEY = 'hanyu-speak-v1';
const scheduler = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true, maximum_interval: 365 }));

export const ITEMS = UNITS.flatMap(u => u.items.map(i => ({ ...i, unit: u.id })));
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
export const KINDS = ['listen', 'speak'];
export { Rating, State };

const defaults = () => ({
  version: 1,
  cards: {},            // "itemId:kind" -> FSRS card
  learned: [],          // item ids in the order they were introduced
  settings: { newPerDay: 5, rate: 0.85, showHanzi: true },
  day: { date: today(), newCount: 0, reviews: 0 },
  streak: { last: null, count: 0 },
  // Stage-by-stage progression (see path.js).
  path: { stage: 0, hist: {}, passed: {}, unitIntro: {}, testTried: {} },
});

export function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const d = defaults();
      return { ...d, ...s, settings: { ...d.settings, ...s.settings }, path: { ...d.path, ...s.path } };
    }
  } catch {}
  return defaults();
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

function rollDay() {
  if (state.day.date !== today()) state.day = { date: today(), newCount: 0, reviews: 0 };
}

export function markStudied() {
  const t = today();
  if (state.streak.last === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  state.streak.count = state.streak.last === today(y) ? state.streak.count + 1 : 1;
  state.streak.last = t;
}

export function currentStreak() {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return state.streak.last === today() || state.streak.last === today(y) ? state.streak.count : 0;
}

// Due card ids, optionally limited to items from the given unit ids.
export function dueCards(units = null, now = new Date()) {
  return Object.entries(state.cards)
    .filter(([id, c]) => new Date(c.due) <= now && (!units || units.has(ITEM_BY_ID[id.split(':')[0]]?.unit)))
    .sort((a, b) => new Date(a[1].due) - new Date(b[1].due))
    .map(([id]) => id);
}

export function newRemainingToday() {
  rollDay();
  return Math.max(0, state.settings.newPerDay - state.day.newCount);
}

// Lets the learner take on extra new phrases today beyond the daily limit.
export function allowExtraNew(n) {
  rollDay();
  state.day.newCount -= n;
  save();
}

export function nextNewItems(n, unitId = null) {
  const learned = new Set(state.learned);
  return ITEMS.filter(i => !learned.has(i.id) && (!unitId || i.unit === unitId)).slice(0, n);
}

export function introduce(itemId) {
  rollDay();
  if (state.learned.includes(itemId)) return;
  state.learned.push(itemId);
  state.day.newCount++;
  state.path.unitIntro[ITEM_BY_ID[itemId].unit] = today();
  const now = new Date();
  for (const k of KINDS) state.cards[`${itemId}:${k}`] = createEmptyCard(now);
  save();
}

export function previewIntervals(cardId, now = new Date()) {
  const preview = scheduler.repeat(state.cards[cardId], now);
  const out = {};
  for (const r of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) out[r] = preview[r].card.due;
  return out;
}

export function grade(cardId, rating, now = new Date()) {
  rollDay();
  const { card } = scheduler.next(state.cards[cardId], now, rating);
  state.cards[cardId] = card;
  state.day.reviews++;
  markStudied();
  save();
  return card;
}

export function formatInterval(due, now = new Date()) {
  const mins = Math.round((new Date(due) - now) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 31) return `${days}d`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months}mo` : `${Math.round(days / 365)}y`;
}

// A card counts as "known" once it has graduated to Review state.
export function stats() {
  const cards = Object.values(state.cards);
  return {
    learned: state.learned.length,
    total: ITEMS.length,
    mature: cards.filter(c => c.state === State.Review && c.stability >= 21).length,
    due: dueCards().length,
  };
}

export function exportData() {
  return JSON.stringify(state, null, 1);
}

export function importData(json) {
  const s = JSON.parse(json);
  if (!s || typeof s.cards !== 'object' || !Array.isArray(s.learned)) throw new Error('Not a valid backup file');
  Object.keys(state).forEach(k => delete state[k]);
  const d = defaults();
  Object.assign(state, d, s, { settings: { ...d.settings, ...s.settings }, path: { ...d.path, ...s.path } });
  save();
}

export function resetAll() {
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, defaults());
  save();
}
