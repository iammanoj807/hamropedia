// A course lesson page: the animation player, the Mermaid diagram, the
// tap-to-explain glossary and the four checks. The page works without this
// script (answers are <details>, the animation is also written out as text).
import { pageProgress, paintTopics } from './lib/progress.js';

document.documentElement.classList.add('js-lesson'); // hides diagram sources until they are drawn (or fail)
const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
// The phase's topic list sits beside the lesson on wide screens; on a phone it
// stays folded above it, so the lesson isn't pushed down the page.
if (window.matchMedia?.('(min-width: 981px)').matches) document.querySelector('.rail-phase')?.setAttribute('open', '');
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Run `fn` once, when `el` comes within `margin` of the screen. */
function whenNear(el, fn, margin = '400px') {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin: margin });
  io.observe(el);
}

// ---------------------------------------------------------------------------
// Checks: tick each one when you can do it without notes.

const { progress, checks } = pageProgress();
const prove = document.querySelector('.prove[data-topic-key]');
const topicKey = prove?.dataset.topicKey;

function paintChecks() {
  if (!topicKey) return;
  const n = progress.ticked(topicKey).length;
  const total = checks.length;
  prove.querySelectorAll('[data-check]').forEach((box) => { box.checked = progress.ticked(topicKey).includes(box.dataset.check); });
  const status = prove.querySelector('[data-prove-status]');
  if (status) status.textContent = n === total ? `All ${total} checks ticked: this topic is done.` : `${n} of ${total} checks ticked.`;
  const head = document.querySelector('[data-lesson-progress]');
  if (head) head.textContent = n === total ? 'Done' : n ? `${n} of ${total} checks` : 'Not started';
  prove.classList.toggle('done', n === total);
  paintTopics(progress, checks);
}
prove?.addEventListener('change', (e) => {
  const box = e.target.closest('[data-check]');
  if (box) { progress.toggle(topicKey, box.dataset.check, box.checked); paintChecks(); }
});
paintChecks();

// ---------------------------------------------------------------------------
// Glossary: tap an underlined word to see what it means.

const words = (() => {
  try { return JSON.parse(document.getElementById('glossary-data')?.textContent || '{}'); } catch { return {}; }
})();
const pop = document.querySelector('.term-pop');
let openTerm = null;

function closeTerm() {
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  openTerm?.setAttribute('aria-expanded', 'false');
  openTerm = null;
}
function showTerm(btn) {
  const w = words[btn.dataset.term];
  if (!pop || !w) return;
  if (openTerm === btn) { closeTerm(); return; }
  closeTerm();
  pop.querySelector('.term-pop-h').textContent = w.term;
  pop.querySelector('.term-pop-d').textContent = w.definition;
  const link = pop.querySelector('.term-pop-link');
  link.hidden = !w.learn;
  if (w.learn) { link.href = w.learn.url; link.textContent = `Learn it fully: ${w.learn.name} →`; }
  pop.setAttribute('aria-label', `What "${w.term}" means`);
  pop.hidden = false;
  if (window.innerWidth > 640) {
    const r = btn.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 32);
    pop.style.left = `${Math.max(16, Math.min(r.left + window.scrollX, window.scrollX + window.innerWidth - width - 16))}px`;
    pop.style.top = `${r.bottom + window.scrollY + 8}px`;
  } else {
    pop.style.left = '';
    pop.style.top = '';
  }
  btn.setAttribute('aria-expanded', 'true');
  openTerm = btn;
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.term');
  if (btn) {
    e.preventDefault(); // a word inside a question's <summary> shouldn't also open the answer
    showTerm(btn);
    return;
  }
  if (e.target.closest('.term-pop-x') || !e.target.closest('.term-pop')) closeTerm();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openTerm) { const b = openTerm; closeTerm(); b.focus(); }
});

// ---------------------------------------------------------------------------
// Diagrams: Mermaid is loaded only when the first diagram comes near the screen.

const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs';
const CHART_TEXT = '#d7d2ce';
const CHART_LINE = 'rgba(255,255,255,0.45)';
const CHART_COLOURS = ['#4dd0e1', '#ffca28', '#66bb6a', '#ff8a65', '#ba68c8', '#4fc3f7', '#aed581', '#f06292'];
const CHART_THEME = {
  ...Object.fromEntries(CHART_COLOURS.map((c, i) => [`pie${i + 1}`, c])),
  pieOpacity: '0.9', pieStrokeColor: '#151921', pieOuterStrokeColor: 'rgba(255,255,255,0.2)',
  pieSectionTextColor: '#0b0f14', pieTitleTextColor: CHART_TEXT, pieLegendTextColor: CHART_TEXT,
  xyChart: {
    backgroundColor: 'transparent', plotColorPalette: CHART_COLOURS.join(', '), titleColor: CHART_TEXT,
    xAxisTitleColor: CHART_TEXT, xAxisLabelColor: CHART_TEXT, xAxisTickColor: CHART_LINE, xAxisLineColor: CHART_LINE,
    yAxisTitleColor: CHART_TEXT, yAxisLabelColor: CHART_TEXT, yAxisTickColor: CHART_LINE, yAxisLineColor: CHART_LINE,
  },
};
let mermaidLoad = null;
let diagramCount = 0;
const loadMermaid = () =>
  (mermaidLoad ??= import(MERMAID).then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false, theme: 'dark', securityLevel: 'strict', suppressErrorRendering: true,
      fontFamily: getComputedStyle(document.body).fontFamily, themeVariables: CHART_THEME,
    });
    return mermaid;
  }));

document.querySelectorAll('[data-mermaid]').forEach((stage) => {
  const code = stage.querySelector('.diagram-src')?.textContent || '';
  whenNear(stage, async () => {
    const id = `mmd${++diagramCount}`;
    try {
      const mermaid = await loadMermaid();
      const { svg } = await mermaid.render(id, code);
      stage.innerHTML = svg;
      const el = stage.querySelector('svg');
      const natural = Number(el?.getAttribute('viewBox')?.split(/\s+/)[2]) || 0;
      // Shrink to fit, but not below 70% (the words get too small): scroll sideways instead.
      if (el && natural) { el.style.maxWidth = `${natural}px`; el.style.minWidth = `${Math.min(natural, Math.round(natural * 0.7))}px`; }
      stage.classList.add('drawn');
      if (/^(flowchart|graph)\s+(TD|TB)\b/.test(code.trim()) && stage.scrollWidth > stage.clientWidth) {
        stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
      }
    } catch {
      document.getElementById(`d${id}`)?.remove();
      document.getElementById(id)?.remove();
      stage.classList.add('failed'); // the source stays visible, so nothing is lost
    }
  });
});

// ---------------------------------------------------------------------------
// Animations: frames of shapes. A shape that keeps its id moves to its new
// place; the rest fade in or out. (A port of atomic-hub's AnimatedScene.)

const TRANSITION_MS = 750;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const holdFor = (f) => f.hold ?? Math.min(9000, Math.max(2500, 1500 + f.caption.length * 45));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const HEX = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i;
const parseHex = (c) => {
  const m = HEX.exec(c);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, m[2] ? parseInt(m[2], 16) : 255];
};
const hex2 = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
const lerpColor = (a, b, t) => {
  if (a === b) return b;
  const from = parseHex(a);
  const to = parseHex(b);
  if (!from || !to) return t < 0.5 ? a : b;
  const m = from.map((v, i) => lerp(v, to[i], t));
  return `#${hex2(m[0])}${hex2(m[1])}${hex2(m[2])}${hex2(m[3])}`;
};
const COLOR_KEYS = new Set(['fill', 'stroke', 'textColor']);
function blend(a, b, t) {
  const out = { ...b };
  for (const [key, target] of Object.entries(b)) {
    const start = a[key];
    if (typeof target === 'number' && typeof start === 'number') out[key] = lerp(start, target, t);
    else if (typeof target === 'string' && typeof start === 'string' && COLOR_KEYS.has(key)) out[key] = lerpColor(start, target, t);
    else if (key === 'points' && Array.isArray(start) && start.length === target.length) out[key] = target.map(([x, y], i) => [lerp(start[i][0], x, t), lerp(start[i][1], y, t)]);
    else if (start !== undefined && t < 0.5) out[key] = start;
  }
  out.opacity = lerp(a.opacity ?? 1, b.opacity ?? 1, t);
  return out;
}
const faded = (s, k) => ({ ...s, opacity: (s.opacity ?? 1) * k });
function tweenShapes(from, to, t) {
  if (t >= 1) return to;
  const before = new Map(from.map((s) => [s.id, s]));
  const after = new Set(to.map((s) => s.id));
  const leaving = from.filter((s) => !after.has(s.id)).map((s) => faded(s, 1 - t));
  const staying = to.map((s) => {
    const start = before.get(s.id);
    return !start || start.kind !== s.kind ? faded(s, t) : blend(start, s, t);
  });
  return [...leaving, ...staying];
}

const arrowHead = (x1, y1, x2, y2, size) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const spread = Math.PI / 7;
  return `${x2},${y2} ${x2 - size * Math.cos(angle - spread)},${y2 - size * Math.sin(angle - spread)} ${x2 - size * Math.cos(angle + spread)},${y2 - size * Math.sin(angle + spread)}`;
};
const attr = (name, v) => (v === undefined || v === null ? '' : ` ${name}="${escHtml(v)}"`);
function lines(x, y, value, size) {
  const rows = String(value).split('\n');
  if (rows.length === 1) return escHtml(value);
  const first = -((rows.length - 1) * 1.15) / 2;
  return rows.map((row, i) => `<tspan x="${x}" y="${y}" dy="${first + i * 1.15}em" style="font-size:${size}px">${escHtml(row)}</tspan>`).join('');
}
const label = (x, y, value, size, color, weight, mono) =>
  `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${escHtml(color)}" style="font-size:${size}px;font-weight:${weight ?? 600};font-family:${mono ? MONO : 'inherit'}">${lines(x, y, value, size)}</text>`;

function shapeSvg(s) {
  const opacity = Math.max(0, Math.min(1, s.opacity ?? 1));
  if (opacity <= 0.01) return '';
  const g = (inner) => `<g opacity="${opacity.toFixed(3)}">${inner}</g>`;
  switch (s.kind) {
    case 'rect':
      return g(`<rect x="${s.x}" y="${s.y}" width="${Math.max(0, s.w)}" height="${Math.max(0, s.h)}" rx="${s.rx ?? 0}" fill="${escHtml(s.fill ?? 'none')}" stroke="${escHtml(s.stroke ?? 'none')}" stroke-width="${s.sw ?? 0}"${attr('stroke-dasharray', s.dash)}/>`
        + (s.text ? label(s.x + s.w / 2, s.y + s.h / 2, s.text, s.size ?? 13, s.textColor ?? '#e6edf3', s.weight, s.mono) : ''));
    case 'circle':
      return g(`<circle cx="${s.x}" cy="${s.y}" r="${Math.max(0, s.r)}" fill="${escHtml(s.fill ?? 'none')}" stroke="${escHtml(s.stroke ?? 'none')}" stroke-width="${s.sw ?? 0}"${attr('stroke-dasharray', s.dash)}/>`
        + (s.text ? label(s.x, s.y, s.text, s.size ?? 12, s.textColor ?? '#e6edf3', s.weight, s.mono) : ''));
    case 'line': {
      const stroke = s.stroke ?? '#90a4ae';
      const w = s.sw ?? 2;
      return g(`<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${escHtml(stroke)}" stroke-width="${w}"${attr('stroke-dasharray', s.dash)} stroke-linecap="round"/>`
        + (s.arrow ? `<polygon points="${arrowHead(s.x1, s.y1, s.x2, s.y2, 6 + w * 1.5)}" fill="${escHtml(stroke)}"/>` : ''));
    }
    case 'path': {
      const n = s.points.length;
      if (!n) return '';
      const d = s.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + (s.closed ? ' Z' : '');
      const stroke = s.stroke ?? '#4dd0e1';
      const w = s.sw ?? 2.5;
      return g(`<path d="${d}" fill="${escHtml(s.fill ?? 'none')}" stroke="${escHtml(stroke)}" stroke-width="${w}"${attr('stroke-dasharray', s.dash)} stroke-linejoin="round" stroke-linecap="round"/>`
        + (s.arrow && n > 1 ? `<polygon points="${arrowHead(s.points[n - 2][0], s.points[n - 2][1], s.points[n - 1][0], s.points[n - 1][1], 6 + w * 1.5)}" fill="${escHtml(stroke)}"/>` : ''));
    }
    case 'text': {
      const size = s.size ?? 13;
      return `<text x="${s.x}" y="${s.y}" opacity="${opacity.toFixed(3)}" text-anchor="${s.anchor ?? 'middle'}" dominant-baseline="central" fill="${escHtml(s.fill ?? '#e6edf3')}" style="font-size:${size}px;font-weight:${s.weight ?? 500};font-family:${s.mono ? MONO : 'inherit'}">${lines(s.x, s.y, s.text, size)}</text>`;
    }
    default:
      return '';
  }
}

const ICON = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>',
};

function player(root, spec) {
  const stage = root.querySelector('.anim-stage');
  const width = spec.width ?? 400;
  const height = spec.height ?? 240;
  let variant = 0;
  let frames = spec.variants[0].frames;
  let index = 0;
  let playing = false;
  let touched = false;
  let from = frames[0].shapes;
  let shown = frames[0].shapes;
  let raf = 0;
  let timer = 0;

  stage.innerHTML = `
    ${spec.variants.length > 1 ? `<div class="anim-variants" role="group" aria-label="Choose a version">${spec.variants.map((v, i) => `<button type="button" data-variant="${i}" aria-pressed="${i === 0}">${escHtml(v.label)}</button>`).join('')}</div>` : ''}
    <svg class="anim-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escHtml(spec.title)}"></svg>
    <p class="anim-caption" aria-live="polite"><b></b><span></span></p>
    <div class="anim-controls">
      <button type="button" class="anim-btn" data-act="back" aria-label="Back">${ICON.back}</button>
      <button type="button" class="anim-btn anim-play" data-act="play" aria-label="Play">${ICON.play}</button>
      <button type="button" class="anim-btn" data-act="next" aria-label="Next">${ICON.next}</button>
      <div class="anim-dots" role="group" aria-label="Steps"></div>
    </div>`;
  const svg = stage.querySelector('svg');
  const caption = stage.querySelector('.anim-caption');
  const playBtn = stage.querySelector('[data-act="play"]');
  const backBtn = stage.querySelector('[data-act="back"]');
  const nextBtn = stage.querySelector('[data-act="next"]');
  const dots = stage.querySelector('.anim-dots');

  const draw = (shapes) => { shown = shapes; svg.innerHTML = shapes.map(shapeSvg).join(''); };
  const atEnd = () => index >= frames.length - 1;
  function paint() {
    caption.firstElementChild.textContent = `${index + 1}/${frames.length}`;
    caption.lastElementChild.textContent = frames[index].caption;
    backBtn.disabled = index === 0;
    nextBtn.disabled = atEnd();
    const state = playing ? 'pause' : atEnd() ? 'replay' : 'play';
    playBtn.innerHTML = ICON[state];
    playBtn.setAttribute('aria-label', playing ? 'Pause' : atEnd() ? 'Play again' : 'Play');
    [...dots.children].forEach((d, i) => { d.classList.toggle('on', i <= index); d.setAttribute('aria-current', i === index ? 'step' : 'false'); });
  }
  function buildDots() {
    dots.innerHTML = frames.map((_, i) => `<button type="button" data-step="${i}" aria-label="Go to step ${i + 1}"></button>`).join('');
  }
  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    if (atEnd()) { playing = false; paint(); return; }
    timer = setTimeout(() => go(index + 1), holdFor(frames[index]));
  }
  function go(next, animate = !reduced) {
    cancelAnimationFrame(raf);
    from = shown;
    index = Math.max(0, Math.min(frames.length - 1, next));
    paint();
    const target = frames[index].shapes;
    if (!animate) { draw(target); schedule(); return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / TRANSITION_MS);
      draw(tweenShapes(from, target, easeInOut(t)));
      if (t < 1) raf = requestAnimationFrame(tick); else schedule();
    };
    raf = requestAnimationFrame(tick);
  }
  const setPlaying = (on) => { playing = on; paint(); if (on) schedule(); else clearTimeout(timer); };
  const restart = () => { cancelAnimationFrame(raf); index = 0; draw(frames[0].shapes); paint(); setPlaying(true); };

  stage.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    touched = true;
    if (btn.dataset.act === 'play') { if (atEnd() && !playing) restart(); else setPlaying(!playing); }
    else if (btn.dataset.act === 'back') { setPlaying(false); go(index - 1); }
    else if (btn.dataset.act === 'next') { setPlaying(false); go(index + 1); }
    else if (btn.dataset.step) { setPlaying(false); go(Number(btn.dataset.step)); }
    else if (btn.dataset.variant) {
      const v = Number(btn.dataset.variant);
      if (v === variant) return;
      variant = v;
      frames = spec.variants[v].frames;
      stage.querySelectorAll('[data-variant]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.variant) === v)));
      buildDots();
      cancelAnimationFrame(raf);
      index = 0;
      draw(frames[0].shapes);
      setPlaying(!reduced);
    }
  });

  buildDots();
  draw(frames[0].shapes);
  paint();
  root.classList.add('ready');

  // Start by itself the first time it is half on screen; pause whenever it leaves.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (!touched && !reduced) { touched = true; setPlaying(true); }
      } else if (!entry.isIntersecting && playing) setPlaying(false);
    }, { threshold: [0, 0.5] }).observe(root);
  }
}

document.querySelectorAll('.anim[data-anim]').forEach((root) => {
  whenNear(root, async () => {
    try {
      const res = await fetch(root.dataset.anim);
      if (!res.ok) throw new Error(String(res.status));
      player(root, await res.json());
    } catch {
      root.querySelector('.anim-text')?.setAttribute('open', ''); // show the steps as text instead
    }
  });
});
