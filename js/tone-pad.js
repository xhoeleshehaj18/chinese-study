// Drawing pad for "Hear tones in phrases": you draw the tone you hear, loosely, and it snaps to
// the nearest tone shape. Height counts as well as direction, on Chao's 1 (low) – 5 (high) scale:
// a fall from the top is a 4th tone, anything low (a dip, a low fall, low and level) is a 3rd,
// level and high is a 1st, a rise is a 2nd, and a tap is a neutral tone.

// Pad heights run 0 (bottom guide line, Chao 1) to 1 (top guide line, Chao 5).
const chao = c => (c - 1) / 4;

// The shapes a stroke snaps to, as [x 0–1, Chao] points.
export const SHAPES = {
  1: [[0, 5], [1, 5]],
  2: [[0, 3], [1, 5]],
  '3dip': [[0, 2.2], [0.2, 1.4], [0.4, 1], [0.6, 1.3], [0.8, 2.3], [1, 3.8]],
  '3low': [[0, 2], [1, 1]],
  4: [[0, 5], [1, 1]],
  5: [[0.5, 3]], // a dot
};

// ---------------------------------------------------------------- reading a stroke

const TAP = 16;       // px: a stroke shorter than this (or within a 10 px box) is a tap
const TOO_SMALL = 24; // px: anything else smaller than this can't be read
const TURN = 0.12;    // how far (of the pad's height) the pen must go back before it counts as a turn

const lengthOf = ps => ps.slice(1).reduce((a, p, i) => a + Math.hypot(p.x - ps[i].x, p.y - ps[i].y), 0);

// `n` points evenly spaced along the path.
function resample(ps, n) {
  const total = lengthOf(ps);
  if (!total) return Array.from({ length: n }, () => ({ ...ps[0] }));
  const out = [{ ...ps[0] }];
  let want = total / (n - 1), acc = 0;
  for (let i = 1; i < ps.length && out.length < n; i++) {
    let a = ps[i - 1];
    const b = ps[i];
    let d = Math.hypot(b.x - a.x, b.y - a.y);
    while (acc + d >= want && out.length < n) {
      const t = (want - acc) / d;
      a = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
      out.push(a);
      d = Math.hypot(b.x - a.x, b.y - a.y);
      acc = 0;
    }
    acc += d;
  }
  while (out.length < n) out.push({ ...ps[ps.length - 1] });
  return out;
}

// Indices where the height turns round by at least `turn` (first and last move included),
// ignoring smaller wobbles and hooks at either end. null when it never moves that much.
function pivots(hs, turn) {
  let dir = 0, lo = 0, hi = 0, ext = 0;
  const piv = [];
  for (let i = 1; i < hs.length; i++) {
    if (dir === 0) {
      if (hs[i] > hs[hi]) hi = i;
      if (hs[i] < hs[lo]) lo = i;
      if (hs[hi] - hs[lo] >= turn) {
        dir = hi > lo ? 1 : -1;
        piv.push(hi > lo ? lo : hi);
        ext = hi > lo ? hi : lo;
      }
    } else if (dir * (hs[i] - hs[ext]) > 0) ext = i;
    else if (dir * (hs[ext] - hs[i]) >= turn) { piv.push(ext); dir = -dir; ext = i; }
  }
  if (!dir) return null;
  piv.push(ext);
  return piv;
}

// Reads a stroke: `pts` are [{ x, y }] in px, relative to the pad's drawing area of
// `w` × `h` px (y down; the area's top and bottom are the top and bottom guide lines).
// Returns { tone, shape } (shape: a key of SHAPES) or { retry } when it isn't any tone.
export function readStroke(pts, w, h) {
  if (!pts.length) return { retry: 'empty' };
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  if (lengthOf(pts) < TAP || size < 10) return { tone: 5, shape: 5 };
  if (size < TOO_SMALL) return { retry: 'small' };

  let ps = resample(pts, 32);
  // Drawn right to left: read it the way it looks.
  if (ps[31].x - ps[0].x < -10) ps = ps.reverse();
  const hs = ps.map(p => 1 - p.y / h);
  const span = Math.max(1, Math.abs(ps[31].x - ps[0].x));
  const mean = hs.reduce((a, b) => a + b, 0) / hs.length;
  const level = () => (mean < 0.45 ? { tone: 3, shape: '3low' } : { tone: 1, shape: 1 });
  const fall = (from, drop) => (from >= 0.6 || drop >= 0.45 ? { tone: 4, shape: 4 } : { tone: 3, shape: '3low' });
  const rise = () => {
    // A rise that only starts after staying low for a while is a 3rd tone drawn as "low, then up".
    const low = Math.min(...hs);
    let from = 0;
    hs.forEach((v, i) => { if (v <= low + 0.08 && i < hs.length / 1.2) from = i; });
    const late = (ps[from].x - ps[0].x) / span;
    return late >= 0.35 && low < 0.35 ? { tone: 3, shape: '3dip' } : { tone: 2, shape: 2 };
  };

  const piv = pivots(hs, TURN);
  if (!piv) return level();
  const legs = piv.slice(1).map((p, i) => hs[p] - hs[piv[i]]);
  if (legs.length === 1) {
    const d = legs[0];
    const dxLeg = Math.abs(ps[piv[1]].x - ps[piv[0]].x);
    // Only a little slope over a long way: level, not a rise or a fall.
    if (Math.abs(d) < 0.22 && Math.abs(d * h) < 0.25 * dxLeg) return level();
    return d > 0 ? rise() : fall(hs[piv[0]], -d);
  }
  if (legs.length === 2) {
    const [a, b] = legs.map(Math.abs);
    if (legs[0] < 0) { // down, then up
      if (a < 0.2 * b && a < 0.1) return rise(); // a small hook before a rise
      if (b < 0.2 * a && b < 0.1) return fall(hs[piv[0]], a); // a small flick up after a fall
      return { tone: 3, shape: '3dip' };
    }
    // up, then down: no tone does that, unless one side is only a hook
    if (a < 0.35 * b) return fall(hs[piv[1]], b);
    if (b < 0.35 * a) return rise();
    return { retry: 'hump' };
  }
  return { retry: 'zigzag' };
}

// ---------------------------------------------------------------- the pad

const PAD = { top: 22, bottom: 22, left: 40, right: 14 };
const SNAP_MS = 200;
const ANSWER_MS = 550;
const ease = t => 1 - (1 - t) ** 3;

// Points along a SHAPES entry (or a model contour's pts), in pad heights, across the middle of the pad.
function shapePoints(pts, x0 = 0.18, x1 = 0.82) {
  return pts.map(([x, c]) => ({ x: x0 + x * (x1 - x0), h: chao(c) }));
}

// `root` gets the canvas. onStroke(result) is called with readStroke's result after each stroke.
// Returns { snap(result), answer(pts, tone), reject(), clear(), busy } — while busy, strokes are ignored.
export function createTonePad(root, { onStroke }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pad-canvas';
  root.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  // What's on the pad, in pad units: x 0–1 across the drawing area, h 0–1 from bottom to top guide line.
  const scene = { live: null, mine: null, answer: null };
  let raf = 0;
  let guard = 0;
  const stop = () => { cancelAnimationFrame(raf); clearTimeout(guard); };
  const api = { busy: false };

  const inner = () => ({ w: W - PAD.left - PAD.right, h: H - PAD.top - PAD.bottom });
  const toPx = p => ({ X: PAD.left + p.x * inner().w, Y: PAD.top + (1 - p.h) * inner().h });

  function fit() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    render();
  }

  function line(ps, color, width, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ctx.fillStyle = color;
    if (ps.length === 1) {
      const { X, Y } = toPx(ps[0]);
      ctx.beginPath(); ctx.arc(X, Y, width * 0.9, 0, 2 * Math.PI); ctx.fill();
    } else {
      ctx.lineWidth = width;
      ctx.beginPath();
      ps.forEach((p, i) => { const { X, Y } = toPx(p); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    const css = getComputedStyle(root);
    const col = name => css.getPropertyValue(name).trim();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Guide lines at high, middle and low, with labels.
    ctx.strokeStyle = col('--line');
    ctx.lineWidth = 2;
    ctx.fillStyle = col('--muted');
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    for (const [h, label] of [[1, 'high'], [0.5, 'mid'], [0, 'low']]) {
      const { Y } = toPx({ x: 0, h });
      ctx.setLineDash(h === 0.5 ? [4, 6] : []);
      ctx.beginPath(); ctx.moveTo(PAD.left, Y); ctx.lineTo(W - PAD.right, Y); ctx.stroke();
      ctx.fillText(label, 8, Y);
    }
    ctx.setLineDash([]);
    const { mine, answer, live } = scene;
    if (mine) line(mine.pts, col(mine.tone ? `--t${mine.tone}` : '--ink'), 8, mine.fade !== undefined ? 1 - mine.fade : answer ? 0.3 : 1);
    if (answer) {
      // Drawn in from left to right.
      const n = answer.pts.length;
      const upto = answer.progress * (n - 1);
      const ps = answer.pts.slice(0, Math.floor(upto) + 1);
      const k = Math.floor(upto);
      if (k < n - 1) {
        const a = answer.pts[k], b = answer.pts[k + 1], t = upto - k;
        ps.push({ x: a.x + t * (b.x - a.x), h: a.h + t * (b.h - a.h) });
      }
      line(ps, col(`--t${answer.tone}`), 10);
    }
    if (live) line(live, col('--ink'), 6);
  }

  function animate(ms, step, done) {
    stop();
    const start = performance.now();
    let over = false;
    const end = () => {
      if (over) return;
      over = true;
      stop();
      step(ease(1));
      render();
      done?.();
    };
    const frame = now => {
      const t = (now - start) / ms;
      if (t >= 1) return end();
      step(ease(t));
      render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // Frames stop while the page is hidden, so don't leave the drill waiting on them.
    guard = setTimeout(end, ms + 100);
  }

  // Resampled so a stroke and a shape can morph into each other point by point.
  const even = (ps, n = 32) => resample(ps.map(p => ({ x: p.x, y: p.h })), n).map(p => ({ x: p.x, h: p.y }));

  let pts = null, id = null;
  const local = e => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left - PAD.left, y: e.clientY - r.top - PAD.top };
  };
  const toUnit = p => ({ x: p.x / inner().w, h: 1 - p.y / inner().h });
  // Moves and the lift are followed on the whole window, so a stroke that strays off the pad
  // still ends properly even where pointer capture isn't available.
  const move = e => {
    if (e.pointerId !== id) return;
    const all = e.getCoalescedEvents?.();
    for (const ev of all?.length ? all : [e]) pts.push(local(ev));
    scene.live = pts.map(toUnit);
    render();
  };
  const end = e => {
    if (e.pointerId !== id) return;
    id = null;
    for (const t of ['pointermove', 'pointerup', 'pointercancel']) window.removeEventListener(t, t === 'pointermove' ? move : end);
    const stroke = pts;
    pts = null;
    if (!canvas.isConnected) return; // the question was closed mid-stroke
    if (e.type === 'pointercancel') { scene.live = null; render(); return; }
    const { w, h } = inner();
    onStroke(readStroke(stroke, w, h));
  };
  canvas.addEventListener('pointerdown', e => {
    if (api.busy || id !== null) return;
    e.preventDefault();
    id = e.pointerId;
    pts = [local(e)];
    stop(); // a rejected stroke may still be fading
    try { canvas.setPointerCapture(id); } catch { /* the window listeners below cover it */ }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    scene.mine = scene.answer = null;
    scene.live = [toUnit(pts[0])];
    render();
  });

  // Morphs the stroke just drawn into its tone's shape.
  api.snap = result => new Promise(res => {
    const from = scene.live && scene.live.length > 1 && result.tone !== 5 ? even(scene.live) : null;
    const to = shapePoints(SHAPES[result.shape]);
    scene.live = null;
    if (!from) { scene.mine = { pts: to, tone: result.tone }; render(); return res(); }
    const target = even(to);
    scene.mine = { pts: from, tone: result.tone };
    animate(SNAP_MS, t => {
      scene.mine.pts = from.map((p, i) => ({ x: p.x + t * (target[i].x - p.x), h: p.h + t * (target[i].h - p.h) }));
    }, res);
  });

  // Draws the right tone (a model contour's pts) over the faded answer you gave.
  api.answer = (modelPts, tone) => {
    const pts = tone === 5 && modelPts.length > 1 ? shapePoints(modelPts, 0.4, 0.6) : shapePoints(modelPts);
    scene.answer = { pts: pts.length > 1 ? even(pts) : pts, tone, progress: 0 };
    animate(ANSWER_MS, t => (scene.answer.progress = t));
  };

  // A stroke that isn't any tone: it fades and the pad shakes.
  api.reject = () => {
    const faded = scene.live;
    scene.live = null;
    root.classList.remove('shake');
    void root.offsetWidth; // restart the animation
    root.classList.add('shake');
    if (!faded) return render();
    scene.mine = { pts: faded, tone: 0 };
    animate(300, t => (scene.mine.fade = t), () => { scene.mine = null; render(); });
  };

  api.clear = () => {
    stop();
    scene.live = scene.mine = scene.answer = null;
    render();
  };

  new ResizeObserver(fit).observe(canvas);
  fit();
  return api;
}
