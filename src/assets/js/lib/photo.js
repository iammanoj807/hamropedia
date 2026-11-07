// The DV photo size and the maths behind the photo tool (crop, cover, file size).
// Pure functions with no DOM, so they run in Node for tests/photo.test.mjs.

// Head guide: the allowed head height (chin to top of head) as a share of the photo
// height, 50% to 69% for DV (U.S. Department of State). `y` is where the guide's centre
// sits, as a share from the top.
export const PRESETS = {
  dv: {
    label: 'DV Lottery 600×600',
    w: 600, h: 600, maxBytes: 240000, jpeg: true, file: 'dv-photo-600x600',
    spec: 'DV Lottery entry: 600 × 600 pixels, square JPEG, 240 kB or less.',
    guide: { min: 0.5, max: 0.69, y: 0.46, good: [0.53, 0.66], ok: [0.5, 0.69] },
  },
};

/** The smallest scale at which an iw×ih image, rotated by theta radians, covers a W×H frame. */
export function coverScale(iw, ih, W, H, theta = 0) {
  const c = Math.abs(Math.cos(theta));
  const s = Math.abs(Math.sin(theta));
  return Math.max((W * c + H * s) / iw, (W * s + H * c) / ih);
}

/**
 * Encode at the best JPEG quality that fits within maxBytes. `encode(q)` returns a Promise
 * of something with a `size` (a Blob). Returns { blob, quality }, or null if even the lowest
 * quality is too big. With no maxBytes, encodes once at the top quality.
 */
export async function encodeUnder(encode, maxBytes, { hi = 0.95, lo = 0.4, steps = 7 } = {}) {
  const top = await encode(hi);
  if (!maxBytes || top.size <= maxBytes) return { blob: top, quality: hi };
  let best = null;
  let a = lo;
  let b = hi;
  for (let i = 0; i < steps; i++) {
    const q = (a + b) / 2;
    const out = await encode(q);
    if (out.size <= maxBytes) {
      best = { blob: out, quality: q };
      a = q;
    } else {
      b = q;
    }
  }
  if (!best) {
    const out = await encode(lo);
    if (out.size <= maxBytes) best = { blob: out, quality: lo };
  }
  return best;
}

/** "84 kB" (1 kB = 1,000 bytes, as the State Department counts it). */
export const formatKB = (bytes) => `${Math.max(1, Math.round(bytes / 1000))} kB`;

const near = (a, b) => Math.abs(a - b) <= Math.max(0.01 * b, 1e-9);

/**
 * Check a photo file against a size: format, file size, shape, pixel size and detail.
 * `file` is { type, bytes, w, h }. Each row is { key, label, ok, detail } where ok is
 * true, false, or null for "fine, just so you know".
 */
export function checkFile(file, p) {
  const rows = [];
  const kb = formatKB(file.bytes);
  if (p.jpeg) {
    const jpeg = file.type === 'image/jpeg';
    rows.push({ key: 'format', label: 'Format', ok: jpeg, detail: jpeg ? 'JPEG' : `${(file.type.split('/')[1] || 'unknown').toUpperCase()}: must be JPEG` });
  }
  if (p.maxBytes) {
    const ok = file.bytes <= p.maxBytes;
    rows.push({ key: 'bytes', label: 'File size', ok, detail: ok ? `${kb}, within ${formatKB(p.maxBytes)}` : `${kb}: must be ${formatKB(p.maxBytes)} or less` });
  }
  const shapeOk = near(file.w / file.h, p.w / p.h);
  const shapeName = p.w === p.h ? 'square' : `${p.w} : ${p.h}`;
  rows.push({ key: 'shape', label: 'Shape', ok: shapeOk, detail: shapeOk ? (p.w === p.h ? 'Square' : 'Right shape') : `${file.w} × ${file.h} is not ${shapeName}` });
  const sizeOk = file.w === p.w && file.h === p.h;
  rows.push({ key: 'pixels', label: 'Size', ok: sizeOk, detail: sizeOk ? `${p.w} × ${p.h} pixels` : `${file.w} × ${file.h} pixels: needs ${p.w} × ${p.h}` });
  if (!sizeOk) {
    const enough = file.w >= p.w && file.h >= p.h;
    rows.push({ key: 'detail', label: 'Detail', ok: enough ? true : null, detail: enough ? 'Big enough to crop down' : 'Smaller than the final size, so it may look blurry' });
  }
  return rows;
}

/**
 * Look at the pixels of a photo (RGBA, w × h): is it in colour, and does the background
 * look plain and light? The background is read from the top edge and the upper sides,
 * where a passport-style photo has no person. These are hints, not a verdict.
 */
export function analyzePixels(data, w, h) {
  let greyDiff = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 16) {
    greyDiff += Math.abs(data[i] - data[i + 1]) + Math.abs(data[i + 1] - data[i + 2]);
    n++;
  }
  let lum = 0;
  let chroma = 0;
  let m = 0;
  const add = (x, y) => {
    const i = (y * w + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    lum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    chroma += Math.max(r, g, b) - Math.min(r, g, b);
    m++;
  };
  const top = Math.max(1, Math.round(h * 0.1));
  const side = Math.max(1, Math.round(w * 0.1));
  for (let y = 0; y < top; y++) for (let x = 0; x < w; x++) add(x, y);
  for (let y = top; y < Math.round(h * 0.45); y++) {
    for (let x = 0; x < side; x++) { add(x, y); add(w - 1 - x, y); }
  }
  const bgLum = lum / m;
  const bgChroma = chroma / m;
  const background = bgLum >= 195 && bgChroma <= 35 ? 'light' : bgLum < 140 ? 'dark' : 'unclear';
  return { grey: greyDiff / n < 4, background, bgLum: Math.round(bgLum) };
}

/** Checklist rows for the colour and background hints. */
export function pixelRows(a) {
  return [
    { key: 'colour', label: 'Colour', ok: !a.grey, detail: a.grey ? 'Looks black and white: the photo must be in colour' : 'In colour' },
    {
      key: 'background',
      label: 'Background',
      ok: a.background === 'light' ? true : a.background === 'dark' ? false : null,
      detail: a.background === 'light'
        ? 'Looks plain and light'
        : a.background === 'dark'
          ? 'Looks dark: it must be plain white or off-white. This tool can’t change it, so take the photo again against a white wall'
          : 'Not clearly white: check it is plain white or off-white',
    },
  ];
}

/**
 * Does the image (scaled by k, rotated by theta, its centre moved by ox, oy as shares of
 * the frame) cover the whole W×H frame, with no white showing at the edges or corners?
 */
export function coversFrame(ox, oy, k, iw, ih, W, H, theta = 0) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const hw = (k * iw) / 2 + 1e-6;
  const hh = (k * ih) / 2 + 1e-6;
  for (const [fx, fy] of [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]]) {
    const dx = fx - ox * W;
    const dy = fy - oy * H;
    if (Math.abs(c * dx + s * dy) > hw || Math.abs(-s * dx + c * dy) > hh) return false;
  }
  return true;
}

/** The farthest point from `from` towards `to` (0..1 along the way) for which fits() is true. */
function farthest(fits, from, to) {
  if (fits(to.ox, to.oy)) return to;
  let a = 0;
  let b = 1;
  for (let i = 0; i < 20; i++) {
    const t = (a + b) / 2;
    if (fits(from.ox + (to.ox - from.ox) * t, from.oy + (to.oy - from.oy) * t)) a = t;
    else b = t;
  }
  return { ox: from.ox + (to.ox - from.ox) * a, oy: from.oy + (to.oy - from.oy) * a };
}

/**
 * Move towards `next` as far as the photo still covers the frame, sliding along an edge
 * instead of sticking to it. `prev` is the last good position; the centre always fits.
 */
export function keepCovered(next, prev, fits) {
  if (fits(next.ox, next.oy)) return next;
  const start = prev && fits(prev.ox, prev.oy) ? prev : { ox: 0, oy: 0 };
  const x = farthest(fits, start, { ox: next.ox, oy: start.oy });
  return farthest(fits, x, { ox: x.ox, oy: next.oy });
}

/**
 * Estimate where the head is from 68 face landmarks (points in frame pixels): chin (8),
 * eyebrows (17-26) and eyes (36-47). The top of the head is not a landmark, so it is put
 * 0.75 × (eyebrows to chin) above the eyebrows, which is close for most adult heads.
 */
export function estimateHead(points) {
  const browY = Math.min(...points.slice(17, 27).map((p) => p.y));
  const chin = points[8];
  const crownY = browY - 0.75 * (chin.y - browY);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const avg = (ps) => ps.reduce((m, p) => ({ x: m.x + p.x / ps.length, y: m.y + p.y / ps.length }), { x: 0, y: 0 });
  const eyeL = avg(points.slice(36, 42));
  const eyeR = avg(points.slice(42, 48));
  const tiltDeg = (Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x) * 180) / Math.PI;
  return { crownY, chinY: chin.y, faceCx: mid(points[0], points[16]).x, tiltDeg };
}

/**
 * Is the estimated head the right size and place for this photo size? Returns
 * { status: 'good' | 'adjust' | 'close' | 'small' | 'big' | 'cut', share, tips }.
 */
export function assessHead(head, W, H, guide) {
  const share = (head.chinY - head.crownY) / H;
  const tips = [];
  let status;
  if (head.crownY < -0.01 * H || head.chinY > 1.01 * H) status = 'cut';
  else if (share < guide.ok[0]) status = 'small';
  else if (share > guide.ok[1]) status = 'big';
  else if (share < guide.good[0] || share > guide.good[1]) status = 'close';
  else status = 'good';
  if (status === 'cut') tips.push('Part of the head is cut off: zoom out a little or move the photo.');
  if (status === 'small') tips.push('Zoom in: the head is too small.');
  if (status === 'big') tips.push('Zoom out: the head is too big.');
  if (status === 'close') tips.push(share < guide.good[0] ? 'Zoom in a little to be safe.' : 'Zoom out a little to be safe.');
  const off = (head.faceCx - W / 2) / W;
  if (Math.abs(off) > 0.06) tips.push(`Move the photo ${off > 0 ? 'left' : 'right'} so your face is in the middle.`);
  if (Math.abs(head.tiltDeg) > 3) tips.push(`Your head is tilted: move Straighten about ${Math.round(Math.abs(head.tiltDeg))}° to the ${head.tiltDeg > 0 ? 'left' : 'right'}.`);
  // The right size but off-centre or tilted is "almost": only all-right turns the oval green.
  if (status === 'good' && tips.length) status = 'adjust';
  return { status, share, tips };
}
