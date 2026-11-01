// Shared cover-art shapes. Used by the page templates (inline SVG whose colours
// come from CSS, so covers follow the visitor's chosen accent colour) and by
// scripts/make-covers.mjs (static social-share JPGs).

export const GLYPH_BY_CATEGORY = { 'study-abroad': 'plane', coding: 'code', ai: 'nodes', nepal: 'sun', tools: 'keys', roadmap: 'nodes', site: 'sun' };

const escXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function seeded(str) {
  let h = 2166136261;
  for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

export function ridge(rand, base, amp, steps) {
  const pts = [[0, 630], [0, Math.round(base + (rand() - 0.5) * amp)]];
  for (let i = 1; i <= steps; i++) pts.push([Math.round((1200 / steps) * i), Math.round(base + (rand() - 0.5) * amp * (i % 2 ? 1.6 : 0.6))]);
  pts.push([1200, 630]);
  return 'M' + pts.map((p) => p.join(' ')).join(' L') + ' Z';
}

export function wrap(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

export function glyph(kind, c = 'rgba(255,255,255,0.12)') {
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
      return `<g stroke="${c}" stroke-width="5">${lines}</g><g fill="rgba(255,255,255,0.18)">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16"/>`).join('')}</g>`;
    }
    case 'keys':
      return `<g fill="${c}">${[0, 1, 2].map((r) => [0, 1, 2, 3].map((k) => `<rect x="${860 + k * 78 + r * 20}" y="${70 + r * 78}" width="64" height="64" rx="12"/>`).join('')).join('')}</g>`;
    default: // sun, from Nepal's flag
      return `<g fill="${c}" transform="translate(1030 170)"><circle r="62"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0 -112 L16 -74 L-16 -74 Z" transform="rotate(${i * 30})"/>`).join('')}</g>`;
  }
}

/**
 * Inline cover art for cards and article heads. No colours or ids inside:
 * the background comes from CSS (.cover), so it follows the accent colour.
 */
export function coverArtSvg({ word, category, seed, label }) {
  const rand = seeded(seed);
  const lines = String(word).length > 9 ? wrap(word, 9).slice(0, 2) : [String(word)];
  const longest = Math.max(...lines.map((l) => l.length));
  const size = longest <= 3 ? 210 : longest <= 5 ? 170 : longest <= 7 ? 140 : 118;
  const y0 = lines.length === 1 ? 385 + size * 0.35 : 215 + size * 0.75;
  const shift = `translate(${Math.round(rand() * 60 - 30)} ${Math.round(rand() * 40)})`;
  return `<svg viewBox="0 0 1200 630" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
<g transform="${shift}">${glyph(GLYPH_BY_CATEGORY[category] || 'sun')}</g>
<path d="${ridge(rand, 470, 110, 9)}" fill="#000" opacity=".2"/>
<path d="${ridge(rand, 540, 70, 12)}" fill="#000" opacity=".24"/>
<g transform="translate(72 64)"><rect width="44" height="44" rx="11" fill="#fff"/><path class="cv-mark" d="M6 33 L17 15 L22 23 L28 13 L39 33 Z"/><text class="cv-brand" x="60" y="32">Hamropedia</text></g>
<g transform="translate(72 150)"><rect width="${Math.max(90, [...String(label)].length * 13 + 36)}" height="40" rx="20" fill="rgba(255,255,255,.16)"/><text class="cv-label" x="18" y="27">${escXml(label)}</text></g>
${lines.map((l, i) => `<text class="cv-word" x="66" y="${Math.round(y0 + i * size * 0.98)}" font-size="${size}">${escXml(l)}</text>`).join('')}
</svg>`;
}
