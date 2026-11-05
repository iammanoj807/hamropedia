import { PRESETS, DPI, toPx, coverScale, rotatedBox, clampOffset, sheetLayout, encodeUnder, setJpegDpi, formatKB } from './lib/photo.js';
import { store } from './site.js';

// Everything happens in the browser: the photo is drawn on a canvas and saved with a
// download link. Nothing is uploaded, and the photo itself is never stored.

const $ = (id) => document.getElementById(id);
const tool = $('ph-tool');
const canvas = $('ph-canvas');
const ctx = canvas.getContext('2d');
const fileInput = $('ph-file');
const drop = $('ph-drop');
const zoomEl = $('ph-zoom');
const tiltEl = $('ph-tilt');
const resultEl = $('ph-result');

let img = null; // ImageBitmap or HTMLImageElement
let presetKey = tool.dataset.default || 'dv';
const view = { zoom: 1, ox: 0, oy: 0, quarter: 0, tilt: 0 };
let checkTimer = 0;

// ---- the current output size -------------------------------------------------------

function customPreset() {
  const unit = $('ph-cu').value;
  const w = toPx($('ph-cw').value, unit);
  const h = toPx($('ph-ch').value, unit);
  const kb = Number($('ph-ckb').value);
  const ok = w >= 50 && h >= 50 && w <= 6000 && h <= 6000;
  return {
    label: 'Custom',
    w: ok ? w : 600,
    h: ok ? h : 600,
    dpi: unit === 'px' ? 0 : DPI,
    maxBytes: kb > 0 ? Math.round(kb * 1000) : 0,
    file: `photo-${ok ? w : 600}x${ok ? h : 600}`,
    spec: ok
      ? `Custom: ${w} × ${h} pixels${unit === 'px' ? '' : ` (${$('ph-cw').value} × ${$('ph-ch').value} ${unit} at 300 dpi)`}${kb > 0 ? `, ${kb} kB or less` : ''}, JPEG.`
      : 'Enter a width and height (between 50 and 6,000 pixels once converted).',
    guide: null,
    sheet: true,
  };
}

const preset = () => (presetKey === 'custom' ? customPreset() : PRESETS[presetKey]);
const theta = () => ((view.quarter * 90 + view.tilt) * Math.PI) / 180;

// ---- drawing -------------------------------------------------------------------------

/** Draw the photo into a W×H area of ctx: white first, so transparent PNGs and gaps stay white. */
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

function drawGuide(c, W, H, g) {
  const ovals = g.min === g.max ? [g.max] : [g.min, g.max];
  c.save();
  c.setLineDash([Math.max(4, W / 60), Math.max(3, W / 90)]);
  c.lineWidth = Math.max(1.5, W / 220);
  for (const share of ovals) {
    const rh = (share * H) / 2;
    const rw = Math.min(rh * 0.74, W * 0.46);
    c.strokeStyle = 'rgba(255,255,255,.95)';
    c.beginPath();
    c.ellipse(W / 2, g.y * H, rw, rh, 0, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = 'rgba(36,83,196,.9)';
    c.lineDashOffset = Math.max(4, W / 60);
    c.stroke();
    c.lineDashOffset = 0;
  }
  c.restore();
}

function render() {
  const p = preset();
  const cssW = canvas.parentElement.clientWidth || 360;
  const ratio = p.h / p.w;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.style.height = `${Math.round(cssW * ratio)}px`;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssW * ratio * dpr);
  const s = canvas.width / p.w;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  drawPhoto(ctx, p.w, p.h);
  if (p.guide && $('ph-guide').checked) drawGuide(ctx, p.w, p.h, p.guide);
}

// ---- output --------------------------------------------------------------------------

function photoCanvas(p) {
  const c = document.createElement('canvas');
  c.width = p.w;
  c.height = p.h;
  drawPhoto(c.getContext('2d'), p.w, p.h);
  return c;
}

const toBlob = (c, q) => new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', q));

async function encodePhoto(c, maxBytes, dpi) {
  const out = await encodeUnder((q) => toBlob(c, q), maxBytes);
  if (!out) return null;
  if (!dpi) return out;
  const bytes = setJpegDpi(new Uint8Array(await out.blob.arrayBuffer()), dpi);
  return { ...out, blob: new Blob([bytes], { type: 'image/jpeg' }) };
}

function save(blob, name) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** Encode the photo as it will be downloaded and show its size, so people can check it first. */
async function check() {
  if (!img) return;
  const p = preset();
  const out = await encodePhoto(photoCanvas(p), p.maxBytes, p.dpi);
  if (!out) {
    resultEl.className = 'ph-result bad';
    resultEl.textContent = `This size can't get under ${formatKB(p.maxBytes)} as a JPEG. Try a smaller width and height, or a higher kB limit.`;
    return null;
  }
  const limit = p.maxBytes ? ` (limit ${formatKB(p.maxBytes)})` : '';
  resultEl.className = 'ph-result ok';
  resultEl.innerHTML = `<b>Your download:</b> ${p.w} × ${p.h} pixels · JPEG · ${formatKB(out.blob.size)}${limit} ✓`;
  return out;
}

function scheduleCheck() {
  clearTimeout(checkTimer);
  checkTimer = setTimeout(check, 350);
}

async function downloadPhoto() {
  const p = preset();
  const out = await check();
  if (out) save(out.blob, `${p.file}.jpg`);
}

async function downloadSheet() {
  const p = preset();
  const layout = sheetLayout(p.w, p.h);
  if (!layout) {
    resultEl.className = 'ph-result bad';
    resultEl.textContent = 'This photo is too big to fit on a 4×6 inch sheet.';
    return;
  }
  const photo = photoCanvas(p);
  const c = document.createElement('canvas');
  c.width = layout.w;
  c.height = layout.h;
  const sc = c.getContext('2d');
  sc.fillStyle = '#fff';
  sc.fillRect(0, 0, c.width, c.height);
  sc.strokeStyle = '#c9ced6';
  sc.lineWidth = 1;
  for (const { x, y } of layout.positions) {
    sc.drawImage(photo, x, y);
    sc.strokeRect(x - 0.5, y - 0.5, p.w + 1, p.h + 1); // cutting line just outside the photo
  }
  const out = await encodePhoto(c, 0, DPI);
  if (out) save(out.blob, `${p.file}-4x6-sheet-${layout.count}.jpg`);
  $('ph-sheet-note').textContent = `${layout.count} photos on a 4 × 6 inch (10 × 15 cm) sheet. Print at 100% (actual size), not “fit to page”.`;
}

// ---- loading a photo -----------------------------------------------------------------

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* fall back to <img> below */ }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('decode'));
    el.src = url;
  });
}

async function load(file) {
  if (!file) return;
  const info = $('ph-info');
  try {
    img = await decode(file);
  } catch {
    const heic = /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    info.className = 'ph-info bad';
    info.textContent = heic
      ? 'This browser can’t open HEIC photos. Open this page in Safari, or on iPhone set Settings → Camera → Formats → Most Compatible and take the photo again.'
      : 'That file couldn’t be opened as a photo. Try a JPEG or PNG.';
    return;
  }
  const type = (file.type.split('/')[1] || file.name.split('.').pop() || '').toUpperCase();
  info.className = 'ph-info';
  info.textContent = `Your photo: ${img.width} × ${img.height} pixels, ${type || 'image'}, ${formatKB(file.size)}. It stays on this device.`;
  tool.classList.add('has-photo');
  reset();
  canvas.focus({ preventScroll: true });
}

function reset() {
  Object.assign(view, { zoom: 1, ox: 0, oy: 0, quarter: 0, tilt: 0 });
  zoomEl.value = '1';
  tiltEl.value = '0';
  update();
}

function update() {
  if (img) {
    const p = preset();
    const k = coverScale(img.width, img.height, p.w, p.h, theta()) * view.zoom;
    Object.assign(view, clampOffset(view.ox, view.oy, rotatedBox(img.width, img.height, k, theta()), p.w, p.h));
  }
  render();
  scheduleCheck();
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
$('ph-sheet').addEventListener('click', downloadSheet);
$('ph-change').addEventListener('click', () => fileInput.click());
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

// ---- sizes ---------------------------------------------------------------------------

function setPreset(key) {
  presetKey = key;
  document.querySelectorAll('#ph-tool [data-preset]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.preset === key)));
  $('ph-custom').hidden = key !== 'custom';
  const p = preset();
  $('ph-spec').textContent = p.spec;
  $('ph-guide-row').hidden = !p.guide;
  $('ph-guide-text').textContent = p.guide
    ? (p.guide.min === p.guide.max
      ? 'Fit your head, chin to top of hair, inside the oval: the Nepal Embassy asks for about 70% face coverage.'
      : 'Fit your head, chin to top of hair, between the two ovals: it must be 50% to 69% of the photo height.')
    : '';
  $('ph-sheet').hidden = !p.sheet;
  $('ph-sheet-note').textContent = '';
  update();
}

document.querySelectorAll('#ph-tool [data-preset]').forEach((b) => b.addEventListener('click', () => setPreset(b.dataset.preset)));

// custom size fields: remember them on this device (only the numbers, never the photo)
const fields = ['ph-cw', 'ph-ch', 'ph-cu', 'ph-ckb'];
const saved = store.get('hp-ph-custom');
if (saved) {
  try {
    const v = JSON.parse(saved);
    fields.forEach((id) => { if (v[id] != null) $(id).value = v[id]; });
  } catch { /* ignore */ }
}
fields.forEach((id) => $(id).addEventListener('input', () => {
  store.set('hp-ph-custom', JSON.stringify(Object.fromEntries(fields.map((f) => [f, $(f).value]))));
  setPreset('custom');
}));

window.addEventListener('resize', render);
setPreset(presetKey);
