import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, toPx, coverScale, rotatedBox, clampOffset, sheetLayout, encodeUnder, setJpegDpi, formatKB } from '../src/assets/js/lib/photo.js';

test('photo sizes: mm, cm and inches to pixels at 300 dpi', () => {
  assert.equal(toPx(35, 'mm'), 413);
  assert.equal(toPx(45, 'mm'), 531);
  assert.equal(toPx(3.5, 'cm'), 413);
  assert.equal(toPx(2, 'in'), 600);
  assert.equal(toPx(51, 'mm'), 602);
  assert.equal(toPx(600, 'px'), 600);
  assert.equal(toPx('', 'mm'), 0);
  assert.equal(toPx(-5, 'mm'), 0);
});

test('photo presets match the official numbers', () => {
  // DV: 600x600 square JPEG, 240 kB or less (U.S. Department of State); head 50-69% of height
  assert.deepEqual([PRESETS.dv.w, PRESETS.dv.h, PRESETS.dv.maxBytes], [600, 600, 240000]);
  assert.deepEqual([PRESETS.dv.guide.min, PRESETS.dv.guide.max], [0.5, 0.69]);
  // Nepal passport size 35x45 mm at 300 dpi; 2x2 inch
  assert.deepEqual([PRESETS.np.w, PRESETS.np.h], [413, 531]);
  assert.deepEqual([PRESETS.us2x2.w, PRESETS.us2x2.h], [600, 600]);
  assert.equal(PRESETS.dv.sheet, undefined); // the DV entry is a digital file, not a print
});

test('photo crop: cover scale fills the frame, also when rotated', () => {
  assert.equal(coverScale(4000, 3000, 600, 600), 0.2); // landscape photo: height decides
  assert.equal(coverScale(3000, 4000, 413, 531), Math.max(413 / 3000, 531 / 4000));
  // a quarter turn swaps width and height
  const q = coverScale(4000, 3000, 413, 531, Math.PI / 2);
  assert.ok(Math.abs(q - Math.max(531 / 4000, 413 / 3000)) < 1e-9);
  // a small tilt needs a little more zoom to keep the corners covered
  assert.ok(coverScale(4000, 3000, 600, 600, (5 * Math.PI) / 180) > 0.2);
  const box = rotatedBox(4000, 3000, 0.2, 0);
  assert.deepEqual([Math.round(box.w), Math.round(box.h)], [800, 600]);
});

test('photo crop: offsets stop at the edge of the photo', () => {
  // 800x600 image in a 600x600 frame can move 100 px (1/6 of the frame) left or right, not up or down
  const o = clampOffset(1, 1, { w: 800, h: 600 }, 600, 600);
  assert.ok(Math.abs(o.ox - 100 / 600) < 1e-9);
  assert.equal(o.oy, 0);
  assert.ok(Math.abs(clampOffset(-1, 0, { w: 800, h: 600 }, 600, 600).ox + 100 / 600) < 1e-9);
});

test('photo print sheet: 8 Nepal passport photos or 2 of 2x2 inch on 4x6', () => {
  const np = sheetLayout(413, 531);
  assert.equal(np.count, 8);
  assert.deepEqual([np.w, np.h, np.cols, np.rows], [1800, 1200, 4, 2]);
  for (const { x, y } of np.positions) {
    assert.ok(x >= 24 && y >= 24 && x + 413 <= 1800 - 24 && y + 531 <= 1200 - 24);
  }
  assert.equal(sheetLayout(600, 600).count, 2);
  assert.equal(sheetLayout(2000, 2000), null);
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

test('photo file: 300 dpi is written into the JPEG header', () => {
  const jfif = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  const out = setJpegDpi(jfif, 300);
  assert.deepEqual([...out.slice(13, 18)], [1, 1, 44, 1, 44]);
  // no JFIF header (an Exif-first JPEG): one is added after the start marker
  const exifFirst = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 2, 0xff, 0xd9]);
  const added = setJpegDpi(exifFirst, 300);
  assert.equal(added.length, exifFirst.length + 18);
  assert.deepEqual([...added.slice(0, 4)], [0xff, 0xd8, 0xff, 0xe0]);
  assert.deepEqual([...added.slice(13, 18)], [1, 1, 44, 1, 44]);
  assert.deepEqual([...added.slice(20)], [0xff, 0xe1, 0, 2, 0xff, 0xd9]);
  const notJpeg = new Uint8Array([1, 2, 3]);
  assert.equal(setJpegDpi(notJpeg, 300), notJpeg);
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
  // Nepal size has no JPEG or kB rule; shape 413:531
  const np = checkFile({ type: 'image/jpeg', bytes: 40000, w: 413, h: 531 }, PRESETS.np);
  assert.deepEqual(np.map((r) => r.key), ['shape', 'pixels']);
  assert.ok(np.every((r) => r.ok));
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
