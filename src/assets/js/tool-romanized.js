import { romanizedToUnicode } from './lib/romanized.js';
import { englishToNepaliTokens } from './lib/english-nepali.js';
import { copyText, store } from './site.js';

const $ = (id) => document.getElementById(id);
const input = $('rz-in');
const output = $('rz-out');
const check = $('rz-check');
const opts = { smart: $('rz-smart'), digits: $('rz-digits'), danda: $('rz-danda') };
const modeInputs = [...document.querySelectorAll('input[name="rz-mode"]')];

// Spellings the person picked in English mode, keyed by lowercase word.
let choices = {};
try { choices = JSON.parse(store.get('hp-rz-choices') || '{}') || {}; } catch { choices = {}; }

const PLACEHOLDER = {
  roman: 'Try: mero naam Hari ho. ma nepalma baschhu.',
  english: 'Type your name as written in English, e.g. Ram Bahadur Thapa',
};
const LABEL = { roman: 'Type in English letters', english: 'Type in normal English spelling' };

function mode() {
  return modeInputs.find((m) => m.checked)?.value || 'roman';
}

function renderCheck(tokens) {
  const words = [];
  const seen = new Set();
  for (const t of tokens) {
    if (t.type !== 'word' || seen.has(t.key) || !(t.guessed || t.options.length > 1)) continue;
    seen.add(t.key);
    words.push(t);
  }
  check.hidden = words.length === 0;
  if (!words.length) { check.replaceChildren(); return; }
  const head = document.createElement('p');
  head.className = 'rz-check-head';
  head.textContent = 'Check these words. Pick the spelling on your citizenship certificate:';
  const list = document.createElement('ul');
  for (const t of words) {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'rz-check-word';
    name.textContent = t.word + (t.guessed ? ' (guessed)' : '');
    li.append(name);
    const picked = Math.min(choices[t.key] ?? 0, t.options.length - 1);
    t.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rz-alt' + (i === picked ? ' is-picked' : '');
      b.lang = 'ne';
      b.textContent = opt;
      b.setAttribute('aria-pressed', String(i === picked));
      b.addEventListener('click', () => {
        choices[t.key] = i;
        store.set('hp-rz-choices', JSON.stringify(choices));
        run();
      });
      li.append(b);
    });
    list.append(li);
  }
  check.replaceChildren(head, list);
}

function run() {
  const text = input.value;
  const m = mode();
  if (m === 'english') {
    const tokens = englishToNepaliTokens(text, { digits: opts.digits.checked, danda: opts.danda.checked });
    output.value = tokens.map((t) => (t.type === 'raw' ? t.out : t.options[Math.min(choices[t.key] ?? 0, t.options.length - 1)])).join('');
    renderCheck(tokens);
  } else {
    output.value = romanizedToUnicode(text, {
      smart: opts.smart.checked,
      digits: opts.digits.checked,
      danda: opts.danda.checked,
    });
    check.hidden = true;
    check.replaceChildren();
  }
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  $('rz-count').textContent = `${words} word${words === 1 ? '' : 's'}`;
  store.set('hp-rz-text', text);
}

function applyMode(m) {
  modeInputs.forEach((r) => { r.checked = r.value === m; });
  input.placeholder = PLACEHOLDER[m];
  $('rz-in-label').textContent = LABEL[m];
  $('rz-smart-wrap').hidden = m === 'english';
  $('rz-cheat').hidden = m === 'english';
  document.querySelectorAll('.examples[data-mode]').forEach((el) => { el.hidden = el.dataset.mode !== m; });
  store.set('hp-rz-mode', m);
}

// A link such as /tools/english-to-nepali/?mode=english opens the English mode.
const urlMode = new URLSearchParams(location.search).get('mode');
applyMode(urlMode === 'english' || urlMode === 'roman' ? urlMode : (store.get('hp-rz-mode') === 'english' ? 'english' : 'roman'));

input.value = store.get('hp-rz-text') || '';
input.addEventListener('input', run);
Object.values(opts).forEach((o) => o.addEventListener('change', run));
modeInputs.forEach((r) => r.addEventListener('change', () => { applyMode(mode()); run(); input.focus(); }));
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
