import { PRESETS, coverScale, coversFrame, keepCovered, encodeUnder, formatKB, checkFile, analyzePixels, pixelRows, estimateHead, assessHead } from './lib/photo.js';
import { exampleSet } from './lib/photo-figure.js';

// DV lottery photo tool. Everything happens in the browser: the photo is drawn on a canvas
// and saved with a download link. Nothing is uploaded, and the photo itself is never stored.
// Steps: 1 check the photo you chose, 2 fit your head between the ovals, 3 download.
// The head size is checked live with face detection on the device, as soon as a photo loads.

const $ = (id) => document.getElementById(id);
const tool = $('ph-tool');
const canvas = $('ph-canvas');
const ctx = canvas.getContext('2d');
const fileInput = $('ph-file');
const drop = $('ph-drop');
const zoomEl = $('ph-zoom');
const tiltEl = $('ph-tilt');
const P = PRESETS.dv;

let img = null; // ImageBitmap or HTMLImageElement
let source = null; // { type, bytes, w, h, example } of the chosen file
const view = { zoom: 1, ox: 0, oy: 0, quarter: 0, tilt: 0 };
let lastGood = { ox: 0, oy: 0 };
let checkTimer = 0;
let headTimer = 0;
let head = null; // { status, share, tips } | { status: 'none' | 'loading' | 'error' }
let faceapi = null;
let faceLoading = null;

const theta = () => ((view.quarter * 90 + view.tilt) * Math.PI) / 180;

// ---- checklists ----------------------------------------------------------------------

const ICON = { true: '✓', false: '✗', null: 'i' };
const CLASS = { true: 'ok', false: 'bad', null: 'info' };

function showChecks(el, rows) {
  el.innerHTML = rows
    .map((r) => `<li class="${CLASS[r.ok]}"><span class="ph-ic" aria-hidden="true">${ICON[r.ok]}</span><span><b>${r.label}:</b> ${r.detail}</span></li>`)
    .join('');
}

/** Read the pixels of something drawn at a small size, for the colour and background hints. */
function pixelsOf(drawFn, w, h) {
  const scale = Math.min(1, 160 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.scale(c.width / w, c.height / h);
  drawFn(cx, w, h);
  return analyzePixels(cx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
}

/** Step 1: the photo exactly as chosen, against the DV rules. */
function checkSource() {
  if (!source) return;
  const fileRows = checkFile(source, P);
  const hints = pixelsOf((c, w, h) => c.drawImage(img, 0, 0, w, h), img.width, img.height);
  showChecks($('ph-check-in'), [...fileRows, ...pixelRows(hints)]);
  const verdict = $('ph-verdict');
  if (source.example) {
    verdict.textContent = 'This is an example photo: practise moving and zooming it until the ovals turn green.';
  } else if (fileRows.every((r) => r.ok !== false)) {
    verdict.textContent = 'This file already has the right format, size and shape for the DV entry. Check that the ovals are green before you use it.';
  } else {
    verdict.textContent = 'Not ready for the DV entry yet. Steps 2 and 3 fix the size, shape and file size.';
  }
  if (hints.background === 'dark') verdict.textContent += ' The background can’t be fixed here: take the photo again against a plain white wall.';
}

// ---- drawing -------------------------------------------------------------------------

/** Draw the photo into a W×H area: white first, so transparent PNGs stay white. */
function drawPhoto(c, W, H) {
  c.fillStyle = '#fff';
  c.fillRect(0, 0, W, H);
  if (!img) return;
  const k = coverScale(img.width, img.height, W, H, theta()) * view.zoom;
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.translate(W / 2 + view.ox * W, H / 2 + view.oy * H);
  c.rotate(theta());
  c.scale(k, k);
  c.drawImage(img, -img.width / 2, -img.height / 2);
  c.restore();
}

const GUIDE_COLOUR = { ok: 'rgba(22,128,61,.95)', warn: 'rgba(202,120,0,.95)', bad: 'rgba(200,30,50,.9)' };

function drawGuide(c, W, H, g) {
  const state = head && HEAD[head.status];
  const colour = (state && GUIDE_COLOUR[state.cls]) || 'rgba(36,83,196,.9)';
  c.save();
  c.setLineDash([Math.max(4, W / 60), Math.max(3, W / 90)]);
  c.lineWidth = Math.max(2, W / 160);
  for (const share of [g.min, g.max]) {
    const rh = (share * H) / 2;
    const rw = Math.min(rh * 0.74, W * 0.46);
    c.strokeStyle = 'rgba(255,255,255,.95)';
    c.beginPath();
    c.ellipse(W / 2, g.y * H, rw, rh, 0, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = colour;
    c.lineDashOffset = Math.max(4, W / 60);
    c.stroke();
    c.lineDashOffset = 0;
  }
  c.restore();
}

function render() {
  const cssW = canvas.parentElement.clientWidth || 360;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.style.height = `${Math.round(cssW)}px`;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssW * dpr);
  const s = canvas.width / P.w;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  drawPhoto(ctx, P.w, P.h);
  if ($('ph-guide').checked) drawGuide(ctx, P.w, P.h, P.guide);
}

// ---- the live head size result ---------------------------------------------------------

const HEAD = {
  good: { cls: 'ok', icon: '✓', text: 'Head size OK' },
  adjust: { cls: 'warn', icon: '!', text: 'Almost right' },
  close: { cls: 'warn', icon: '!', text: 'Almost right' },
  small: { cls: 'bad', icon: '✗', text: 'Head too small' },
  big: { cls: 'bad', icon: '✗', text: 'Head too big' },
  cut: { cls: 'bad', icon: '✗', text: 'Head cut off' },
  none: { cls: 'bad', icon: '✗', text: 'No face found' },
};

function showHead() {
  const live = $('ph-live');
  const badge = $('ph-badge-stage');
  if (!img || !head) {
    live.className = 'ph-live';
    live.innerHTML = '';
    badge.className = 'ph-badge';
    badge.textContent = '';
    return;
  }
  if (head.status === 'loading') {
    live.className = 'ph-live is-wait';
    live.innerHTML = '<span class="ph-live-badge"><span class="ph-live-ic" aria-hidden="true">…</span>Checking head size</span>';
    badge.className = 'ph-badge is-wait';
    badge.textContent = 'Checking head size…';
    return;
  }
  if (head.status === 'error') {
    live.className = 'ph-live is-wait';
    live.innerHTML = '<span class="ph-live-badge"><span class="ph-live-ic" aria-hidden="true">i</span>Check the head size by eye</span><p>The live head check couldn’t load. Make sure your head is between the two ovals.</p>';
    badge.className = 'ph-badge';
    badge.textContent = '';
    return;
  }
  const h = HEAD[head.status];
  let tips = head.tips || [];
  if (head.status === 'none') {
    tips = [source && source.example
      ? 'The example is a drawing, so face detection may not see it: try it with a real photo.'
      : 'Use a sharp photo of one person looking at the camera.'];
  }
  const pct = head.share ? `<span class="ph-live-pct">about ${Math.round(head.share * 100)}% of the height · needs 50% to 69%</span>` : '';
  live.className = `ph-live is-${h.cls}`;
  live.innerHTML = `<span class="ph-live-badge"><span class="ph-live-ic" aria-hidden="true">${h.icon}</span>${h.text}</span>${pct}${tips.length ? `<p>${tips.join(' ')}</p>` : ''}<p class="ph-live-note">An estimate from face detection on your device.</p>`;
  badge.className = `ph-badge is-${h.cls}`;
  badge.textContent = `${h.icon} ${h.text}`;
}

function loadFaceApi() {
  if (faceapi) return Promise.resolve(faceapi);
  if (!faceLoading) {
    faceLoading = (async () => {
      const mod = await import('/vendor/face-api/face-api.esm.js');
      await mod.nets.tinyFaceDetector.loadFromUri('/vendor/face-api/model');
      await mod.nets.faceLandmark68TinyNet.loadFromUri('/vendor/face-api/model');
      faceapi = mod;
      return mod;
    })();
  }
  return faceLoading;
}

let headBusy = false;
let headAgain = false;

async function checkHead() {
  if (!img) return;
  if (headBusy) { headAgain = true; return; } // one check at a time; run once more after it
  headBusy = true;
  try {
    await runHeadCheck();
  } finally {
    headBusy = false;
    if (headAgain) { headAgain = false; checkHead(); }
  }
}

async function runHeadCheck() {
  if (!faceapi) {
    head = { status: 'loading' };
    showHead();
  }
  let api;
  try {
    api = await loadFaceApi();
  } catch {
    faceLoading = null;
    head = { status: 'error' };
    showHead();
    return;
  }
  const found = await api.detectAllFaces(photoCanvas(), new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })).withFaceLandmarks(true);
  if (!found.length) head = { status: 'none' };
  else {
    const biggest = found.reduce((a, b) => (b.detection.box.area > a.detection.box.area ? b : a));
    head = assessHead(estimateHead(biggest.landmarks.positions), P.w, P.h, P.guide);
    if ((head.status === 'cut' || head.status === 'big') && view.zoom <= 1.001) {
      // Already zoomed out as far as the photo allows: the photo itself is too close.
      head.tips = head.tips.filter((t) => !/^Zoom out|cut off/.test(t));
      head.tips.unshift('This photo is taken too close to your head, so it can’t be zoomed out more. Take it again from a little further away, with space above your head and your shoulders in the photo.');
    }
    if (found.length > 1) head.tips.unshift('More than one face was found: the photo must show only you.');
  }
  showHead();
  render();
  checkOutput();
}

function scheduleHeadCheck() {
  clearTimeout(headTimer);
  headTimer = setTimeout(checkHead, faceapi ? 250 : 0);
}

// ---- output --------------------------------------------------------------------------

function photoCanvas() {
  const c = document.createElement('canvas');
  c.width = P.w;
  c.height = P.h;
  drawPhoto(c.getContext('2d'), P.w, P.h);
  return c;
}

const toBlob = (c, q) => new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', q));

function headRow() {
  if (!head || head.status === 'loading') return { label: 'Head size', ok: null, detail: 'checking…' };
  if (head.status === 'error') return { label: 'Head size', ok: null, detail: 'check by eye that your head is between the ovals' };
  const h = HEAD[head.status];
  const short = { good: 'OK', adjust: 'almost right', close: 'almost right', small: 'too small', big: 'too big', cut: 'cut off', none: 'no face found' }[head.status];
  const detail = head.share ? `${short}, about ${Math.round(head.share * 100)}% of the height (estimated)` : short;
  return { label: 'Head size', ok: h.cls === 'ok' ? true : h.cls === 'warn' ? null : false, detail };
}

/** Step 3: encode the photo as it will be downloaded and check it, before anyone downloads. */
async function checkOutput() {
  if (!img) return null;
  const c = photoCanvas();
  const out = await encodeUnder((q) => toBlob(c, q), P.maxBytes);
  const el = $('ph-check-out');
  if (!out) {
    showChecks(el, [{ label: 'File size', ok: false, detail: `can’t get under ${formatKB(P.maxBytes)}` }]);
    return null;
  }
  const rows = checkFile({ type: 'image/jpeg', bytes: out.blob.size, w: P.w, h: P.h }, P);
  const hints = pixelsOf((cx, w, h) => drawPhoto(cx, w, h), P.w, P.h);
  showChecks(el, [headRow(), ...rows, ...pixelRows(hints)]);
  return out;
}

function scheduleCheck() {
  clearTimeout(checkTimer);
  checkTimer = setTimeout(checkOutput, 350);
}

function save(blob, name) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function downloadPhoto() {
  const out = await checkOutput();
  if (out) save(out.blob, `${P.file}.jpg`);
}

// ---- loading a photo -----------------------------------------------------------------

async function decode(blob) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch { /* fall back to <img> below */ }
  }
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('decode'));
    el.src = URL.createObjectURL(blob);
  });
}

async function load(file, { example = false } = {}) {
  if (!file) return;
  const info = $('ph-info');
  try {
    img = await decode(file);
  } catch {
    const heic = /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name || '');
    info.className = 'ph-info bad';
    info.textContent = heic
      ? 'This browser can’t open HEIC photos. Open this page in Safari, or on iPhone set Settings → Camera → Formats → Most Compatible and take the photo again.'
      : 'That file couldn’t be opened as a photo. Try a JPEG or PNG.';
    return;
  }
  source = { type: file.type || 'image/jpeg', bytes: file.size, w: img.width, h: img.height, example };
  info.className = 'ph-info';
  info.textContent = example
    ? 'Example photo loaded. Drag it and zoom until the ovals turn green.'
    : `Your photo: ${img.width} × ${img.height} pixels, ${formatKB(file.size)}. It stays on this device.`;
  tool.classList.add('has-photo');
  head = null;
  reset();
  checkSource();
  canvas.focus({ preventScroll: true });
}

async function loadExample() {
  const btn = $('ph-example');
  btn.disabled = true;
  try {
    const res = await fetch(btn.dataset.src);
    await load(await res.blob(), { example: true });
  } finally {
    btn.disabled = false;
  }
}

function reset() {
  Object.assign(view, { zoom: 1, ox: 0, oy: 0, quarter: 0, tilt: 0 });
  lastGood = { ox: 0, oy: 0 };
  zoomEl.value = '1';
  tiltEl.value = '0';
  update();
}

function update() {
  if (img) {
    // Keep the photo covering the whole frame: no white edges or corners.
    const t = theta();
    const k = coverScale(img.width, img.height, P.w, P.h, t) * view.zoom;
    const fits = (ox, oy) => coversFrame(ox, oy, k, img.width, img.height, P.w, P.h, t);
    lastGood = keepCovered({ ox: view.ox, oy: view.oy }, lastGood, fits);
    Object.assign(view, lastGood);
  }
  render();
  if (img) {
    scheduleCheck();
    scheduleHeadCheck();
  }
}

// ---- moving and zooming --------------------------------------------------------------

const pointers = new Map();
let pinch = null;

function setZoom(z, cx = 0, cy = 0) {
  // keep the point (cx, cy) (shares of the frame, from its centre) still while zooming
  const next = Math.min(Number(zoomEl.max), Math.max(Number(zoomEl.min), z));
  const r = next / view.zoom;
  view.ox = cx + (view.ox - cx) * r;
  view.oy = cy + (view.oy - cy) * r;
  view.zoom = next;
  zoomEl.value = String(next);
  update();
}

function framePoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
}

canvas.addEventListener('pointerdown', (e) => {
  if (!img) return;
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, framePoint(e));
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.zoom };
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  const now = framePoint(e);
  pointers.set(e.pointerId, now);
  if (pointers.size === 1) {
    view.ox += now.x - prev.x;
    view.oy += now.y - prev.y;
    update();
  } else if (pointers.size === 2 && pinch) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch.d > 0) setZoom(pinch.zoom * (d / pinch.d), (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
});
const endPointer = (e) => {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
  if (!img) return;
  e.preventDefault();
  const p = framePoint(e);
  setZoom(view.zoom * Math.exp(-e.deltaY / 500), p.x, p.y);
}, { passive: false });
canvas.addEventListener('keydown', (e) => {
  if (!img) return;
  const step = e.shiftKey ? 0.05 : 0.01;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (moves[e.key]) {
    view.ox += moves[e.key][0];
    view.oy += moves[e.key][1];
    update();
  } else if (e.key === '+' || e.key === '=') setZoom(view.zoom * 1.05);
  else if (e.key === '-') setZoom(view.zoom / 1.05);
  else return;
  e.preventDefault();
});

zoomEl.addEventListener('input', () => setZoom(Number(zoomEl.value)));
tiltEl.addEventListener('input', () => {
  view.tilt = Number(tiltEl.value);
  update();
});
$('ph-rotl').addEventListener('click', () => { view.quarter = (view.quarter + 3) % 4; update(); });
$('ph-rotr').addEventListener('click', () => { view.quarter = (view.quarter + 1) % 4; update(); });
$('ph-reset').addEventListener('click', reset);
$('ph-guide').addEventListener('change', render);
$('ph-dl').addEventListener('click', downloadPhoto);
$('ph-change').addEventListener('click', () => fileInput.click());
$('ph-example').addEventListener('click', loadExample);
fileInput.addEventListener('change', () => {
  load(fileInput.files && fileInput.files[0]);
  fileInput.value = '';
});

// drag and drop onto the drop zone or the photo
for (const el of [drop, canvas]) {
  el.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag'); });
  el.addEventListener('dragleave', () => drop.classList.remove('drag'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('drag');
    load(e.dataTransfer.files && e.dataTransfer.files[0]);
  });
}

window.addEventListener('resize', render);
$('ph-mini').innerHTML = exampleSet('dv');
render();
