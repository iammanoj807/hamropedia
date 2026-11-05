// Photo sizes and the maths behind the photo tool (crop, cover, print sheet, file size).
// Pure functions with no DOM, so they run in Node for tests/photo.test.mjs.

export const DPI = 300;
const MM_PER_INCH = 25.4;

/** Convert a length to pixels at the given dpi. Units: px, mm, cm, in. */
export function toPx(value, unit, dpi = DPI) {
  const v = Number(value);
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (unit === 'px') return Math.round(v);
  const inches = unit === 'in' ? v : unit === 'cm' ? (v * 10) / MM_PER_INCH : v / MM_PER_INCH;
  return Math.round(inches * dpi);
}

// Head guides: `head` is the allowed head height (chin to top of head) as a share of the
// photo height. DV and 2x2: 50% to 69% (U.S. Department of State). Nepal: about 70% face
// coverage (Nepal Embassy). `y` is where the guide's centre sits, as a share from the top.
export const PRESETS = {
  dv: {
    label: 'DV Lottery 600×600',
    w: 600, h: 600, maxBytes: 240000, file: 'dv-photo-600x600',
    spec: 'DV Lottery entry: 600 × 600 pixels, square JPEG, 240 kB or less.',
    guide: { min: 0.5, max: 0.69, y: 0.46 },
  },
  np: {
    label: 'Nepal passport 35×45 mm',
    w: toPx(35, 'mm'), h: toPx(45, 'mm'), dpi: DPI, file: 'passport-size-35x45mm',
    spec: 'Nepal passport size: 35 × 45 mm (413 × 531 pixels at 300 dpi), JPEG.',
    guide: { min: 0.7, max: 0.7, y: 0.48 },
    sheet: true,
  },
  us2x2: {
    label: '2×2 inch print',
    w: toPx(2, 'in'), h: toPx(2, 'in'), dpi: DPI, file: 'photo-2x2-inch',
    spec: '2 × 2 inch (51 × 51 mm) print, 600 × 600 pixels at 300 dpi, JPEG.',
    guide: { min: 0.5, max: 0.69, y: 0.46 },
    sheet: true,
  },
};

/** The smallest scale at which an iw×ih image, rotated by theta radians, covers a W×H frame. */
export function coverScale(iw, ih, W, H, theta = 0) {
  const c = Math.abs(Math.cos(theta));
  const s = Math.abs(Math.sin(theta));
  return Math.max((W * c + H * s) / iw, (W * s + H * c) / ih);
}

/** Width and height of the bounding box of an iw×ih image scaled by k and rotated by theta. */
export function rotatedBox(iw, ih, k, theta = 0) {
  const c = Math.abs(Math.cos(theta));
  const s = Math.abs(Math.sin(theta));
  return { w: k * (iw * c + ih * s), h: k * (iw * s + ih * c) };
}

/**
 * Keep the image centre offset (ox, oy, as shares of W and H) in range: a large image can
 * move until its edge reaches the frame edge; a small one can move until it touches it.
 */
export function clampOffset(ox, oy, box, W, H) {
  const lx = Math.abs(box.w - W) / 2 / W;
  const ly = Math.abs(box.h - H) / 2 / H;
  const clamp = (v, l) => Math.min(l, Math.max(-l, v));
  return { ox: clamp(ox, lx), oy: clamp(oy, ly) };
}

/**
 * How many photos of pw×ph pixels fit on a 4×6 inch sheet at 300 dpi, with at least `minGap`
 * pixels between them and around the edge for cutting. Tries landscape and portrait.
 */
export function sheetLayout(pw, ph, { longSide = 1800, shortSide = 1200, minGap = 24 } = {}) {
  let best = null;
  for (const [SW, SH] of [[longSide, shortSide], [shortSide, longSide]]) {
    const cols = Math.floor((SW - minGap) / (pw + minGap));
    const rows = Math.floor((SH - minGap) / (ph + minGap));
    const count = Math.max(0, cols) * Math.max(0, rows);
    if (count > 0 && (!best || count > best.count)) {
      const gx = (SW - cols * pw) / (cols + 1);
      const gy = (SH - rows * ph) / (rows + 1);
      const positions = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) positions.push({ x: Math.round(gx + c * (pw + gx)), y: Math.round(gy + r * (ph + gy)) });
      }
      best = { w: SW, h: SH, cols, rows, count, positions };
    }
  }
  return best;
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

/**
 * Write the print resolution into a JPEG's JFIF header, so Word and printers print it at the
 * right physical size (for example 35 × 45 mm). Adds a JFIF header if the encoder wrote none.
 */
export function setJpegDpi(bytes, dpi = DPI) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes; // not a JPEG
  const isJfif = bytes[2] === 0xff && bytes[3] === 0xe0
    && bytes[6] === 0x4a && bytes[7] === 0x46 && bytes[8] === 0x49 && bytes[9] === 0x46 && bytes[10] === 0;
  if (!isJfif) {
    // Some encoders (Safari) write no JFIF header: add one straight after the start marker.
    const app0 = [0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 1, dpi >> 8, dpi & 255, dpi >> 8, dpi & 255, 0, 0];
    const out = new Uint8Array(bytes.length + app0.length);
    out.set(bytes.subarray(0, 2), 0);
    out.set(app0, 2);
    out.set(bytes.subarray(2), 2 + app0.length);
    return out;
  }
  const out = bytes.slice();
  out[13] = 1; // units: dots per inch
  out[14] = dpi >> 8; out[15] = dpi & 255;
  out[16] = dpi >> 8; out[17] = dpi & 255;
  return out;
}

/** "84 kB" (1 kB = 1,000 bytes, as the State Department counts it). */
export const formatKB = (bytes) => `${Math.max(1, Math.round(bytes / 1000))} kB`;
