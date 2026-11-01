export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0900-\u097f]+/g, '-')
    .replace(/^-+|-+$/g, '');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));

/** Accepts a Date or "YYYY-MM-DD"; always treated as a calendar date (UTC). */
export function toDate(d) {
  if (d instanceof Date) return d;
  const [y, m, day] = String(d).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}
export const isoDate = (d) => toDate(d).toISOString().slice(0, 10);
export const longDate = (d) => {
  const t = toDate(d);
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
};
export const shortDate = (d) => {
  const t = toDate(d);
  return `${t.getUTCDate()} ${SHORT[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
};
export const rfc822 = (d) => toDate(d).toUTCString();

export function readingMinutes(text) {
  const words = String(text).replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export const abs = (siteUrl, path) => (path.startsWith('http') ? path : siteUrl + path);

export const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
