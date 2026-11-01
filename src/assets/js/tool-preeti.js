import { preetiToUnicode, unicodeToPreeti } from './lib/preeti.js';
import { copyText, store } from './site.js';

const $ = (id) => document.getElementById(id);
const input = $('pr-in');
const output = $('pr-out');
let dir = store.get('hp-pr-dir') === 'u2p' ? 'u2p' : 'p2u';

const LABELS = {
  p2u: { in: 'Paste Preeti text', out: 'Unicode नेपाली', ph: 'e.g. xfd|f] b]z g]kfn xf] .', note: 'Paste text that was typed with the Preeti font. If it looks like <code>g]kfn</code> when the font is missing, it is Preeti.' },
  u2p: { in: 'Paste Unicode Nepali', out: 'Preeti keys', ph: 'e.g. हाम्रो देश नेपाल हो ।', note: 'Copy the result into a document that uses the Preeti font, and it will show as Nepali there.' },
};

function setDir(d) {
  dir = d;
  store.set('hp-pr-dir', d);
  document.querySelectorAll('[data-dir]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.dir === d)));
  $('pr-in-label').textContent = LABELS[d].in;
  $('pr-out-label').textContent = LABELS[d].out;
  input.placeholder = LABELS[d].ph;
  $('pr-note').innerHTML = LABELS[d].note;
  input.lang = d === 'u2p' ? 'ne' : '';
  output.lang = d === 'p2u' ? 'ne' : '';
  output.style.fontFamily = d === 'u2p' ? 'var(--font-mono)' : '';
  output.style.fontSize = d === 'u2p' ? '1.1rem' : '';
  run();
}

function run() {
  const text = input.value;
  output.value = dir === 'p2u' ? preetiToUnicode(text) : unicodeToPreeti(text);
  $('pr-count').textContent = `${[...text].length} characters`;
  store.set('hp-pr-text', text);
}

input.value = store.get('hp-pr-text') || '';
input.addEventListener('input', run);
document.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => setDir(b.dataset.dir)));
$('pr-swap').addEventListener('click', () => {
  const out = output.value;
  input.value = out;
  setDir(dir === 'p2u' ? 'u2p' : 'p2u');
});
$('pr-clear').addEventListener('click', () => { input.value = ''; run(); input.focus(); });
$('pr-copy').addEventListener('click', (e) => copyText(output.value, e.currentTarget, 'Copied ✓'));
$('pr-download').addEventListener('click', () => {
  const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: dir === 'p2u' ? 'unicode-nepali.txt' : 'preeti.txt' });
  a.click();
  URL.revokeObjectURL(a.href);
});
setDir(dir);
