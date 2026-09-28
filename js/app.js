import { UNITS, TONE_SETS, TONE_INFO, PAIR_WORDS, CHANGE_WORDS, SOUND_SETS } from './content.js';
import {
  state, save, today, ITEM_BY_ID, Rating, dueCards, newRemainingToday, nextNewItems, introduce,
  previewIntervals, grade, allowExtraNew, formatInterval, stats, currentStreak, exportData, importData, resetAll,
  daysSinceBackup, requestPersistence,
} from './store.js';
import {
  STAGES, stageIndex, currentStage, isPassed, isUnlocked, unlockedUnitIds, gateStatus,
  passStage, recordAnswers, undoLastAnswer, unitStatus, weightedPick, missWeight, levelOf, LISTENING,
} from './path.js';
import { PHRASE_LEVELS, phrasesFor, weightedSample, toneless, withTone } from './phrase-tones.js';
import { createTonePad } from './tone-pad.js';
import { NUMBER_SETS, NUMBER_LEVELS } from './numbers.js';
import {
  initTTS, hasChineseVoice, setRate, speak, stopSpeaking, canRecognize, recognize, matchScore,
  canRecord, trackPitch, cleanContour, releaseMic,
} from './speech.js';
import { classifyTone, checkPair } from './tone-grade.js';
import { colorPinyin, syllables } from './pinyin.js';
import { drawCompare, toneChanges, modelContour } from './pitch-view.js';
import { update, startUpdateChecks, checkForUpdate, downloadUpdate } from './update.js';

const $ = (sel, root = document) => root.querySelector(sel);
const view = $('#view');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];

function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

let recognitionBroken = false;
let voicesSettled = false;
let waitTimer = null;

// ---------------------------------------------------------------- navigation

const TABS = { today: renderToday, path: renderPath, me: renderMe };

function go(tab) {
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.body.classList.remove('in-session');
  clearInterval(waitTimer);
  session = null;
  stopSpeaking();
  releaseMic();
  view.replaceChildren();
  TABS[tab]();
  window.scrollTo(0, 0);
}

document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));

// Clears the screen for the next step of a session or drill.
function freshScreen(fraction, onClose) {
  stopSpeaking();
  view.replaceChildren();
  window.scrollTo(0, 0);
  document.body.classList.add('in-session');
  const bar = h(`<div class="session-top">
      <button class="icon-btn close" aria-label="End">✕</button>
      <div class="progress"><div style="width:${100 * Math.min(1, fraction)}%"></div></div>
    </div>`);
  $('.close', bar).onclick = onClose || (() => go('today'));
  view.append(bar);
}

// ---------------------------------------------------------------- shared bits

// Under the pinyin: where the tones you hear differ from the ones written, e.g. nǐ → ní.
// Changes that depend on phrasing (in runs of three or more 3rd tones) are marked "often".
function saidLine(py) {
  const changes = toneChanges(py);
  if (!changes.length) return '';
  return `<div class="said">Tone change${changes.length > 1 ? 's' : ''}: ${changes.map(c =>
    `${colorPinyin(c.text)} → ${colorPinyin(c.said)}${c.sure ? '' : ' <i>(often)</i>'}`).join(', ')}</div>`;
}

function phraseBlock(item, { big = true } = {}) {
  return `
    <div class="phrase ${big ? 'big' : ''}">
      <div class="py">${colorPinyin(item.py)}</div>
      ${saidLine(item.py)}
      ${state.settings.showHanzi ? `<div class="zh">${esc(item.zh)}</div>` : ''}
      <div class="en">${esc(item.en)}</div>
      ${item.lit ? `<div class="lit">literally “${esc(item.lit)}”</div>` : ''}
    </div>`;
}

function exampleBlock(item) {
  const [zh, py, en] = item.ex;
  return `
    <div class="example">
      <button class="icon-btn play-ex" aria-label="Play example">▶</button>
      <div>
        <div class="py">${colorPinyin(py)}</div>
        ${saidLine(py)}
        ${state.settings.showHanzi ? `<div class="zh">${esc(zh)}</div>` : ''}
        <div class="en">${esc(en)}</div>
      </div>
    </div>`;
}

function audioButtons(text) {
  const el = h(`<div class="audio-row">
      <button class="btn round play" aria-label="Play">🔊</button>
      <button class="btn round slow" aria-label="Play slowly">🐢</button>
    </div>`);
  $('.play', el).onclick = () => speak(text);
  $('.slow', el).onclick = () => speak(text, { slow: true });
  return el;
}

// Mic widget. "Say it" uses speech recognition to check the words (when the browser has it).
// "Tones" records you and draws your pitch next to the expected melody, since recognition
// happily accepts the right words said with the wrong tones.
// With `hidden`, anything that gives the answer away (model melody, model audio) waits until
// el.reveal() is called.
function speakCheck(target, { onResult, py, hidden = false } = {}) {
  const useRec = canRecognize && !recognitionBroken;
  const usePitch = !!(py && navigator.mediaDevices?.getUserMedia);
  if (!useRec && !usePitch) return h('<div></div>');
  const el = h(`<div class="speak-check">
      <div class="row mic-row">
        ${useRec ? '<button class="btn mic words">🎙 Say it</button>' : ''}
        ${usePitch ? `<button class="btn mic tones">📈 ${useRec ? 'Tones' : 'Say it'}</button>` : ''}
      </div>
      <div class="result"></div>
    </div>`);
  const out = $('.result', el);

  if (useRec) {
    const btn = $('.words', el);
    btn.onclick = async () => {
      releaseMic(); // an open pitch-tracking stream can block recognition on some phones
      btn.disabled = true; btn.classList.add('listening'); btn.textContent = '🎙 Listening…';
      out.textContent = '';
      try {
        const alts = await recognize();
        if (!alts.length) {
          out.innerHTML = '<span class="muted">Didn\'t catch that. Try again.</span>';
        } else {
          const score = Math.max(...alts.map(a => matchScore(target, a)));
          const heard = alts.reduce((b, a) => (matchScore(target, a) > matchScore(target, b) ? a : b));
          // Recognition checks words, not tones, so "understood" is the honest claim.
          const verdict = score >= 0.99 ? ['good', '✓ Understood'] : score >= 0.6 ? ['close', '≈ Close'] : ['miss', '✗ Not quite'];
          out.innerHTML = `<span class="badge ${verdict[0]}">${verdict[1]}</span> Heard: <b>${esc(heard)}</b>`;
          onResult?.(score);
        }
      } catch (e) {
        if (/not-allowed|service-not-allowed|unsupported|network/.test(e.message)) {
          recognitionBroken = true;
          el.replaceWith(speakCheck(target, { onResult, py }));
          return;
        }
        out.innerHTML = `<span class="muted">Didn't catch that (${esc(e.message)}). Try again.</span>`;
      }
      btn.disabled = false; btn.classList.remove('listening'); btn.textContent = '🎙 Say it again';
    };
  }

  if (usePitch) {
    const btn = $('.tones', el);
    const syl = syllables(py.split('/')[0]).length;
    let canvas = null, stopper = null, contour = [], revealed = !hidden;
    const draw = () => drawCompare(canvas, py, contour, { hideModel: !revealed });
    const modelBtn = h('<button class="btn small">🔊 Model</button>');
    modelBtn.onclick = () => speak(target);
    el.reveal = () => {
      revealed = true;
      if (!canvas) return;
      draw();
      if (out.childElementCount && !modelBtn.isConnected) out.append(modelBtn);
    };
    btn.onclick = async () => {
      if (stopper) { stopper.abort(); return; }
      stopSpeaking();
      if (!canvas) {
        // The tone changes are shown with the pinyin (saidLine), so not again here.
        const box = h(`<div class="compare">
            <canvas class="pitch compare-canvas" width="640" height="260"></canvas>
          </div>`);
        el.append(box);
        canvas = $('canvas', box);
      }
      contour = [];
      draw();
      out.innerHTML = '';
      stopper = new AbortController();
      btn.classList.add('listening'); btn.textContent = '⏹ Stop';
      try {
        // Long enough for the phrase; stops by itself about a second after you finish.
        const { values, url } = await trackPitch(Math.min(9000, 2000 + 550 * syl),
          (_, vals) => { contour = cleanContour(vals); draw(); },
          { silenceMs: 1000, signal: stopper.signal });
        contour = cleanContour(values);
        draw();
        if (!contour.length) out.innerHTML = '<span class="muted">No clear voice detected. Try again, a little louder and closer.</span>';
        if (url) {
          const mine = h('<button class="btn small">▶ You</button>');
          mine.onclick = () => new Audio(url).play();
          out.append(mine);
        }
        if (revealed) out.append(modelBtn);
      } catch {
        out.innerHTML = '<span class="muted">Microphone permission was denied.</span>';
      }
      stopper = null;
      btn.classList.remove('listening'); btn.textContent = `📈 ${useRec ? 'Tones' : 'Say it'} again`;
    };
  }
  return el;
}

function wireExample(root, item) {
  root.querySelectorAll('.play-ex').forEach(b => (b.onclick = () => speak(item.ex[0])));
}

function toneShapeSvg(t, w = 60, hgt = 40) {
  const pts = TONE_INFO[t - 1].path.map(([x, y]) => `${4 + x * (w - 8)},${hgt - 4 - ((y - 1) / 4) * (hgt - 8)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${hgt}" width="${w}" height="${hgt}" class="shape t${t}"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// Strip of the last N answers (green = right, red = wrong, grey = not yet answered).
function gateBox(stage) {
  const g = gateStatus(stage);
  const cells = Array.from({ length: stage.window }, (_, i) => {
    const v = g.hist[i];
    return `<i class="${v === 1 ? 'ok' : v === 0 ? 'no' : ''}"></i>`;
  }).join('');
  const pct = g.n ? Math.round((100 * g.right) / g.n) : 0;
  const lv = levelOf(stage);
  const moreLevels = stage.levels && lv < stage.levels.length;
  return `<div class="gate">
      ${stage.levels ? `<div class="gate-level"><b>Level ${lv} of ${stage.levels.length}</b> · ${esc(stage.levels[lv - 1])}</div>` : ''}
      <div class="dots">${cells}</div>
      <div class="gate-text">${!g.n ? 'No answers yet'
        : g.n < stage.window ? `<b>${g.right}/${g.n}</b> right so far`
        : `<b>${g.right}/${stage.window}</b> right in your last ${stage.window} <span class="muted">(${pct}%)</span>`} · ${moreLevels ? 'next level' : 'pass'} at <b>${stage.need} of your last ${stage.window}</b></div>
    </div>`;
}

// ---------------------------------------------------------------- today

function renderToday() {
  const stage = currentStage();
  const streak = currentStreak();
  const el = h(`<section class="today">
    <header class="hero">
      <h1>今天 <span class="muted">jīntiān · today</span></h1>
      <div class="streak">${streak ? `🔥 ${streak} day${streak > 1 ? 's' : ''}` : '🌱 Start your streak'}</div>
    </header>
    ${hasChineseVoice() ? '' : `<div class="warn ${voicesSettled ? '' : 'hidden'}">No Chinese voice found on this device, so audio may not play. On iPhone: Settings → Accessibility → Spoken Content → Voices → Chinese. On Android: install Google Text-to-speech with Chinese.</div>`}
    <div class="stage-box"></div>
    ${backupDue() ? `<button class="link-btn backup-nudge muted small">💾 ${backupText()} Back up your progress on the Me tab.</button>` : ''}
  </section>`);
  const box = $('.stage-box', el);
  const nudge = $('.backup-nudge', el);
  if (nudge) nudge.onclick = () => go('me');
  if (!stage) renderCourseDone(box);
  else if (stage.kind === 'drill') renderDrillStage(box, stage);
  else renderUnitStage(box, stage);
  view.append(el);
}

function stageHeader(stage) {
  return `<div class="stage-label muted">Stage ${stageIndex(stage) + 1} of ${STAGES.length}</div>
    <h2 class="stage-title">${stage.emoji} ${esc(stage.title)}</h2>`;
}

function renderDrillStage(box, stage) {
  const g = gateStatus(stage);
  box.append(h(`<div class="card stage">
      ${stageHeader(stage)}
      ${gateBox(stage)}
    </div>`));
  const intro = h(`<details class="card about" ${g.n ? '' : 'open'}><summary><b>About this stage</b></summary><div class="about-body"></div></details>`);
  stageIntro(stage, $('.about-body', intro));
  const start = h(`<button class="btn primary big">${g.n ? 'Practise' : 'Start'} · 20 questions</button>`);
  start.onclick = () => startDrill(stage);
  box.append(start, intro);
}

const soon = () => new Date(Date.now() + 30 * 60000);

function renderUnitStage(box, stage) {
  const units = unlockedUnitIds();
  const due = dueCards(units, soon()).length;
  const us = unitStatus(stage);
  const newLeft = Math.min(newRemainingToday(), us.total - us.introduced);
  const done = [us.introduced === us.total, us.graduated && us.introduced === us.total, false];
  const now = done.indexOf(false);
  const step = (i, html) => `<li class="${done[i] ? 'done' : i === now ? 'now' : ''}">${html}</li>`;
  const card = h(`<div class="card stage">
      ${stageHeader(stage)}
      <ol class="unit-steps">
        ${step(0, `<span>Learn the ${us.total} phrases <span class="muted">(${us.introduced}/${us.total})</span></span>`)}
        ${step(1, 'Review them until they stick')}
        ${step(2, `<span>Pass the unit test on a later day <span class="muted">(needs ${us.need}/${us.questions})</span></span>`)}
      </ol>
    </div>`);
  box.append(card);

  if (due || newLeft) {
    const b = h(`<button class="btn primary big">Start session<small>${[due && `${due} review${due > 1 ? 's' : ''}`, newLeft && `${newLeft} new`].filter(Boolean).join(' · ')}</small></button>`);
    b.onclick = () => beginSession(stage);
    box.append(b);
  }
  if (us.testReady) {
    const b = h(`<button class="btn ${due || newLeft ? '' : 'primary'} big">📝 Take the unit test</button>`);
    b.onclick = () => startUnitTest(stage);
    box.append(b);
  }
  if (!due && !newLeft && !us.testReady) {
    let msg;
    if (us.introduced < us.total) msg = `Done for today. The rest of this unit's phrases come tomorrow.`;
    else if (us.triedToday) msg = 'You took the test today. Missed phrases are back in review, and you can retake it tomorrow.';
    else if (us.learnedToday) msg = 'Done for today. The unit test opens tomorrow, so it checks what you actually remember.';
    else msg = `Done for now. The unit test opens once all these phrases have come back in review and stuck.${nextDueText(units)}`;
    box.append(h(`<p class="muted center">${msg}</p>`));
    if (us.introduced < us.total) {
      const more = h(`<button class="btn big">+ Learn ${Math.min(state.settings.newPerDay, us.total - us.introduced)} more today</button>`);
      more.onclick = () => { allowExtraNew(state.settings.newPerDay); beginSession(stage); };
      box.append(more);
    }
  }
  const intro = h(`<details class="card about" ${us.introduced ? '' : 'open'}><summary><b>About this stage</b></summary><div class="about-body"></div></details>`);
  stageIntro(stage, $('.about-body', intro));
  box.append(intro);
}

function nextDueText(units) {
  const next = Object.entries(state.cards)
    .filter(([id]) => units.has(ITEM_BY_ID[id.split(':')[0]]?.unit))
    .map(([, c]) => new Date(c.due)).sort((a, b) => a - b)[0];
  return next ? ` Next review in ${formatInterval(next)}.` : '';
}

function renderCourseDone(box) {
  const due = dueCards().length;
  box.append(h(`<div class="card stage"><h2 class="stage-title">🏆 Course complete</h2><p>You've passed every stage. Keep your reviews going so it all stays fresh.</p></div>`));
  if (due) {
    const b = h(`<button class="btn primary big">Review · ${due} due</button>`);
    b.onclick = () => beginSession(null);
    box.append(b);
  }
}

// ---------------------------------------------------------------- stage intros

// How to draw each tone on the pad, for the stage intros.
const drawGuide = light => `<ul>
  <li><span class="t1">1</span>: level, along the top</li>
  <li><span class="t2">2</span>: rising</li>
  <li><span class="t3">3</span>: anything low: a low dip, a low fall or a low line</li>
  <li><span class="t4">4</span>: falling from the top</li>
  ${light ? '<li><span class="t5">Light (neutral) tone</span>: just tap</li>' : ''}
</ul>`;

function stageIntro(stage, box) {
  if (stage.kind === 'unit') {
    const us = unitStatus(stage);
    box.innerHTML = `
      <p>You'll learn ${us.total} everyday phrases, two at a time. Each phrase gets two cards:</p>
      <ul><li>👂 <b>Listen:</b> hear it and recall the meaning.</li><li>🗣 <b>Speak:</b> see the English and say it out loud.</li></ul>
      <p>Cards come back on a spaced schedule, just before you'd forget them. Rate yourself honestly: "Again" is how the app knows what to bring back.</p>
      <p><b>To pass:</b> a unit test on a later day than you learned the phrases. Every phrase both ways, no hints. Pass mark 98%, which for ${us.questions} questions means all ${us.need}. Miss some and those phrases go back into review. You can retake the test the next day.</p>
      <p class="muted">Phrases from units you've passed keep coming back in your daily reviews.</p>`;
    return;
  }
  const pass = `<p><b>To pass:</b> ${stage.need} right out of your last ${stage.window} answers${stage.need === 49 ? ' (98%)' : ''}. Only your most recent ${stage.window} count, so early mistakes drop off as you improve.</p>`;
  if (stage.id === 'tones') {
    box.innerHTML = `
      <p>Mandarin has four tones, plus a light "neutral" tone. Change the tone and you change the word: <b class="t1">mā</b> 妈 is mother, <b class="t3">mǎ</b> 马 is horse. Hearing tones reliably is the foundation for everything after this, so it comes first.</p>
      <div class="tone-guide">${TONE_INFO.map(t => `<button class="tone-card" data-t="${t.n}">${toneShapeSvg(t.n)}<b class="t${t.n}"></b><span>${t.shape}</span></button>`).join('')}</div>
      <div class="row"><button class="btn small another">Another syllable</button></div>
      <p class="muted small tip-line">Tap a tone to hear it.</p>
      <p>You'll hear one syllable and <b>draw its tone</b> on the pad, roughly: it snaps to the nearest tone. Height counts, not just direction:</p>
      ${drawGuide(false)}
      <p>Most people mix up 2 and 3 at first: 2 rises steadily, 3 dips low. Get one wrong and you'll see the right tone drawn in and hear it again.</p>${pass}`;
    let set = TONE_SETS[0];
    const label = () => box.querySelectorAll('.tone-card b').forEach((b, i) => (b.textContent = set.py[i]));
    label();
    box.querySelectorAll('.tone-card').forEach(b => (b.onclick = () => {
      const t = +b.dataset.t;
      speak(set.zh[t - 1]);
      $('.tip-line', box).textContent = `${TONE_INFO[t - 1].name}: ${TONE_INFO[t - 1].tip}`;
    }));
    $('.another', box).onclick = () => { set = TONE_SETS[(TONE_SETS.indexOf(set) + 1) % TONE_SETS.length]; label(); };
  } else if (stage.id === 'pairs') {
    box.innerHTML = `
      <p>In real speech, tones come in combinations, and neighbouring tones change each other. You'll hear a two-syllable word and <b>draw its two tones</b> on the pad, one after the other:</p>
      ${drawGuide(false)}
      <p>Tip: a 3rd tone before another tone stays low and doesn't rise at the end (a "half-third"). A low line or a low fall is right for it.</p>
      <p>The word counts as right when both tones are.</p>
      <p class="muted">Two 3rd tones in a row are said 2–3. That's the next stage.</p>${pass}`;
  } else if (stage.id === 'changes') {
    box.innerHTML = `
      <p>Pinyin shows each syllable's dictionary tone, but in real speech some tones change. You'll hear a word and draw the tones you <i>actually hear</i>, the same way as before (tap for a neutral tone). The four changes you'll meet constantly:</p>
      <ul>
        <li><b>Neutral tone (•):</b> the second syllable is short and light, e.g. <span class="t4">xiè</span><span class="t5">xie</span> 谢谢. Its pitch depends on the tone before it.</li>
        <li><b>3 + 3 → 2 + 3:</b> <span class="t3">nǐ</span> <span class="t3">hǎo</span> is said <span class="t2">ní</span> <span class="t3">hǎo</span>.</li>
        <li><b>不 bù → bú</b> before a 4th tone: <span class="t2">bú</span> <span class="t4">shì</span>, but <span class="t4">bù</span> <span class="t3">hǎo</span>.</li>
        <li><b>一 yī → yí</b> before a 4th tone, <b>yì</b> before the others: <span class="t2">yí</span><span class="t4">yàng</span>, <span class="t4">yì</span><span class="t3">qǐ</span>.</li>
      </ul>${pass}`;
  } else if (stage.id === 'phrases') {
    box.innerHTML = `
      <p>Now the tones inside real phrases, at natural speed. In a sentence, tones are shorter and run into each other, and the whole sentence has its own melody, so they're harder to catch than in single words.</p>
      <p>You'll hear a phrase and see its pinyin with some tones left out. For each gap, left to right, <b>draw the tone you hear</b> on the pad, roughly: it snaps to the nearest tone. Height counts, not just direction:</p>
      <ul>
        <li><span class="t1">1</span>: level, along the top</li>
        <li><span class="t2">2</span>: rising</li>
        <li><span class="t3">3</span>: anything low. In a phrase a 3rd tone usually just stays low (a low dip or a low fall); it only comes back up before a pause</li>
        <li><span class="t4">4</span>: falling from the top</li>
        <li><span class="t5">Light (neutral) tone</span>: just tap</li>
      </ul>
      <p>Get one wrong and you'll see the right tone drawn in and hear the phrase again. Draw the tone that's actually <i>said</i>: 你好 is ${colorPinyin('ní hǎo')}.</p>
      <p><b>${stage.levels.length} levels</b>, one after the other:</p>
      <ol>${stage.levels.map(l => `<li>${esc(l)}</li>`).join('')}</ol>
      <p><b>To move up:</b> each tone you fill in counts as one answer. At ${stage.need} right out of your last ${stage.window} you go up a level, and the count starts again. Reach it on level ${stage.levels.length} to pass.</p>
      <p class="muted">Syllables with a dotted underline are runs of three or more 3rd tones. Speakers split those differently (我很好 can be wó hén hǎo or wǒ hén hǎo), so they're never asked.</p>`;
  } else if (stage.id === 'sounds') {
    box.innerHTML = `
      <p>Some Mandarin consonants and vowels don't exist in English and are easy to confuse. You'll hear one syllable and pick which one it was. The options differ only in that sound, and they all have the same tone.</p>
      <div class="sound-list">${SOUND_SETS.map((s, i) => `
        <div class="sound-row"><div><b>${s.label}</b><div class="muted small">${esc(s.tip)}</div></div>
        <div class="sound-play">${s.groups[0].map(([zh, py], j) => `<button class="btn small" data-s="${i}" data-j="${j}">🔊 ${py}</button>`).join('')}</div></div>`).join('')}
      </div>${pass}`;
    box.querySelectorAll('[data-s]').forEach(b => (b.onclick = () => speak(SOUND_SETS[+b.dataset.s].groups[0][+b.dataset.j][0])));
  } else if (stage.id === 'say') {
    box.innerHTML = `
      <p>Now you produce the tones. Say the syllable shown. The app draws your pitch against the target shape and works out which tone it heard.</p>
      <p>Exaggerate at first: high and flat for 1, a clear climb for 2, go right down and back up for 3, a sharp drop for 4.</p>
      <p><b>To pass:</b> ${stage.need} of your last ${stage.window} (90%). This stage's pass mark is lower because an automatic pitch tracker is less accurate than your ears. If the mic clearly got it wrong (noise, or it cut you off), tap "Don't count this one".</p>`;
  } else if (stage.id === 'saypairs') {
    box.innerHTML = `
      <p>Now say two-syllable words, the same tone pairs you learned to hear in stage 2. The app draws your pitch next to the target melody and checks each syllable's tone.</p>
      <p>What it listens for:</p>
      <ul>
        <li><b class="t1">1st</b>: level, and at least as high as the other syllable.</li>
        <li><b class="t2">2nd</b>: a clear climb.</li>
        <li><b class="t3">3rd</b>: lower than the other syllable. Before another tone it just stays low (no rise at the end).</li>
        <li><b class="t4">4th</b>: a clear drop.</li>
      </ul>
      <p>Say the word slowly and clearly, with a small break between the two syllables. That helps the app tell where one ends and the next begins.</p>
      <p><b>To pass:</b> each syllable counts as one answer. ${stage.need} right out of your last ${stage.window} (80%). This is lower than the other stages because the pitch tracker is least sure here: tested on recordings of native speakers, it accepted about 80% of their syllables and wrongly accepted about 1 in 5 wrong ones. Use the pitch picture as your main guide, and if the app clearly got it wrong, tap "Don't count this one".</p>`;
  } else if (stage.id === 'numbers') {
    box.innerHTML = `
      <p>Prices, times, phone numbers and ages come up constantly and go by fast. You'll hear a number and type it on the keypad.</p>
      <ul>
        <li><b>11–99:</b> ${colorPinyin('shí yī')} 十一 is 10 + 1, ${colorPinyin('èr shí')} 二十 is 2 × 10, ${colorPinyin('èr shí wǔ')} 二十五 is 25.</li>
        <li><b>Hundreds:</b> ${colorPinyin('bǎi')} 百. 200 is usually ${colorPinyin('liǎng bǎi')} 两百. A gap in the middle is filled with ${colorPinyin('líng')} 零: 一百零五 is 105. In 110, the one is said: 一百一十.</li>
        <li><b>Prices:</b> ${colorPinyin('kuài')} 块 is the everyday word for yuan, and 2 is ${colorPinyin('liǎng kuài')} 两块. A number after 块 is tenths: 三块五 is 3.5.</li>
        <li><b>Phone numbers</b> are read digit by digit in groups of 3-4-4, and 1 is said ${colorPinyin('yāo')} 幺, so it isn't confused with 7 (qī).</li>
      </ul>
      <p><b>${stage.levels.length} levels</b>, one after the other:</p>
      <ol>${stage.levels.map(l => `<li>${esc(l)}</li>`).join('')}</ol>
      <p><b>To move up:</b> ${stage.need} right out of your last ${stage.window}, and the count starts again. Reach it on level ${stage.levels.length} to pass.</p>`;
  }
}

// ---------------------------------------------------------------- drills (stages 1–5)

function startDrill(stage) {
  drillNext({ stage, asked: 0, right: 0, size: 20, passedNow: false });
}

function drillNext(run) {
  const { stage } = run;
  freshScreen(run.asked / run.size, () => go(stage === currentStage() ? 'today' : 'path'));
  if (run.passedNow) return renderStagePassed(stage);
  if (run.levelUp) return renderLevelUp(run);
  if (run.asked >= run.size) return renderDrillDone(run);
  const gate = h(`<div class="gate-mini">${gateBox(stage)}</div>`);
  const box = h('<section class="study drill"></section>');
  view.append(box, gate);
  const { answer, undo } = answerFns(run, stage, () => (gate.innerHTML = gateBox(stage)));
  DRILLS[stage.id](box, { answer, undo, next: () => drillNext(run), run, stage });
}

// answer() and undo() for one question of `stage`, keeping the round's tally in `run`.
// `key` names what was asked (a tone, a word, a sound contrast) so misses come up more often.
// A question with several parts passes a list of { correct, key } instead. undo() takes the
// whole question back.
function answerFns(run, stage, onChange) {
  let last = null;
  const tally = sign => {
    run.asked += sign;
    if (last.parts.every(p => p.correct)) run.right += sign;
    if (last.multi) {
      run.parts = (run.parts || 0) + sign * last.parts.length;
      run.partsRight = (run.partsRight || 0) + sign * last.parts.filter(p => p.correct).length;
    }
  };
  const answer = (correct, key) => {
    const multi = Array.isArray(correct);
    last = { multi, parts: multi ? correct : [{ correct, key }] };
    tally(1);
    const result = recordAnswers(stage, last.parts);
    if (result === 'passed') run.passedNow = true;
    if (result === 'level') run.levelUp = true;
    onChange?.();
  };
  const undo = () => {
    if (!last) return;
    tally(-1);
    last = null;
    undoLastAnswer(stage);
    onChange?.();
  };
  return { answer, undo };
}

// With `auto` (ms) it also goes on by itself after that long, a bar along it filling up
// meanwhile: for a right answer, where there's nothing more to look at. A tap goes sooner.
function nextButton(next, label = 'Next →', auto = 0) {
  const b = h(`<button class="btn primary big">${label}</button>`);
  let gone = false;
  const go = () => { if (!gone) { gone = true; next(); } };
  if (auto) {
    b.classList.add('auto');
    b.style.setProperty('--auto', `${auto}ms`);
    setTimeout(() => b.isConnected && go(), auto); // not if you've left the screen meanwhile
  }
  // With a finger, go as it lifts rather than on the click: right after drawing on the pad,
  // iOS sometimes drops the click, so it took two taps. Going after the touchend, which then
  // cancels the click, keeps that click from landing on whatever the next screen has there.
  let tapped = false;
  b.addEventListener('pointerup', e => {
    if (e.pointerType !== 'touch') return;
    const r = b.getBoundingClientRect();
    if (e.clientX < r.left - 8 || e.clientX > r.right + 8 || e.clientY < r.top - 8 || e.clientY > r.bottom + 8) return;
    tapped = true;
    setTimeout(go);
  });
  b.addEventListener('touchend', e => { if (tapped) e.preventDefault(); });
  b.onclick = go;
  return b;
}

let lastPhrase = null; // so the same phrase doesn't come up twice in a row
// How each tone sounds in a phrase, shown when you drew the wrong one.
const TONE_SAID = {
  1: '1st tone, high and level', 2: '2nd tone, rising', 3: '3rd tone, staying low',
  '3dip': '3rd tone, low then back up', 4: '4th tone, falling from the top', 5: 'light tone, short and unstressed',
};

// Draw the tones of `syl` (from modelContour) at the indices in `blanks` on a pad, one at a time,
// left to right. Each is checked as soon as it's drawn: a right one moves on, a wrong one turns
// red, draws the right contour over yours and replays `zh`. Syllables that aren't asked are shown
// by other(s, cls, done). With light: false there are no light tones to draw, so a tap asks for
// the tone's shape instead. After the last one, finish(picked, { feedback, after }) is called,
// picked[i] being the tone drawn for syllable i.
function drawTones(box, { zh, syl, blanks = syl.map((_, i) => i), question, below = '', other, light = true, slow = true, finish }) {
  const picked = {};
  let step = 0; // which of the blanks you're drawing
  let done = false;
  // After a wrong tone the right one stays on the pad until you move on, with Continue or by
  // just drawing the next tone (shown as the active one meanwhile).
  let pending = false;

  const chip = (s, i) => {
    const cls = `syl${s.pauseBefore && i ? ' pause' : ''}`;
    if (!blanks.includes(i)) return other(s, cls, done);
    if (picked[i]) {
      const ok = picked[i] === s.tone;
      const mine = withTone(toneless(s.text), picked[i]);
      return `<span class="${cls} blank ${ok ? 'right' : 'wrong'}"><span class="t${s.tone}">${esc(s.said)}</span>${ok ? '' : `<s class="t${picked[i]}">${esc(mine)}</s>`}</span>`;
    }
    return `<span class="${cls} blank${i === blanks[pending ? step + 1 : step] ? ' active' : ''}"><span class="gap">${esc(toneless(s.text))}</span></span>`;
  };
  const HINT = light ? 'Draw it roughly · tap for a light tone' : 'Draw it roughly';
  box.innerHTML = `
    <div class="drill-q">${question}</div>
    <div class="audio-row"><button class="btn round replay">🔊</button>${slow ? '<button class="btn round slow">🐢</button>' : ''}</div>
    <div class="syl-row draw-row"></div>
    ${below}
    <div class="tone-pad"></div>
    <div class="pad-hint muted small center">${HINT}</div>
    <div class="feedback"></div>
    <div class="after"></div>`;
  const row = $('.syl-row', box);
  const hint = $('.pad-hint', box);
  const after = $('.after', box);
  const draw = () => (row.innerHTML = syl.map(chip).join(''));
  let hintTimer;
  const say = (text, cls = '') => {
    clearTimeout(hintTimer);
    hint.textContent = text;
    hint.className = `pad-hint small center ${cls || 'muted'}`;
  };
  const end = () => {
    done = true;
    pad.busy = true;
    draw();
    finish(picked, { feedback: $('.feedback', box), after });
  };
  const advance = () => {
    pending = false;
    after.replaceChildren();
    step++;
    if (step >= blanks.length) return end();
    pad.busy = false;
    draw();
  };

  const pad = createTonePad($('.tone-pad', box), {
    onStroke: async result => {
      if (pending) { advance(); say(HINT); }
      if (result.retry || (!light && result.tone === 5)) {
        pad.reject();
        say(result.tone === 5 ? 'No light tones here. Draw the tone\'s shape.'
          : result.retry === 'small' ? 'Too small to read. Draw it bigger.' : 'That isn\'t a tone shape. Draw it again.');
        hintTimer = setTimeout(() => say(HINT), 2500);
        return;
      }
      const i = blanks[step];
      const s = syl[i];
      picked[i] = result.tone;
      if (picked[i] === s.tone) {
        // Straight on to the next tone. The shape snaps, then fades so the pad is clean for it,
        // and drawing it straight away cuts that short.
        pad.snap(result, { fade: true });
        say(`${s.said} ✓`, `t${s.tone}`);
        return advance();
      }
      const snapped = pad.snap(result);
      const last = step === blanks.length - 1;
      pad.busy = last;
      pending = !last;
      draw();
      say(`It's ${s.said}: ${TONE_SAID[s.tone === 3 && s.pts.length > 2 ? '3dip' : s.tone]}`, `t${s.tone}`);
      speak(zh);
      // The button comes straight away, so it's there to tap while the shape is still snapping.
      if (last) end();
      else after.replaceChildren(nextButton(() => { advance(); pad.clear(); say(HINT); }, 'Continue →'));
      // Starting the next tone cuts these short (the snap then never resolves), which is fine.
      await snapped;
      pad.answer(s.pts, s.tone);
    },
  });
  $('.replay', box).onclick = () => speak(zh);
  if (slow) $('.slow', box).onclick = () => speak(zh, { slow: true });
  draw();
  speak(zh);
}

const DRILLS = {
  tones(box, { answer, next, stage }) {
    const set = pick(TONE_SETS);
    const t = weightedPick(stage, [1, 2, 3, 4], n => n);
    drawTones(box, {
      zh: set.zh[t - 1],
      syl: modelContour(set.py[t - 1]),
      question: 'Draw the tone you hear',
      light: false,
      slow: false,
      finish: (picked, { feedback, after }) => {
        const n = picked[0];
        feedback.innerHTML = `<span class="py-big t${t}">${set.py[t - 1]}</span> <span class="zh">${set.zh[t - 1]}</span>`;
        answer(n === t, t);
        if (n === t) return after.replaceChildren(nextButton(next, 'Next →', 900));
        const cmp = h('<button class="btn small">🔊 Compare</button>');
        cmp.onclick = async () => { await speak(set.zh[n - 1]); speak(set.zh[t - 1]); };
        feedback.append(h(`<div class="muted small">You drew ${n} (${set.py[n - 1]}). Compare plays yours, then the right one.</div>`), h('<div class="row"></div>'));
        feedback.lastChild.append(cmp);
        after.replaceChildren(nextButton(next));
      },
    });
  },

  pairs(box, { answer, next, stage }) {
    const word = weightedPick(stage, PAIR_WORDS, w => w.zh);
    const syl = modelContour(word.py);
    drawTones(box, {
      zh: word.zh,
      syl,
      question: 'Draw the two tones you hear',
      light: false,
      finish: (picked, { feedback, after }) => {
        feedback.innerHTML = `<div class="center"><span class="zh">${esc(word.zh)}</span> · ${esc(word.en)}</div>`;
        const ok = syl.every((s, i) => picked[i] === s.tone);
        answer(ok, word.zh);
        after.replaceChildren(nextButton(next, 'Next →', ok ? 1100 : 0));
      },
    });
  },

  // Hear the tones as they're actually said: neutral tones, 3–3 → 2–3, and the 不 / 一 changes.
  changes(box, { answer, next, stage }) {
    const word = weightedPick(stage, CHANGE_WORDS, w => w.zh);
    const syl = modelContour(word.said);
    drawTones(box, {
      zh: word.zh,
      syl,
      question: 'Draw the tones you actually hear',
      finish: (picked, { feedback, after }) => {
        feedback.innerHTML = `<div class="center"><span class="zh">${esc(word.zh)}</span> · ${esc(word.en)}</div>
          ${word.said !== word.py ? `<div class="muted small center">Written <b>${colorPinyin(word.py)}</b>, said <b>${colorPinyin(word.said)}</b>.</div>` : ''}`;
        const ok = syl.every((s, i) => picked[i] === s.tone);
        answer(ok, word.zh);
        after.replaceChildren(nextButton(next, 'Next →', ok ? 1300 : 0));
      },
    });
  },

  // A natural phrase with some tones left out: more of them, in longer phrases, level by level.
  // You draw each missing tone in turn on a pad, and it's checked straight away.
  phrases(box, { answer, next, stage, level: lv = levelOf(stage) }) {
    const level = PHRASE_LEVELS[lv - 1];
    const weight = s => missWeight(stage, s.tone);
    const pool = phrasesFor(lv).filter(p => p.zh !== lastPhrase);
    const [phrase] = weightedSample(pool, p => Math.max(...p.syl.filter(s => s.ask).map(weight)), 1);
    lastPhrase = phrase.zh;
    const { syl } = phrase;
    const askable = syl.map((_, i) => i).filter(i => syl[i].ask);
    const blanks = weightedSample(askable, i => weight(syl[i]), level.blanks).sort((a, b) => a - b);
    drawTones(box, {
      zh: phrase.zh,
      syl,
      blanks,
      question: blanks.length > 1 ? 'Draw each tone you hear' : 'Draw the tone you hear',
      below: syl.some(s => !s.ask) ? '<div class="muted small center">Dotted: a run of 3rd tones, not asked.</div>' : '',
      other: (s, cls, done) => (s.ask
        ? `<span class="${cls}"><span class="t${s.tone}">${esc(s.said)}</span></span>`
        : `<span class="${cls} fixed">${esc(done ? s.text : toneless(s.text))}</span>`),
      finish: (picked, { feedback, after }) => {
        const parts = blanks.map(i => ({ correct: picked[i] === syl[i].tone, key: syl[i].tone }));
        const changed = blanks.map(i => syl[i]).filter(s => s.said !== s.text);
        feedback.innerHTML = `<div class="center"><span class="zh">${esc(phrase.zh)}</span> · ${esc(phrase.en)}</div>
          ${changed.length ? `<div class="muted small center">${changed.map(s => `${esc(s.text)} → ${colorPinyin(s.said)}`).join(', ')}: a 3rd tone before another 3rd tone is said as a 2nd tone.</div>` : ''}`;
        answer(parts);
        after.replaceChildren(nextButton(next, 'Next →', parts.every(p => p.correct) ? 1400 : 0));
      },
    });
  },

  sounds(box, { answer, next, stage }) {
    const set = weightedPick(stage, SOUND_SETS, x => x.id);
    const group = pick(set.groups);
    const target = pick(group);
    box.innerHTML = `
      <div class="drill-q">Which one do you hear?</div>
      <div class="audio-row"><button class="btn round replay">🔊</button></div>
      <div class="choices ${group.length === 3 ? 'three' : ''}">${group.map(([, py], i) => `<button class="choice pair" data-i="${i}">${py}</button>`).join('')}</div>
      <div class="feedback"></div>`;
    $('.replay', box).onclick = () => speak(target[0]);
    speak(target[0]);
    box.querySelectorAll('.choice').forEach(b => (b.onclick = () => {
      const chosen = group[+b.dataset.i];
      box.querySelectorAll('.choice').forEach(c => (c.disabled = true));
      box.querySelector(`.choice[data-i="${group.indexOf(target)}"]`).classList.add('right');
      const fb = $('.feedback', box);
      fb.innerHTML = `<span class="py-big">${target[1]}</span> <span class="zh">${target[0]}</span>`;
      answer(chosen === target, set.id);
      if (chosen === target) return box.append(nextButton(next, 'Next →', 900));
      b.classList.add('wrong');
      const cmp = h('<button class="btn small">🔊 Compare</button>');
      cmp.onclick = async () => { await speak(chosen[0]); speak(target[0]); };
      fb.append(h(`<div class="note"><b>${set.label}</b>: ${esc(set.tip)}</div>`), h('<div class="row"></div>'));
      fb.lastChild.append(cmp);
      box.append(nextButton(next));
    }));
  },

  say(box, { answer, undo, next, run, stage }) {
    if (!navigator.mediaDevices?.getUserMedia) {
      box.innerHTML = '<p class="muted">This browser can\'t use the microphone, so this stage can\'t be checked here. Try another browser, or skip the stage from the Me tab.</p>';
      return;
    }
    const set = pick(TONE_SETS);
    const t = weightedPick(stage, [1, 2, 3, 4], n => n);
    const info = TONE_INFO[t - 1];
    box.innerHTML = `
      <div class="drill-q">Say <span class="py-big t${t}">${set.py[t - 1]}</span> <span class="zh">${set.zh[t - 1]}</span></div>
      <div class="muted small center">${info.name}, ${info.shape}. ${info.tip}</div>
      <div class="audio-row"><button class="btn round replay" aria-label="Hear it">🔊</button><button class="btn mic rec">🎙 Record</button></div>
      <canvas class="pitch" width="640" height="300"></canvas>
      <div class="legend muted small"><span class="dash"></span> target shape &nbsp; <span class="solid"></span> your voice</div>
      <div class="verdict"></div>
      <div class="row after hidden"><button class="btn small mine">▶ You</button><button class="btn small nocount">Don't count this one</button></div>`;
    const canvas = $('canvas', box);
    drawPitch(canvas, t, []);
    $('.replay', box).onclick = () => speak(set.zh[t - 1]);
    const rec = $('.rec', box);
    rec.onclick = async () => {
      stopSpeaking();
      rec.disabled = true; rec.classList.add('listening'); rec.textContent = '🎙 Speak now…';
      try {
        const { values, url } = await trackPitch(1600, (_, vals) => drawPitch(canvas, t, cleanContour(vals)));
        const contour = cleanContour(values);
        drawPitch(canvas, t, contour);
        const heard = classifyTone(contour);
        if (!heard) {
          $('.verdict', box).innerHTML = '<span class="muted">No clear voice detected. Try again, a little louder and closer. (Not counted.)</span>';
          rec.disabled = false; rec.classList.remove('listening'); rec.textContent = '🎙 Try again';
          return;
        }
        const ok = heard === t;
        answer(ok, t);
        $('.verdict', box).innerHTML = ok
          ? '<span class="badge good">✓ That was tone ' + t + '</span>'
          : `<span class="badge miss">✗ Sounded like tone ${heard} (${TONE_INFO[heard - 1].shape})</span>`;
        rec.remove();
        if (url) $('.mine', box).onclick = () => new Audio(url).play();
        else $('.mine', box).remove();
        const nc = $('.nocount', box);
        if (run.passedNow) nc.remove();
        else nc.onclick = () => { undo(); next(); };
        $('.after', box).classList.remove('hidden');
        box.append(nextButton(next));
      } catch {
        $('.verdict', box).innerHTML = '<span class="muted">Microphone permission was denied.</span>';
        rec.disabled = false; rec.classList.remove('listening'); rec.textContent = '🎙 Record';
      }
    };
  },

  // Say a two-syllable word; each syllable's tone is checked against its pitch.
  saypairs(box, { answer, undo, next, run, stage }) {
    if (!navigator.mediaDevices?.getUserMedia) {
      box.innerHTML = '<p class="muted">This browser can\'t use the microphone, so this stage can\'t be checked here. Try another browser, or skip the stage from the Me tab.</p>';
      return;
    }
    const word = weightedPick(stage, PAIR_WORDS, w => w.zh);
    const syl = syllables(word.py);
    const tones = syl.map(s => s.tone);
    box.innerHTML = `
      <div class="drill-q">Say <span class="py-big">${colorPinyin(word.py)}</span> <span class="zh">${esc(word.zh)}</span></div>
      <div class="muted small center">${esc(word.en)} · tones ${tones.map(t => `<b class="t${t}">${t}</b>`).join(' – ')}</div>
      <div class="audio-row"><button class="btn round replay" aria-label="Hear it">🔊</button><button class="btn round slow" aria-label="Hear it slowly">🐢</button><button class="btn mic rec">📈 Say it</button></div>
      <canvas class="pitch compare-canvas" width="640" height="260"></canvas>
      <div class="verdict center"></div>
      <div class="row after hidden"><button class="btn small mine">▶ You</button><button class="btn small nocount">Don't count this one</button></div>`;
    const canvas = $('canvas', box);
    let contour = [];
    const draw = () => drawCompare(canvas, word.py, contour);
    draw();
    $('.replay', box).onclick = () => speak(word.zh);
    $('.slow', box).onclick = () => speak(word.zh, { slow: true });
    const rec = $('.rec', box);
    const again = text => { rec.disabled = false; rec.classList.remove('listening'); rec.textContent = text; };
    rec.onclick = async () => {
      stopSpeaking();
      rec.disabled = true; rec.classList.add('listening'); rec.textContent = '🎙 Speak now…';
      $('.verdict', box).innerHTML = '';
      try {
        // Stops by itself a moment after you finish.
        const { values, url } = await trackPitch(3000, (_, vals) => { contour = cleanContour(vals); draw(); }, { silenceMs: 700 });
        contour = cleanContour(values);
        draw();
        const res = checkPair(contour, tones);
        if (!res) {
          $('.verdict', box).innerHTML = '<span class="muted">Not enough voice to check both syllables. Try again, a little louder and slower. (Not counted.)</span>';
          return again('📈 Try again');
        }
        answer(res.map(ok => ({ correct: ok, key: word.zh })));
        const TIP = { 1: 'keep it high and level', 2: 'make it climb', 3: 'keep it low', 4: 'drop it sharply' };
        $('.verdict', box).innerHTML = `<div class="syl-row">${syl.map((s, i) =>
            `<span class="syl blank ${res[i] ? 'right' : 'wrong'}"><span class="t${s.tone}">${esc(s.text)}</span></span>`).join('')}</div>
          ${res.every(Boolean) ? '<span class="badge good">✓ Both tones</span>'
            : `<div class="muted small">${syl.map((s, i) => res[i] ? '' : `<b>${esc(s.text)}</b> (tone ${s.tone}): ${TIP[s.tone]}.`).filter(Boolean).join(' ')}</div>`}`;
        rec.remove();
        if (url) $('.mine', box).onclick = () => new Audio(url).play();
        else $('.mine', box).remove();
        const nc = $('.nocount', box);
        if (run.passedNow) nc.remove();
        else nc.onclick = () => { undo(); next(); };
        $('.after', box).classList.remove('hidden');
        box.append(nextButton(next));
      } catch {
        $('.verdict', box).innerHTML = '<span class="muted">Microphone permission was denied.</span>';
        again('📈 Say it');
      }
    };
  },

  // Hear a number and type it on a keypad.
  numbers(box, { answer, next, stage, level = levelOf(stage) }) {
    const L = NUMBER_LEVELS[level - 1];
    const key = x => `${level}:${x.answer}`;
    const x = weightedPick(stage, NUMBER_SETS[level - 1], key);
    const isPhone = level === 4, isPrice = level === 3;
    let typed = '';
    // Phone numbers are shown in their 3-4-4 groups as you type.
    const show = v => (isPhone ? [v.slice(0, 3), v.slice(3, 7), v.slice(7)].filter(Boolean).join(' ') : v);
    box.innerHTML = `
      <div class="drill-q">${isPhone ? 'Which phone number do you hear?' : isPrice ? 'How much?' : 'Which number do you hear?'}</div>
      <div class="audio-row"><button class="btn round replay">🔊</button><button class="btn round slow">🐢</button></div>
      <div class="num-display"><span class="num-typed"></span>${isPrice ? '<span class="muted"> 块</span>' : ''}</div>
      <div class="keypad">${[...'123456789'].map(d => `<button class="key" data-k="${d}">${d}</button>`).join('')}
        ${L.keys.includes('.') ? '<button class="key" data-k=".">.</button>' : '<span></span>'}
        <button class="key" data-k="0">0</button><button class="key del" data-k="del" aria-label="Delete">⌫</button></div>
      <button class="btn primary big check" disabled>Check</button>
      <div class="feedback"></div>`;
    const out = $('.num-typed', box);
    const check = $('.check', box);
    const keys = box.querySelectorAll('.key');
    const refresh = () => { out.textContent = show(typed) || '…'; check.disabled = !typed; };
    keys.forEach(b => (b.onclick = () => {
      const k = b.dataset.k;
      if (k === 'del') typed = typed.slice(0, -1);
      else if (k === '.' && (typed.includes('.') || !typed)) return;
      else if (typed.length < (isPhone ? 11 : 6)) typed += k;
      refresh();
    }));
    check.onclick = () => {
      const ok = typed === x.answer;
      $('.keypad', box).remove();
      check.remove();
      out.parentElement.classList.add(ok ? 'right' : 'wrong');
      $('.feedback', box).innerHTML = `
        ${ok ? '' : `<div>It was <b class="num-answer">${esc(show(x.answer))}${isPrice ? ' 块' : ''}</b></div>`}
        <div class="py-big">${colorPinyin(x.py)}</div><div class="zh">${esc(x.zh)}</div>`;
      answer(ok, key(x));
      box.append(nextButton(next, 'Next →', ok ? 1400 : 0));
    };
    $('.replay', box).onclick = () => speak(x.zh);
    $('.slow', box).onclick = () => speak(x.zh, { slow: true });
    refresh();
    speak(x.zh);
  },
};

function drawPitch(canvas, tone, contour) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, pad = 24;
  const css = getComputedStyle(document.body);
  ctx.clearRect(0, 0, W, H);
  const y = st => H / 2 - (st / 8) * (H / 2 - pad);
  ctx.strokeStyle = css.getPropertyValue('--line');
  ctx.lineWidth = 1;
  for (const st of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(pad, y(st)); ctx.lineTo(W - pad, y(st)); ctx.stroke(); }

  // Target: Chao tone numbers (1–5) → semitones, centred on their mean.
  const path = TONE_INFO[tone - 1].path;
  const mean = path.reduce((s, p) => s + p[1], 0) / path.length;
  ctx.strokeStyle = css.getPropertyValue(`--t${tone}`);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.setLineDash([2, 18]);
  ctx.beginPath();
  path.forEach(([px, py], i) => {
    const X = pad + px * (W - 2 * pad), Y = y((py - mean) * 2.5);
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  });
  ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;

  if (contour.length < 2) return;
  const voiced = contour.filter(v => v !== null);
  const cMean = voiced.reduce((a, b) => a + b, 0) / (voiced.length || 1);
  ctx.strokeStyle = css.getPropertyValue('--ink');
  ctx.lineWidth = 5;
  ctx.beginPath();
  let pen = false;
  contour.forEach((v, i) => {
    if (v === null) { pen = false; return; }
    const X = pad + (i / (contour.length - 1)) * (W - 2 * pad), Y = y(v - cMean);
    pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    pen = true;
  });
  ctx.stroke();
}

function renderDrillDone(run) {
  releaseMic();
  const [part, whole] = run.stage.id === 'saypairs' ? ['syllables', 'words'] : ['tones', 'phrases'];
  const good = (run.parts ? run.partsRight / run.parts : run.right / run.size) >= 0.9;
  const el = h(`<section class="study done">
      <div class="big-emoji">${good ? '🌟' : '💪'}</div>
      <h2>${run.parts ? `${run.partsRight}/${run.parts} ${part}` : `${run.right}/${run.size}`} this round</h2>
      ${run.parts ? `<p class="muted">${run.right} of ${run.size} ${whole} fully right</p>` : ''}
      <div class="card">${gateBox(run.stage)}</div>
      <p class="muted">${run.stage === currentStage() ? 'Keep going until you hit the pass mark. Short daily rounds beat one long cram.' : 'Practice round on a stage you\'ve already passed.'}</p>
    </section>`);
  const again = nextButton(() => startDrill(run.stage), 'Another round');
  const home = h('<button class="btn big">Done for now</button>');
  home.onclick = () => go(run.stage === currentStage() ? 'today' : 'path');
  el.append(again, home);
  view.append(el);
}

function renderLevelUp(run) {
  const { stage } = run;
  const lv = levelOf(stage);
  const el = h(`<section class="study done">
      <div class="big-emoji">⬆️</div>
      <h2>Level ${lv} of ${stage.levels.length}</h2>
      <p>You've mastered level ${lv - 1}. Next up:</p>
      <div class="card"><div class="unit-title">${esc(stage.levels[lv - 1])}</div></div>
      <p class="muted">Your count starts again for the new level.</p>
    </section>`);
  el.append(nextButton(() => { run.levelUp = false; drillNext(run); }, 'Continue'));
  view.append(el);
}

function renderStagePassed(stage) {
  releaseMic();
  const next = currentStage();
  const el = h(`<section class="study done">
      <div class="big-emoji">🎉</div>
      <h2>Stage passed!</h2>
      <p><b>${stage.emoji} ${esc(stage.title)}</b> is done.</p>
      ${next ? `<div class="card"><div class="muted">Unlocked</div><div class="unit-title">${next.emoji} ${esc(next.title)}</div></div>` : '<p>That was the last stage. 🏆</p>'}
    </section>`);
  el.append(nextButton(() => go('today'), 'Continue'));
  view.append(el);
}

// ---------------------------------------------------------------- warm-up

// Before the first phrase session of the day: about 10 quick questions from the listening
// stages you've passed, leaning towards the things you've missed, so those skills stay sharp.
const warmupStages = () => STAGES.filter(s => LISTENING.includes(s.id) && isPassed(s));

function beginSession(stage) {
  if (state.path.warmup === today() || !warmupStages().length) return startUnitSession(stage);
  warmupNext({ asked: 0, right: 0, size: 10, then: () => startUnitSession(stage) });
}

function endWarmup(run) {
  state.path.warmup = today();
  save();
  run.then();
}

function warmupNext(run) {
  freshScreen(run.asked / run.size, () => go('today'));
  if (run.asked >= run.size) return renderWarmupDone(run);
  // A stage comes up more often the more of its items you've been missing.
  const stages = warmupStages();
  const weight = s => 1 + Object.values(state.path.miss[s.id] || {}).reduce((a, b) => a + b, 0);
  const [stage] = weightedSample(stages, weight, 1);
  // Warm-up questions stay quick: short phrases, and numbers from any level.
  const level = stage.id === 'phrases' ? 2 : stage.id === 'numbers' ? 1 + Math.floor(Math.random() * NUMBER_LEVELS.length) : undefined;
  const box = h('<section class="study drill"></section>');
  const label = h(`<div class="center"><span class="kind">☀️ Warm-up · ${esc(stage.title)}</span></div>`);
  const skip = h('<button class="link-btn muted small">Skip the warm-up</button>');
  skip.onclick = () => endWarmup(run);
  view.append(label, box, skip);
  const { answer, undo } = answerFns(run, stage);
  DRILLS[stage.id](box, { answer, undo, next: () => warmupNext(run), run, stage, level });
}

function renderWarmupDone(run) {
  const el = h(`<section class="study done">
      <div class="big-emoji">☀️</div>
      <h2>Warmed up: ${run.right}/${run.asked}</h2>
      <p class="muted">Anything you missed will come up more often, here and in its stage.</p>
    </section>`);
  el.append(nextButton(() => endWarmup(run), 'On to today\'s session →'));
  view.append(el);
}

// ---------------------------------------------------------------- phrase sessions

let session = null;

// Builds today's session: due reviews first, then new phrases two at a time
// (introduce 2 → listen to both → say both → next 2).
function startUnitSession(stage) {
  const units = unlockedUnitIds();
  const queue = dueCards(units).map(id => ({ type: 'card', id }));
  // Cards coming due within the next half hour (e.g. ones just missed) wait in the session too.
  const pending = dueCards(units, soon()).filter(id => !queue.some(q => q.id === id))
    .map(id => ({ due: +new Date(state.cards[id].due), step: { type: 'card', id } }));
  const fresh = stage ? nextNewItems(newRemainingToday(), stage.id) : [];
  for (let i = 0; i < fresh.length; i += 2) {
    const batch = fresh.slice(i, i + 2);
    batch.forEach(item => queue.push({ type: 'intro', item }));
    batch.forEach(item => queue.push({ type: 'card', id: `${item.id}:listen` }));
    batch.forEach(item => queue.push({ type: 'card', id: `${item.id}:speak` }));
  }
  if (!queue.length && !pending.length) return;
  session = { queue, pending, done: 0 };
  nextStep();
}

// Cards you just got wrong (or just learned) come back when they're actually due,
// not after a fixed number of other cards.
function nextStep() {
  clearInterval(waitTimer);
  if (!session) return;
  const now = Date.now();
  session.pending.sort((a, b) => a.due - b.due);
  let step;
  if (session.pending[0]?.due <= now) step = session.pending.shift().step;
  else if (session.queue.length) step = session.queue.shift();
  const total = session.done + session.queue.length + session.pending.length + (step ? 1 : 0);
  freshScreen(total ? session.done / total : 1, () => go('today'));
  if (!step) return session.pending.length ? renderWait() : renderSessionDone();
  if (step.type === 'card' && !state.cards[step.id]) return nextStep();
  if (step.type === 'intro') renderIntro(step.item);
  else renderCard(step.id);
}

function advance() {
  session.done++;
  nextStep();
}

function renderWait() {
  const el = h(`<section class="study done">
      <div class="big-emoji">⏳</div>
      <h2>Short break</h2>
      <p>The cards you just practised come back after a short gap, which helps them stick. Next one in <b class="cd"></b>${session.pending.length > 1 ? ` <span class="muted">(${session.pending.length} waiting)</span>` : ''}.</p>
    </section>`);
  const now = h('<button class="btn primary big">Show now</button>');
  now.onclick = () => { session.pending[0].due = 0; nextStep(); };
  const stop = h('<button class="btn big">Finish for now</button>');
  stop.onclick = renderSessionDone;
  el.append(now, stop);
  view.append(el);
  const tick = () => {
    const ms = session.pending[0].due - Date.now();
    if (ms <= 0) return nextStep();
    const s = Math.ceil(ms / 1000);
    $('.cd', el).textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  tick();
  waitTimer = setInterval(tick, 1000);
}

function renderIntro(item) {
  const unit = UNITS.find(u => u.id === item.unit);
  const el = h(`<section class="study">
      <div class="kind new">New phrase · ${unit.emoji} ${esc(unit.title)}</div>
      ${phraseBlock(item)}
      <div class="slot-audio"></div>
      ${item.note ? `<div class="note">💡 ${esc(item.note)}</div>` : ''}
      <div class="step-label">Listen, then say it out loud 2–3 times:</div>
      <div class="slot-speak"></div>
      ${exampleBlock(item)}
      <button class="btn primary big next">Got it →</button>
    </section>`);
  $('.slot-audio', el).replaceWith(audioButtons(item.zh));
  $('.slot-speak', el).replaceWith(speakCheck(item.zh, { py: item.py }));
  wireExample(el, item);
  $('.next', el).onclick = () => { introduce(item.id); advance(); };
  view.append(el);
  speak(item.zh);
}

// Hint for Speak cards: first the first letter of every syllable, then the whole first syllable.
function hintText(item, level) {
  const syl = syllables(item.py.split('/')[0]);
  return syl.map((s, i) => {
    const shown = level >= 2 && i === 0 ? s.text : `${s.text[0]}…`;
    return `<span class="t${s.tone}">${esc(shown)}</span>`;
  }).join(' ');
}

function renderCard(cardId) {
  const [itemId, kind] = cardId.split(':');
  const item = ITEM_BY_ID[itemId];
  if (!item) return advance();
  let suggested = null;
  let hints = 0;

  const el = h(`<section class="study">
      <div class="kind ${kind}">${kind === 'listen' ? '👂 Listen: what does it mean?' : '🗣 Speak: say it in Chinese'}</div>
      <div class="prompt"></div>
      <div class="answer hidden"></div>
      <button class="btn primary big reveal">Show answer</button>
      <div class="grades hidden"></div>
    </section>`);
  const prompt = $('.prompt', el), answer = $('.answer', el);

  if (kind === 'listen') {
    prompt.append(audioButtons(item.zh));
    speak(item.zh);
  } else {
    prompt.append(h(`<div class="phrase big"><div class="en prompt-en">${esc(item.en)}</div></div>`));
    const hint = h('<div class="hint"><button class="btn small hint-btn">💡 Hint</button><div class="hint-text py"></div></div>');
    $('.hint-btn', hint).onclick = () => {
      hints++;
      $('.hint-text', hint).innerHTML = hintText(item, hints);
      if (hints >= 2 || syllables(item.py).length < 2) $('.hint-btn', hint).remove();
      else $('.hint-btn', hint).textContent = '💡 More';
    };
    prompt.append(hint);
    prompt.append(speakCheck(item.zh, { py: item.py, hidden: true, onResult: s => (suggested = s >= 0.99 ? Rating.Good : s >= 0.6 ? Rating.Hard : Rating.Again) }));
  }

  $('.reveal', el).onclick = () => {
    answer.innerHTML = `${phraseBlock(item)}${item.note ? `<div class="note">💡 ${esc(item.note)}</div>` : ''}${exampleBlock(item)}`;
    wireExample(answer, item);
    answer.classList.remove('hidden');
    $('.reveal', el).remove();
    if (kind === 'speak') {
      // The answer goes on top, with your recording (if you made one) under it to compare.
      prompt.querySelector('.phrase')?.remove();
      prompt.querySelector('.hint')?.remove();
      $('.phrase', answer).after(audioButtons(item.zh), prompt);
      prompt.querySelector('.speak-check')?.reveal?.();
      speak(item.zh);
      // Needing a hint means it wasn't a clean recall.
      if (hints) suggested = suggested === Rating.Again ? Rating.Again : Rating.Hard;
    }
    renderGrades($('.grades', el), cardId, suggested, hints);
  };
  view.append(el);
}

function renderGrades(box, cardId, suggested, hints) {
  const iv = previewIntervals(cardId);
  const labels = [[Rating.Again, 'Again', 'again'], [Rating.Hard, 'Hard', 'hard'], [Rating.Good, 'Good', 'good'], [Rating.Easy, 'Easy', 'easy']];
  box.innerHTML = `<div class="muted small center">How well did you know it?${hints ? ' (You used a hint, so Hard at best.)' : ''}</div><div class="grade-row"></div>`;
  const row = $('.grade-row', box);
  for (const [r, label, cls] of labels) {
    const b = h(`<button class="grade ${cls} ${r === suggested ? 'suggested' : ''}"><b>${label}</b><span>${formatInterval(iv[r])}</span></button>`);
    b.onclick = () => {
      const card = grade(cardId, r);
      const due = new Date(card.due).getTime();
      // Same-day learning steps come back in this session once they're due.
      if (due - Date.now() < 30 * 60000) session.pending.push({ due, step: { type: 'card', id: cardId } });
      advance();
    };
    row.append(b);
  }
  box.classList.remove('hidden');
}

function renderSessionDone() {
  clearInterval(waitTimer);
  const later = session?.pending.length || 0;
  const el = h(`<section class="study done">
      <div class="big-emoji">🎉</div>
      <h2>太好了！<span class="muted">tài hǎo le!</span></h2>
      <p>Session complete: ${state.day.reviews} reviews today.</p>
      ${later ? `<p class="muted">${later} card${later > 1 ? 's are' : ' is'} still in short-term learning. You'll see ${later > 1 ? 'them' : 'it'} next time you open a session.</p>` : ''}
    </section>`);
  el.append(nextButton(() => go('today'), 'Back home'));
  view.replaceChildren(el);
  session = null;
}

// ---------------------------------------------------------------- unit test

function startUnitTest(stage) {
  state.path.testTried[stage.id] = today();
  save();
  const items = stage.unit.items;
  const qs = shuffle(items.flatMap(item => [{ item, kind: 'listen' }, { item, kind: 'speak' }]));
  testNext({ stage, qs, i: 0, right: 0, missed: [] });
}

function testNext(run) {
  freshScreen(run.i / run.qs.length, () => {
    if (confirm('Leave the test? It will count as taken today, so you can retry tomorrow.')) go('today');
  });
  if (run.i >= run.qs.length) return renderTestResult(run);
  const { item, kind } = run.qs[run.i];
  const done = ok => {
    if (ok) run.right++;
    else run.missed.push(`${item.id}:${kind}`);
    run.i++;
  };
  const el = h(`<section class="study">
      <div class="kind ${kind}">📝 Test ${run.i + 1}/${run.qs.length} · ${kind === 'listen' ? '👂 What does it mean?' : '🗣 Say it in Chinese'}</div>
      <div class="q"></div>
    </section>`);
  const q = $('.q', el);
  view.append(el);

  if (kind === 'listen') {
    const others = shuffle(run.stage.unit.items.filter(i => i !== item && i.en !== item.en)).slice(0, 3);
    const opts = shuffle([item, ...others]);
    q.append(audioButtons(item.zh));
    q.append(h(`<div class="choices one">${opts.map((o, i) => `<button class="choice" data-i="${i}">${esc(o.en)}</button>`).join('')}</div>`));
    speak(item.zh);
    q.querySelectorAll('.choice').forEach(b => (b.onclick = () => {
      const ok = opts[+b.dataset.i] === item;
      q.querySelectorAll('.choice').forEach(c => (c.disabled = true));
      q.querySelector(`.choice[data-i="${opts.indexOf(item)}"]`).classList.add('right');
      if (!ok) b.classList.add('wrong');
      done(ok);
      q.append(h(phraseBlock(item, { big: false })), nextButton(() => testNext(run)));
    }));
  } else {
    let score = null;
    const ask = h(`<div class="phrase big"><div class="en prompt-en">${esc(item.en)}</div></div>`);
    const check = speakCheck(item.zh, { py: item.py, hidden: true, onResult: s => (score = s) });
    q.append(ask, check);
    const reveal = h('<button class="btn primary big">Show answer</button>');
    reveal.onclick = () => {
      reveal.remove();
      check.reveal?.();
      ask.replaceWith(h(phraseBlock(item)), audioButtons(item.zh));
      speak(item.zh);
      const judge = h(`<div>
          <div class="muted small center">Did you say it correctly, tones included?</div>
          <div class="row"><button class="btn big no">✗ Not quite</button><button class="btn big yes">✓ Yes</button></div>
        </div>`);
      if (score !== null) $(score >= 0.8 ? '.yes' : '.no', judge).classList.add('primary');
      $('.yes', judge).onclick = () => { done(true); testNext(run); };
      $('.no', judge).onclick = () => { done(false); testNext(run); };
      q.append(judge);
    };
    q.append(reveal);
  }
}

function renderTestResult(run) {
  const us = unitStatus(run.stage);
  const passed = run.right >= us.need;
  // Missed cards go back into short-term relearning. Correct answers leave the schedule alone.
  run.missed.forEach(id => grade(id, Rating.Again));
  if (passed) passStage(run.stage);
  const el = h(`<section class="study done">
      <div class="big-emoji">${passed ? '🎉' : '💪'}</div>
      <h2>${run.right}/${run.qs.length} correct</h2>
      <p>${passed ? `Unit passed: <b>${run.stage.emoji} ${esc(run.stage.title)}</b>.` : `Pass mark is ${us.need}/${run.qs.length}. The ${run.missed.length} you missed are back in review, and you can retake the test tomorrow.`}</p>
      ${!passed ? `<div class="missed card">${run.missed.map(id => {
        const [itemId, kind] = id.split(':'); const i = ITEM_BY_ID[itemId];
        return `<div class="row-item"><span>${kind === 'listen' ? '👂' : '🗣'}</span><div class="grow"><div class="py">${colorPinyin(i.py)}</div><div class="en muted small">${esc(i.en)}</div></div></div>`;
      }).join('')}</div>` : ''}
      ${passed && currentStage() ? `<div class="card"><div class="muted">Unlocked</div><div class="unit-title">${currentStage().emoji} ${esc(currentStage().title)}</div></div>` : ''}
    </section>`);
  if (run.missed.length) {
    el.append(nextButton(() => {
      session = { queue: shuffle(run.missed.map(id => ({ type: 'card', id }))), pending: [], done: 0 };
      nextStep();
    }, 'Relearn the ones you missed'));
    const home = h('<button class="btn big">Later</button>');
    home.onclick = () => go('today');
    el.append(home);
  } else el.append(nextButton(() => go('today'), 'Continue'));
  view.append(el);
}

// ---------------------------------------------------------------- path

function renderPath() {
  const cur = currentStage();
  const learned = new Set(state.learned);
  const row = s => {
    const status = isPassed(s) ? 'passed' : s === cur ? 'current' : 'locked';
    const icon = status === 'passed' ? '✓' : status === 'current' ? '▶' : '🔒';
    const tappable = status === 'current' || (status === 'passed' && s.kind === 'drill');
    return `<div class="path-row ${status}" data-id="${s.id}">
        <span class="path-icon">${icon}</span>
        <span class="path-emoji">${s.emoji}</span>
        <span class="grow"><b>${esc(s.title)}</b></span>
        ${tappable ? '<span class="path-go" aria-hidden="true">›</span>' : ''}
      </div>
      ${s.kind === 'unit' && status !== 'locked' ? `<details class="unit-list"><summary class="muted small">Phrases (${s.unit.items.filter(i => learned.has(i.id)).length}/${s.unit.items.length} learned)</summary>
        ${s.unit.items.filter(i => learned.has(i.id)).map(i => `<div class="row-item" data-item="${i.id}">
            <button class="icon-btn play" aria-label="Play">🔊</button>
            <div class="grow"><div class="py">${colorPinyin(i.py)}</div><div class="line"><span class="zh">${esc(i.zh)}</span> <span class="en">${esc(i.en)}</span></div></div>
            <button class="icon-btn ex" aria-label="Play example">💬</button>
          </div>`).join('') || '<div class="muted small pad">None yet.</div>'}
      </details>` : ''}`;
  };
  const el = h(`<section class="path">
      <h1>Path <span class="muted">道路 dàolù</span></h1>
      <p class="muted small">One stage at a time. Each one unlocks when you've mastered the one before it.</p>
      ${STAGES.map(row).join('')}
      ${learned.size >= 3 ? '<h2>Extra practice</h2><button class="btn big shadow">🗣 Shadowing practice</button><p class="muted small">Listen to example sentences from phrases you know and repeat each one straight away, copying the rhythm and melody.</p>' : ''}
    </section>`);
  el.querySelectorAll('.path-row').forEach(r => {
    const s = STAGES.find(x => x.id === r.dataset.id);
    if (s === cur) r.onclick = () => go('today');
    else if (isPassed(s) && s.kind === 'drill') r.onclick = () => startDrill(s);
  });
  el.querySelectorAll('.row-item').forEach(r => {
    const item = ITEM_BY_ID[r.dataset.item];
    $('.play', r).onclick = () => speak(item.zh);
    $('.ex', r).onclick = () => speak(item.ex[0]);
  });
  const sh = $('.shadow', el);
  if (sh) sh.onclick = startShadowing;
  view.append(el);
}

function startShadowing() {
  const items = shuffle(state.learned.map(id => ITEM_BY_ID[id]).filter(Boolean)).slice(0, 10);
  let i = 0;
  const show = () => {
    if (i >= items.length) return go('path');
    freshScreen(i / items.length, () => go('path'));
    const [zh, py, en] = items[i].ex;
    const el = h(`<section class="study">
        <div class="kind speak">🗣 Shadow: listen, then repeat right away</div>
        <div class="phrase big"><div class="py">${colorPinyin(py)}</div>${saidLine(py)}${state.settings.showHanzi ? `<div class="zh">${esc(zh)}</div>` : ''}<div class="en">${esc(en)}</div></div>
        <div class="slot-audio"></div>
        <div class="slot-speak"></div>
        <button class="btn primary big next">Next →</button>
      </section>`);
    $('.slot-audio', el).replaceWith(audioButtons(zh));
    $('.slot-speak', el).replaceWith(speakCheck(zh, { py }));
    $('.next', el).onclick = () => { i++; show(); };
    view.append(el);
    speak(zh);
  };
  show();
}

// ---------------------------------------------------------------- me / settings

function backupText() {
  const d = daysSinceBackup();
  return d === null ? 'No backup yet.' : d === 0 ? 'Last backup: today.' : `Last backup: ${d} day${d > 1 ? 's' : ''} ago.`;
}

// Nudges towards a backup once there's real progress to lose and none for two weeks.
function backupDue() {
  const d = daysSinceBackup();
  return (state.learned.length >= 5 || state.path.stage >= 2) && (d === null || d >= 14);
}

function renderMe() {
  const s = stats();
  const st = state.settings;
  const cur = currentStage();
  const el = h(`<section class="me">
      <h1>Me <span class="muted">我 wǒ</span></h1>
      <div class="stat-row">
        <div class="stat"><b>${currentStreak()}</b><span>day streak</span></div>
        <div class="stat"><b>${STAGES.filter(isPassed).length}<small>/${STAGES.length}</small></b><span>stages passed</span></div>
        <div class="stat"><b>${s.learned}</b><span>phrases learned</span></div>
      </div>

      <h2>Settings</h2>
      <div class="group">
        <label class="setting">New phrases per day
          <select class="npd">${[3, 5, 8, 10, 15].map(n => `<option ${n === st.newPerDay ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </label>
        <label class="setting">Speech speed <span class="rate-val">${st.rate.toFixed(2)}×</span>
          <input type="range" class="rate" min="0.5" max="1.2" step="0.05" value="${st.rate}">
        </label>
        <label class="setting">Show characters (汉字)
          <input type="checkbox" class="hz" ${st.showHanzi ? 'checked' : ''}>
        </label>
        <div class="setting col"><span>Device check</span>
          <span class="muted small">Chinese voice: ${hasChineseVoice() ? '✓' : '✗ not found'} · Speech recognition: ${canRecognize ? '✓' : '✗ (you\'ll record and compare instead)'} · Recording: ${canRecord ? '✓' : '✗'}</span>
        </div>
        ${cur ? `<div class="setting col"><span>Skip the current stage</span>
          <span class="muted small">Only if you already know "${esc(cur.title)}" well, or your device can't run it (for example, no microphone).</span>
          <button class="btn small skip">Skip "${esc(cur.title)}"</button>
        </div>` : ''}
      </div>

      <h2>App updates</h2>
      <div class="group"><div class="setting col"><span class="update-status">${updateText()}</span>
        <span class="muted small">The app checks each time you open it. Force update re-downloads everything, in case something looks out of date.</span>
        <div class="row left">
          <button class="btn small check-update">Check now</button>
          <button class="btn small force-update">Force update</button>
        </div>
      </div></div>

      <h2>Backup</h2>
      <div class="group"><div class="setting col">
        <span><b>${backupText()}</b></span>
        <span class="muted small">Progress is saved on this device only. Export a backup now and then, and to move to another phone or browser.</span>
        <div class="row left">
          <button class="btn small export">⬇ Export</button>
          <label class="btn small import">⬆ Import<input type="file" accept="application/json,.json" hidden></label>
          <button class="btn small danger reset">Reset</button>
        </div>
      </div></div>
    </section>`);
  $('.npd', el).onchange = e => { st.newPerDay = +e.target.value; save(); };
  $('.rate', el).oninput = e => {
    st.rate = +e.target.value; setRate(st.rate); save();
    $('.rate-val', el).textContent = `${st.rate.toFixed(2)}×`;
  };
  $('.rate', el).onchange = () => speak('你好，很高兴认识你');
  $('.hz', el).onchange = e => { st.showHanzi = e.target.checked; save(); };
  const skip = $('.skip', el);
  if (skip) skip.onclick = () => {
    if (confirm(`Skip "${cur.title}" and unlock the next stage?`)) { passStage(cur); go('today'); }
  };
  $('.check-update', el).onclick = () => checkForUpdate({ force: true });
  $('.force-update', el).onclick = runForceUpdate;
  $('.export', el).onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
    a.download = `chinese-progress-${today()}.json`;
    a.click();
    go('me');
  };
  $('.import input', el).onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try { importData(await f.text()); alert('Progress imported.'); go('me'); }
    catch (err) { alert(`Import failed: ${err.message}`); }
  };
  $('.reset', el).onclick = () => {
    if (confirm('Delete all progress on this device? This can\'t be undone (unless you exported a backup).')) { resetAll(); go('today'); }
  };
  view.append(el);
}

// ---------------------------------------------------------------- updates

function updateText() {
  const at = update.checkedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    checking: 'Checking for updates…',
    current: `✓ Up to date (checked ${at})`,
    available: '✨ A new version is available.',
    offline: `Couldn't check: you seem to be offline${at ? ` (${at})` : ''}.`,
  }[update.status];
}

// A pill that slides down from the top: "Checking for updates…" → "Up to date" (then slides away),
// or "A new version is available" with Update, which shows the download and restarts the app.
const updateBar = h(`<div class="update-bar" role="status" aria-live="polite">
    <span class="ub-icon" aria-hidden="true"></span>
    <span class="ub-text"></span>
    <button class="btn small ub-go force-update">Update</button>
    <button class="icon-btn ub-close" aria-label="Not now">✕</button>
    <span class="ub-progress"><i></i></span>
  </div>`);
document.body.prepend(updateBar);
const STICKY = ['available', 'downloading', 'restarting', 'failed']; // these push the page down instead of covering it
const MIN_CHECKING = 700; // a check often takes 100 ms; keep the spinner up long enough to read
let barTimer = null;
let checkingSince = 0;
let updating = false;
let updateDismissed = false;
let justUpdated = false;
try { justUpdated = !!sessionStorage.getItem('justUpdated'); sessionStorage.removeItem('justUpdated'); } catch {}

function setBar(state, text, { hideAfter = 0 } = {}) {
  clearTimeout(barTimer);
  updateBar.dataset.state = state;
  $('.ub-text', updateBar).textContent = text;
  $('.ub-go', updateBar).textContent = state === 'failed' ? 'Retry' : 'Update';
  updateBar.classList.add('show');
  document.body.classList.toggle('has-update', STICKY.includes(state));
  if (hideAfter) barTimer = setTimeout(hideBar, hideAfter);
}

function hideBar() {
  clearTimeout(barTimer);
  updateBar.classList.remove('show');
  document.body.classList.remove('has-update');
}

$('.ub-go', updateBar).onclick = runForceUpdate;
$('.ub-close', updateBar).onclick = () => { if (updateBar.dataset.state === 'available') updateDismissed = true; hideBar(); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') updateDismissed = false; });

function showUpdate() {
  document.querySelectorAll('.update-status').forEach(e => { e.textContent = updateText(); });
  if (updating) return;
  const status = update.status;
  const offering = updateBar.classList.contains('show') && updateBar.dataset.state === 'available';
  if (status === 'checking') {
    if (!offering) { checkingSince = Date.now(); setBar('checking', 'Checking for updates…'); }
    return;
  }
  const result = () => {
    if (status === 'current') {
      setBar('current', justUpdated ? 'Updated to the latest version' : 'Up to date', { hideAfter: 1600 });
      justUpdated = false;
    } else if (status === 'offline') setBar('offline', 'Offline · using the saved version', { hideAfter: 2200 });
    else if (updateDismissed) hideBar();
    else setBar('available', 'New version available');
  };
  clearTimeout(barTimer);
  barTimer = setTimeout(result, Math.max(0, checkingSince + MIN_CHECKING - Date.now()));
}

async function runForceUpdate() {
  if (updating) return;
  updating = true;
  document.querySelectorAll('.force-update').forEach(b => { b.disabled = true; });
  const fill = $('.ub-progress i', updateBar);
  const started = Date.now();
  const ok = await downloadUpdate((done, total) => {
    setBar('downloading', `Downloading update… ${done}/${total}`);
    fill.style.width = `${(100 * done) / total}%`;
  });
  await new Promise(r => setTimeout(r, Math.max(0, started + 900 - Date.now()))); // let the bar fill visibly
  if (ok) {
    setBar('restarting', 'Update ready · restarting…');
    try { sessionStorage.setItem('justUpdated', '1'); } catch {}
    setTimeout(() => location.reload(), 900);
  } else {
    updating = false;
    document.querySelectorAll('.force-update').forEach(b => { b.disabled = false; });
    fill.style.width = '0';
    setBar('failed', 'Update failed · offline?');
  }
}

// ---------------------------------------------------------------- boot

initTTS(() => {
  voicesSettled = true;
  if (hasChineseVoice()) $('.warn')?.remove();
  else $('.warn')?.classList.remove('hidden');
});
setRate(state.settings.rate);
requestPersistence();
go('today');

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
startUpdateChecks(showUpdate);
