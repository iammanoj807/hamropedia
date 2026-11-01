import { todayInNepal, formatBs, formatAd, bsToAd } from './lib/bs-date.js';
import { romanizedToUnicode } from './lib/romanized.js';

try {
  const t = todayInNepal();
  const ad = bsToAd(t.year, t.month, t.day);
  document.querySelector('[data-np-today-ne]').textContent = formatBs(t);
  document.querySelector('[data-np-today-en]').textContent = `${formatBs(t, 'en')} · ${formatAd(ad)}`;
} catch { /* out of range */ }

const input = document.getElementById('qt-in');
const out = document.getElementById('qt-out');
if (input && out) {
  const run = () => { out.textContent = romanizedToUnicode(input.value) || ' '; };
  input.addEventListener('input', run);
  run();
}
