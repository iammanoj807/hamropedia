// Draws the practice photo for the DV photo tool: a drawn (not real) person on a plain
// light background, small and off-centre, so people can practise moving and zooming.
// Run once: node scripts/make-photo-example.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { personShapes } from '../src/assets/js/lib/photo-figure.js';

const W = 1500;
const H = 2000;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#f3f2ef"/>${personShapes({ cx: 640, top: 760, headH: 600, frameH: H })}</svg>`;
const out = path.join('public', 'images', 'tools', 'dv-example-photo.jpg');
fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(out);
console.log('wrote', out, fs.statSync(out).size, 'bytes');
