// Generates cover art (WebP, for cards and article heads) and social images
// (JPG, for Facebook/LinkedIn/X previews) for every post, plus defaults,
// tool and roadmap images, and the favicons.
//   npm run covers            # only creates missing files
//   npm run covers -- --force # regenerates everything
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const force = process.argv.includes('--force');

const THEMES = {
  'study-abroad': { a: '#0b2563', b: '#2453c4', label: 'STUDY ABROAD', glyph: 'plane' },
  coding: { a: '#06323a', b: '#0e7490', label: 'CODING', glyph: 'code' },
  ai: { a: '#1e1b4b', b: '#4f46e5', label: 'AI & MACHINE LEARNING', glyph: 'nodes' },
  nepal: { a: '#0b1b47', b: '#1d4ed8', label: 'NEPAL', glyph: 'sun' },
  tools: { a: '#0b1b47', b: '#2453c4', label: 'FREE TOOL', glyph: 'keys' },
  roadmap: { a: '#0b1120', b: '#3b4fd8', label: 'FREE ROADMAP', glyph: 'nodes' },
  site: { a: '#0b1b47', b: '#2453c4', label: 'HAMROPEDIA.COM', glyph: 'sun' },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function glyph(kind) {
  const c = 'rgba(255,255,255,0.10)';
  switch (kind) {
    case 'plane':
      return `<g transform="translate(905 120) rotate(-18)" fill="${c}"><path d="M0 60 L210 40 L250 0 L275 0 L245 45 L330 40 L355 18 L372 18 L358 58 L372 98 L355 98 L330 76 L245 71 L275 116 L250 116 L210 76 L0 56 Z"/></g>`;
    case 'code':
      return `<g fill="none" stroke="${c}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"><path d="M930 110 L860 190 L930 270"/><path d="M1060 110 L1130 190 L1060 270"/><path d="M1020 90 L970 290"/></g>`;
    case 'nodes': {
      const pts = [[880, 110], [990, 80], [1100, 140], [940, 220], [1060, 250], [1150, 60]];
      const lines = [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [1, 3], [2, 5]]
        .map(([i, j]) => `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}"/>`)
        .join('');
      return `<g stroke="${c}" stroke-width="5">${lines}</g><g fill="rgba(255,255,255,0.16)">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16"/>`).join('')}</g>`;
    }
    case 'keys':
      return `<g fill="${c}">${[0, 1, 2].map((r) => [0, 1, 2, 3].map((k) => `<rect x="${860 + k * 78 + r * 20}" y="${70 + r * 78}" width="64" height="64" rx="12"/>`).join('')).join('')}</g>`;
    default: // sun (from Nepal's flag)
      return `<g fill="${c}" transform="translate(1030 170)"><circle r="62"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0 -112 L16 -74 L-16 -74 Z" transform="rotate(${i * 30})"/>`).join('')}</g>`;
  }
}

function coverSvg({ title, theme }) {
  const t = THEMES[theme];
  const size = title.length > 80 ? 50 : title.length > 55 ? 58 : 66;
  const maxChars = Math.floor(1000 / (size * 0.5));
  const lines = wrap(title, maxChars).slice(0, 4);
  const startY = 330 - ((lines.length - 1) * size * 1.12) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.1" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  ${glyph(t.glyph)}
  <path d="M0 630 L0 520 L120 455 L190 495 L310 400 L400 470 L520 380 L610 450 L700 410 L820 485 L930 420 L1040 480 L1120 440 L1200 470 L1200 630 Z" fill="#000" opacity=".22"/>
  <path d="M0 630 L0 560 L150 505 L260 545 L380 490 L470 535 L600 470 L720 540 L860 495 L980 545 L1100 505 L1200 530 L1200 630 Z" fill="#000" opacity=".25"/>
  <g transform="translate(72 64)">
    <rect width="44" height="44" rx="11" fill="#fff"/>
    <path d="M6 33 L17 15 L22 23 L28 13 L39 33 Z" fill="${t.b}"/>
    <text x="60" y="32" font-family="Georgia, 'DejaVu Serif', serif" font-size="30" font-weight="700" fill="#fff">Hamropedia</text>
  </g>
  <g transform="translate(72 150)">
    <rect width="${t.label.length * 13 + 36}" height="40" rx="20" fill="rgba(255,255,255,0.16)"/>
    <text x="18" y="27" font-family="Helvetica, Arial, 'DejaVu Sans', sans-serif" font-size="18" font-weight="700" letter-spacing="2" fill="#fff">${esc(t.label)}</text>
  </g>
  ${lines.map((l, i) => `<text x="72" y="${startY + i * size * 1.12}" font-family="Georgia, 'DejaVu Serif', serif" font-size="${size}" font-weight="700" fill="#fff">${esc(l)}</text>`).join('\n  ')}
</svg>`;
}

async function render(svg, webpOut, jpgOut) {
  const buf = Buffer.from(svg);
  if (webpOut && (force || !fs.existsSync(webpOut))) {
    fs.mkdirSync(path.dirname(webpOut), { recursive: true });
    await sharp(buf).webp({ quality: 82 }).toFile(webpOut);
    console.log('wrote', path.relative(ROOT, webpOut));
  }
  if (jpgOut && (force || !fs.existsSync(jpgOut))) {
    fs.mkdirSync(path.dirname(jpgOut), { recursive: true });
    await sharp(buf).jpeg({ quality: 84, mozjpeg: true }).toFile(jpgOut);
    console.log('wrote', path.relative(ROOT, jpgOut));
  }
}

// Google recommends article images in 16:9, 4:3 and 1:1. Each one is the 1200x630 cover,
// extended top and bottom by repeating its edge colours, so nothing is cropped.
async function ratios(jpg) {
  for (const [name, h] of [['16x9', 675], ['4x3', 900], ['1x1', 1200]]) {
    const out = jpg.replace(/\.jpg$/, `-${name}.jpg`);
    if (!force && fs.existsSync(out)) continue;
    const pad = h - 630;
    await sharp(jpg)
      .extend({ top: Math.floor(pad / 2), bottom: Math.ceil(pad / 2), extendWith: 'copy' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(out);
    console.log('wrote', path.relative(ROOT, out));
  }
}

// posts
const postsDir = path.join(ROOT, 'src/content/posts');
for (const f of fs.readdirSync(postsDir).filter((x) => x.endsWith('.md'))) {
  const { data } = matter(fs.readFileSync(path.join(postsDir, f), 'utf8'));
  const slug = data.slug || f.replace(/\.md$/, '');
  const jpg = path.join(PUB, 'images/og', `${slug}.jpg`);
  await render(coverSvg({ title: data.coverTitle || data.title, theme: data.category }), null, jpg);
  await ratios(jpg);
}


// site, roadmap and tools
await render(coverSvg({ title: 'Nepali tools, a free AI roadmap and guides you can trust', theme: 'site' }), null, path.join(PUB, 'images/og-default.jpg'));
await render(coverSvg({ title: 'The free AI & Machine Learning Roadmap: 8 phases, 98 topics, 370+ resources', theme: 'roadmap' }), null, path.join(PUB, 'images/og/ai-roadmap.jpg'));
const tools = {
  'english-to-nepali': 'English to Nepali typing, free and instant',
  'nepali-keyboard': 'Nepali keyboard: Preeti layout and Romanized',
  'age-calculator': 'Age calculator: exact age in years, months and days',
  'nepali-date-converter': 'Nepali date converter: BS to AD, with calendar',
};
for (const [slug, title] of Object.entries(tools)) {
  await render(coverSvg({ title, theme: 'tools' }), null, path.join(PUB, 'images/og', `tool-${slug}.jpg`));
}

// favicons
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2453c4"/><path d="M8 48 L24 22 L32 34 L40 19 L56 48 Z" fill="#fff"/></svg>`;
fs.writeFileSync(path.join(PUB, 'favicon.svg'), favicon);
await sharp(Buffer.from(favicon)).resize(32, 32).png().toFile(path.join(PUB, 'favicon-32.png'));
await sharp(Buffer.from(favicon)).resize(180, 180).flatten({ background: '#2453c4' }).png().toFile(path.join(PUB, 'apple-touch-icon.png'));
await sharp(Buffer.from(favicon)).resize(192, 192).png().toFile(path.join(PUB, 'icon-192.png'));
await sharp(Buffer.from(favicon)).resize(512, 512).png().toFile(path.join(PUB, 'icon-512.png'));
console.log('favicons done');
