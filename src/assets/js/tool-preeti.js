import { preetiToUnicode, unicodeToPreeti } from './lib/preeti.js';
import { romanizedToUnicode } from './lib/romanized.js';
import { copyText, store } from './site.js';

const $ = (id) => document.getElementById(id);
const input = $('pr-in');
const output = $('pr-out');

// Each direction: how to convert, what the boxes are called, and examples.
const MODES = {
  p2u: {
    run: (s) => preetiToUnicode(s),
    inLabel: 'Paste Preeti text',
    outLabel: 'Nepali Unicode',
    placeholder: 'Paste text typed in the Preeti font, e.g. g]kfn',
    inNe: false,
    outNe: true,
    note: 'Preeti text looks like <code>g]kfn</code> when the font is missing. Paste it as it is; the result box shows real Nepali you can use anywhere.',
    examples: ['g]kfn', 'xfd|f] b]z g]kfn xf] .', 'k|wfgdGqL', 'ljBfno', 'wGojfb'],
  },
  u2p: {
    run: (s) => unicodeToPreeti(s),
    inLabel: 'Paste Nepali Unicode',
    outLabel: 'Preeti (set the font to Preeti to read it)',
    placeholder: 'नेपाली युनिकोड यहाँ पेस्ट गर्नुहोस्',
    inNe: true,
    outNe: false,
    note: 'The result looks like English letters until you paste it into a document and choose the <strong>Preeti</strong> font.',
    examples: ['नेपाल', 'हाम्रो देश नेपाल हो ।', 'प्रधानमन्त्री', 'विद्यालय', 'धन्यवाद'],
  },
  r2p: {
    run: (s) => unicodeToPreeti(romanizedToUnicode(s)),
    inLabel: 'Type in English letters (Romanized)',
    outLabel: 'Preeti (set the font to Preeti to read it)',
    placeholder: 'Try: mero naam Hari ho.',
    inNe: false,
    outNe: false,
    note: 'Type Nepali the way it sounds (<code>namaste</code>), and get Preeti keys for a Preeti document. Set the font to Preeti to read the result.',
    examples: ['namaste', 'mero naam Hari ho.', 'nepal', 'dhanyabad', 'kathmandu'],
  },
};

let mode = MODES[store.get('hp-pr-mode')] ? store.get('hp-pr-mode') : 'p2u';
let timer = 0;

function convert() {
  const text = input.value;
  output.value = MODES[mode].run(text);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  $('pr-count').textContent = `${words} word${words === 1 ? '' : 's'}`;
  store.set('hp-pr-text', text);
}

// Short texts convert on every key; long pastes wait for a pause.
function schedule() {
  clearTimeout(timer);
  if (input.value.length < 4000) convert();
  else timer = setTimeout(convert, 200);
}

function setMode(next, { keepText = true } = {}) {
  mode = next;
  store.set('hp-pr-mode', mode);
  const m = MODES[mode];
  document.querySelectorAll('#pr-tool [data-mode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === mode)));
  $('pr-in-label').textContent = m.inLabel;
  $('pr-out-label').textContent = m.outLabel;
  input.placeholder = m.placeholder;
  input.classList.toggle('ne-text', m.inNe);
  output.classList.toggle('ascii', !m.outNe);
  if (m.inNe) input.setAttribute('lang', 'ne'); else input.removeAttribute('lang');
  if (m.outNe) output.setAttribute('lang', 'ne'); else output.removeAttribute('lang');
  $('pr-note').innerHTML = m.note;
  $('pr-examples').innerHTML = m.examples
    .map((e) => `<button type="button" class="ex" data-ex="${e.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${e.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</button>`)
    .join(' ');
  if (!keepText) input.value = '';
  convert();
}

document.querySelectorAll('#pr-tool [data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('pr-examples').addEventListener('click', (e) => {
  const b = e.target.closest('.ex');
  if (!b) return;
  input.value = b.dataset.ex;
  convert();
  input.focus();
});
input.addEventListener('input', schedule);
$('pr-clear').addEventListener('click', () => { input.value = ''; convert(); input.focus(); });
$('pr-copy').addEventListener('click', (e) => copyText(output.value, e.currentTarget, 'Copied ✓'));
$('pr-swap').addEventListener('click', () => {
  // Use the result as the new input and reverse the direction.
  const result = output.value;
  const next = mode === 'p2u' ? 'u2p' : 'p2u';
  input.value = result;
  setMode(mode === 'r2p' ? 'p2u' : next);
});
$('pr-download').addEventListener('click', () => {
  const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' });
  const name = mode === 'p2u' ? 'nepali-unicode.txt' : 'preeti.txt';
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
  a.click();
  URL.revokeObjectURL(a.href);
});
$('pr-file').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  input.value = await file.text();
  convert();
  e.target.value = '';
});

input.value = store.get('hp-pr-text') || '';
setMode(mode);
