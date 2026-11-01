import { romanizedToUnicode } from './lib/romanized.js';
import { copyText, store } from './site.js';

const $ = (id) => document.getElementById(id);
const input = $('rz-in');
const output = $('rz-out');
const opts = { smart: $('rz-smart'), digits: $('rz-digits'), danda: $('rz-danda') };

function run() {
  const text = input.value;
  output.value = romanizedToUnicode(text, {
    smart: opts.smart.checked,
    digits: opts.digits.checked,
    danda: opts.danda.checked,
  });
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  $('rz-count').textContent = `${words} word${words === 1 ? '' : 's'}`;
  store.set('hp-rz-text', text);
}

input.value = store.get('hp-rz-text') || '';
input.addEventListener('input', run);
Object.values(opts).forEach((o) => o.addEventListener('change', run));
$('rz-clear').addEventListener('click', () => { input.value = ''; run(); input.focus(); });
$('rz-copy').addEventListener('click', (e) => copyText(output.value, e.currentTarget, 'Copied ✓'));
$('rz-download').addEventListener('click', () => {
  const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'nepali-text.txt' });
  a.click();
  URL.revokeObjectURL(a.href);
});
document.querySelectorAll('.ex').forEach((b) => b.addEventListener('click', () => {
  input.value = b.dataset.ex;
  run();
  input.focus();
}));
run();
