import { ROWS, keyLabel, initState, press, backspace, moveCaret, deleteRange, charForKeyEvent } from './lib/keyboard.js';
import { copyText, store } from './site.js';

const $ = (id) => document.getElementById(id);
const ta = $('kb-text');
const kb = $('kb');
const onBox = $('kb-on');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let shift = false;
let state = initState(store.get('hp-kb-text') || '');

// On phones and tablets, use the on-screen keys instead of the phone's keyboard.
const touch = window.matchMedia('(pointer: coarse)').matches;
function applyInputMode() {
  if (touch && onBox.checked) ta.setAttribute('inputmode', 'none');
  else ta.removeAttribute('inputmode');
}


function renderKeys() {
  const rows = ROWS.map((row, ri) => `<div class="kb-row kb-row-${ri}">${row
    .map(([code, normal, shifted]) => {
      const ch = shift ? shifted : normal;
      const alt = shift ? normal : shifted;
      return `<button type="button" class="kb-key" data-ch="${esc(ch)}" data-code="${code}" aria-label="${esc(keyLabel(ch))} (${esc(ch)})"><span class="kb-main" lang="ne">${esc(keyLabel(ch))}</span><span class="kb-alt" lang="ne" aria-hidden="true">${esc(keyLabel(alt))}</span><span class="kb-cap" aria-hidden="true">${esc(ch)}</span></button>`;
    })
    .join('')}</div>`).join('');
  kb.innerHTML = `${rows}<div class="kb-row kb-ctrl">
    <button type="button" class="kb-key kb-shift" data-act="shift" aria-pressed="${shift}">⇧ Shift</button>
    <button type="button" class="kb-key kb-space" data-act="space" aria-label="Space">Space</button>
    <button type="button" class="kb-key kb-back" data-act="back" aria-label="Backspace">⌫</button>
    <button type="button" class="kb-key kb-enter" data-act="enter" aria-label="New line">↵</button>
  </div>`;
}

function save() {
  store.set('hp-kb-text', state.text);
  const words = state.text.trim() ? state.text.trim().split(/\s+/).length : 0;
  $('kb-count').textContent = `${words} word${words === 1 ? '' : 's'}`;
}

function sync() {
  ta.value = state.text;
  ta.setSelectionRange(state.caret, state.caret);
  save();
}

// Bring our state in line with the textarea (after a click, arrow key, paste...).
function syncFromDom() {
  if (ta.value !== state.text) {
    state = { text: ta.value, caret: ta.selectionStart, raw: '', start: ta.selectionStart };
  } else if (ta.selectionStart !== state.caret) {
    state = moveCaret(state, ta.selectionStart);
  }
}

function typeChar(ch) {
  if (ta.selectionStart !== ta.selectionEnd) state = deleteRange(state, ta.selectionStart, ta.selectionEnd);
  state = press(state, ch);
  sync();
}

function flash(code) {
  const k = kb.querySelector(`[data-code="${code}"]`);
  if (!k) return;
  k.classList.add('is-down');
  setTimeout(() => k.classList.remove('is-down'), 140);
}

ta.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.code === 'Space') {
    e.preventDefault();
    onBox.checked = !onBox.checked;
    applyInputMode();
    return;
  }
  if (e.key === 'Shift' && !shift) { shift = true; renderKeys(); return; }
  if (!onBox.checked || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
  syncFromDom();
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (ta.selectionStart !== ta.selectionEnd) state = deleteRange(state, ta.selectionStart, ta.selectionEnd);
    else state = backspace(state);
    sync();
    return;
  }
  let ch = null;
  if (e.key === 'Enter') ch = '\n';
  else if (e.code === 'Space') ch = ' ';
  else ch = charForKeyEvent(e.code, e.key, e.shiftKey);
  if (ch === null) return; // arrows, Tab, Delete etc. behave normally
  e.preventDefault();
  flash(e.code);
  typeChar(ch);
});
ta.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') { shift = false; renderKeys(); }
  if (/^(Arrow|Home|End|Page)/.test(e.key)) syncFromDom();
});
ta.addEventListener('click', syncFromDom);
ta.addEventListener('input', () => { // paste, cut, or typing with Nepali switched off
  state = { text: ta.value, caret: ta.selectionStart, raw: '', start: ta.selectionStart };
  save();
});

// On-screen keys. preventDefault on pointerdown keeps the cursor in the text box.
kb.addEventListener('pointerdown', (e) => { if (e.target.closest('.kb-key')) e.preventDefault(); });
kb.addEventListener('click', (e) => {
  const b = e.target.closest('.kb-key');
  if (!b) return;
  syncFromDom();
  const act = b.dataset.act;
  if (act === 'shift') { shift = !shift; renderKeys(); return; }
  if (act === 'back') {
    if (ta.selectionStart !== ta.selectionEnd) state = deleteRange(state, ta.selectionStart, ta.selectionEnd);
    else state = backspace(state);
    sync();
    return;
  }
  typeChar(act === 'space' ? ' ' : act === 'enter' ? '\n' : b.dataset.ch);
  if (shift) { shift = false; renderKeys(); }
  if (!touch) ta.focus();
});

onBox.addEventListener('change', applyInputMode);
$('kb-copy').addEventListener('click', (e) => copyText(ta.value, e.currentTarget, 'Copied ✓'));
$('kb-clear').addEventListener('click', () => { state = initState(''); sync(); if (!touch) ta.focus(); });
$('kb-download').addEventListener('click', () => {
  const blob = new Blob([ta.value], { type: 'text/plain;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'nepali-text.txt' });
  a.click();
  URL.revokeObjectURL(a.href);
});

applyInputMode();
renderKeys();
sync();
