import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, coverScale, encodeUnder, formatKB } from '../src/assets/js/lib/photo.js';

test('photo presets match the official numbers', () => {
  // DV: 600x600 square JPEG, 240 kB or less (U.S. Department of State); head 50-69% of height
  assert.deepEqual([PRESETS.dv.w, PRESETS.dv.h, PRESETS.dv.maxBytes], [600, 600, 240000]);
  assert.deepEqual([PRESETS.dv.guide.min, PRESETS.dv.guide.max], [0.5, 0.69]);
  assert.equal(PRESETS.dv.sheet, undefined); // the DV entry is a digital file, not a print
});

test('photo crop: cover scale fills the frame, also when rotated', () => {
  assert.equal(coverScale(4000, 3000, 600, 600), 0.2); // landscape photo: height decides
  assert.equal(coverScale(3000, 4000, 600, 600), 0.2); // portrait photo: width decides
  // a small tilt needs a little more zoom to keep the corners covered
  assert.ok(coverScale(4000, 3000, 600, 600, (5 * Math.PI) / 180) > 0.2);
});

test('photo file size: finds the best JPEG quality under the limit', async () => {
  const encode = async (q) => ({ size: Math.round(q * 300000) }); // pretend size grows with quality
  const under = await encodeUnder(encode, 240000);
  assert.ok(under.blob.size <= 240000);
  assert.ok(under.quality > 0.7 && under.quality <= 0.8);
  const none = await encodeUnder(encode, 50000);
  assert.equal(none, null);
  const free = await encodeUnder(encode, 0);
  assert.equal(free.quality, 0.95);
  assert.equal(formatKB(239999), '240 kB');
});

test('photo checker: a phone photo fails the DV file rules, the tool output passes', async () => {
  const { checkFile } = await import('../src/assets/js/lib/photo.js');
  const phone = checkFile({ type: 'image/png', bytes: 586000, w: 3000, h: 3539 }, PRESETS.dv);
  const by = Object.fromEntries(phone.map((r) => [r.key, r]));
  assert.equal(by.format.ok, false);
  assert.equal(by.bytes.ok, false);
  assert.match(by.bytes.detail, /586 kB: must be 240 kB or less/);
  assert.equal(by.shape.ok, false);
  assert.equal(by.pixels.ok, false);
  assert.equal(by.detail.ok, true); // big enough to crop down
  const out = checkFile({ type: 'image/jpeg', bytes: 52000, w: 600, h: 600 }, PRESETS.dv);
  assert.ok(out.every((r) => r.ok === true));
  // a small photo is flagged as possibly blurry, but not as a failure
  const small = checkFile({ type: 'image/jpeg', bytes: 30000, w: 400, h: 400 }, PRESETS.dv);
  assert.equal(small.find((r) => r.key === 'detail').ok, null);
});

test('photo checker: colour and background hints', async () => {
  const { analyzePixels, pixelRows } = await import('../src/assets/js/lib/photo.js');
  const W = 40;
  const H = 40;
  const img = (bg, person) => {
    const d = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const inPerson = x > 12 && x < 28 && y > 10;
        const [r, g, b] = inPerson ? person : bg;
        d.set([r, g, b, 255], (y * W + x) * 4);
      }
    }
    return d;
  };
  const white = analyzePixels(img([245, 245, 240], [200, 150, 120]), W, H);
  assert.deepEqual([white.background, white.grey], ['light', false]);
  const black = analyzePixels(img([10, 10, 10], [200, 150, 120]), W, H);
  assert.equal(black.background, 'dark');
  assert.equal(pixelRows(black).find((r) => r.key === 'background').ok, false);
  const blue = analyzePixels(img([170, 200, 240], [200, 150, 120]), W, H); // light but clearly blue
  assert.equal(blue.background, 'unclear');
  const grey = analyzePixels(img([240, 240, 240], [120, 120, 120]), W, H);
  assert.equal(grey.grey, true);
  assert.equal(pixelRows(grey).find((r) => r.key === 'colour').ok, false);
});

test('photo crop: the photo always covers the frame, also when tilted', async () => {
  const { coversFrame, keepCovered, coverScale } = await import('../src/assets/js/lib/photo.js');
  const [iw, ih, W, H] = [800, 1000, 600, 600];
  const k = coverScale(iw, ih, W, H); // 0.75: the image is 600 x 750 on screen
  assert.equal(coversFrame(0, 0, k, iw, ih, W, H), true);
  assert.equal(coversFrame(0, 0.12, k, iw, ih, W, H), true); // 75 px of room up and down = 0.125
  assert.equal(coversFrame(0, 0.13, k, iw, ih, W, H), false);
  assert.equal(coversFrame(0.01, 0, k, iw, ih, W, H), false); // no room left or right
  // dragging past the edge stops at the edge and still slides the other way
  const fits = (ox, oy) => coversFrame(ox, oy, k, iw, ih, W, H);
  const got = keepCovered({ ox: 0.2, oy: 0.5 }, { ox: 0, oy: 0 }, fits);
  assert.ok(Math.abs(got.ox) < 1e-6 && Math.abs(got.oy - 0.125) < 1e-4);
  // tilted 5 degrees: the cover scale for that angle covers the corners at the centre
  const t = (5 * Math.PI) / 180;
  const kt = coverScale(iw, ih, W, H, t);
  assert.equal(coversFrame(0, 0, kt, iw, ih, W, H, t), true);
  assert.equal(coversFrame(0, 0, k, iw, ih, W, H, t), false); // the untilted scale shows white corners
});

test('photo head check: estimated head size and the advice', async () => {
  const { estimateHead, assessHead } = await import('../src/assets/js/lib/photo.js');
  // 68 points: chin (8) at y 480, eyebrows (17-26) at y 300, eyes level, face centred at x 300
  const pts = Array.from({ length: 68 }, () => ({ x: 300, y: 380 }));
  pts[0] = { x: 200, y: 330 }; pts[16] = { x: 400, y: 330 }; pts[8] = { x: 300, y: 480 };
  for (let i = 17; i <= 26; i++) pts[i] = { x: 230 + i, y: 300 };
  for (let i = 36; i <= 41; i++) pts[i] = { x: 250, y: 330 };
  for (let i = 42; i <= 47; i++) pts[i] = { x: 350, y: 330 };
  const head = estimateHead(pts);
  assert.equal(head.crownY, 300 - 0.75 * 180); // 165
  assert.equal(Math.round(head.tiltDeg), 0);
  const dv = { good: [0.53, 0.66], ok: [0.5, 0.69] };
  const a = assessHead(head, 600, 600, dv); // (480 - 165) / 600 = 52.5%: inside the limits but close
  assert.equal(a.status, 'close');
  assert.equal(assessHead({ ...head, crownY: 120 }, 600, 600, dv).status, 'good'); // 60%
  assert.equal(assessHead({ ...head, crownY: 250 }, 600, 600, dv).status, 'small');
  assert.equal(assessHead({ ...head, crownY: 40 }, 600, 600, dv).status, 'big');
  assert.equal(assessHead({ ...head, crownY: -30 }, 600, 600, dv).status, 'cut');
  const off = assessHead({ ...head, crownY: 120, faceCx: 380 }, 600, 600, dv);
  assert.equal(off.status, 'adjust'); // right size, but not in the middle
  assert.match(off.tips.join(' '), /Move the photo left/);
  const tilted = assessHead({ ...head, crownY: 120, tiltDeg: 6 }, 600, 600, dv);
  assert.match(tilted.tips.join(' '), /Straighten about 6° to the left/);
});
