// Nepali keyboard engine: pure functions, no DOM, so it can be unit-tested.
//
// Each keystroke is added to the "raw" keys of the word being typed, and the
// whole word is re-converted. That is what lets Preeti typing habits work
// (ि typed before its letter, the reph "{" typed after its syllable, k + m = फ):
// the Preeti engine already knows how to put those in Unicode order.
// A space, a new line, or moving the cursor finishes ("commits") the word.

import { preetiToUnicode, PREETI_MAP } from './preeti.js';
import { romanizedToUnicode, romanKeyLabel } from './romanized.js';

// US keyboard rows: [event.code, normal character, shifted character]
export const ROWS = [
  [['Backquote', '`', '~'], ['Digit1', '1', '!'], ['Digit2', '2', '@'], ['Digit3', '3', '#'], ['Digit4', '4', '$'], ['Digit5', '5', '%'], ['Digit6', '6', '^'], ['Digit7', '7', '&'], ['Digit8', '8', '*'], ['Digit9', '9', '('], ['Digit0', '0', ')'], ['Minus', '-', '_'], ['Equal', '=', '+']],
  [['KeyQ', 'q', 'Q'], ['KeyW', 'w', 'W'], ['KeyE', 'e', 'E'], ['KeyR', 'r', 'R'], ['KeyT', 't', 'T'], ['KeyY', 'y', 'Y'], ['KeyU', 'u', 'U'], ['KeyI', 'i', 'I'], ['KeyO', 'o', 'O'], ['KeyP', 'p', 'P'], ['BracketLeft', '[', '{'], ['BracketRight', ']', '}'], ['Backslash', '\\', '|']],
  [['KeyA', 'a', 'A'], ['KeyS', 's', 'S'], ['KeyD', 'd', 'D'], ['KeyF', 'f', 'F'], ['KeyG', 'g', 'G'], ['KeyH', 'h', 'H'], ['KeyJ', 'j', 'J'], ['KeyK', 'k', 'K'], ['KeyL', 'l', 'L'], ['Semicolon', ';', ':'], ['Quote', "'", '"']],
  [['KeyZ', 'z', 'Z'], ['KeyX', 'x', 'X'], ['KeyC', 'c', 'C'], ['KeyV', 'v', 'V'], ['KeyB', 'b', 'B'], ['KeyN', 'n', 'N'], ['KeyM', 'm', 'M'], ['Comma', ',', '<'], ['Period', '.', '>'], ['Slash', '/', '?']],
];

const BY_CODE = new Map(ROWS.flat().map(([code, normal, shifted]) => [code, [normal, shifted]]));

/**
 * The US-layout character for a physical key. Preeti positions are defined on
 * the US layout, so we read event.code (the physical key) rather than
 * event.key, which differs on UK and other keyboards (Shift+2 is " in the UK).
 */
export function charForCode(code, shift) {
  const k = BY_CODE.get(code);
  return k ? k[shift ? 1 : 0] : null;
}

/**
 * Which US-layout character a key press means. If the character the browser
 * reports is one of the two on that physical key, trust it (this also handles
 * Caps Lock). Otherwise (a UK or other layout prints something different, like
 * " for Shift+2) fall back to the physical key and the Shift state.
 */
export function charForKeyEvent(code, key, shiftKey) {
  const k = BY_CODE.get(code);
  if (!k) return null;
  if (key === k[0]) return k[0];
  if (key === k[1]) return k[1];
  return k[shiftKey ? 1 : 0];
}

const COMBINING = /^[ऀ-ःऺ-ॏ॑-ॗॢॣ]/;
const showMark = (s) => (COMBINING.test(s) ? '◌' + s : s);

export const LAYOUTS = {
  preeti: {
    name: 'Preeti layout',
    convert: (raw) => preetiToUnicode(raw),
    label: (ch) => {
      if (ch === 'm') return 'फ झ';
      if (ch === '{') return '◌र्';
      const v = PREETI_MAP[ch];
      return v === undefined ? ch : showMark(v);
    },
  },
  romanized: {
    name: 'Romanized (phonetic)',
    convert: (raw) => romanizedToUnicode(raw, { smart: true }),
    label: (ch) => showMark(romanKeyLabel(ch)),
  },
};

/** Editor state: the text, the cursor, and the raw keys of the word being typed. */
export function initState(text = '') {
  return { text, caret: text.length, raw: '', start: text.length };
}

const convert = (layout, raw) => (raw ? LAYOUTS[layout].convert(raw) : '');

/** Finish the current word (it stays as it is). */
export function commit(state) {
  return { ...state, raw: '', start: state.caret };
}

/** The cursor moved (click, arrow key): finish the word and continue from the new place. */
export function moveCaret(state, caret) {
  if (caret === state.caret) return state;
  return { ...state, raw: '', caret, start: caret };
}

/** Replace the selected range (from..to) with nothing, finishing the current word. */
export function deleteRange(state, from, to) {
  const text = state.text.slice(0, from) + state.text.slice(to);
  return { text, caret: from, raw: '', start: from };
}

function insertLiteral(state, ch) {
  const text = state.text.slice(0, state.caret) + ch + state.text.slice(state.caret);
  const caret = state.caret + ch.length;
  return { text, caret, raw: '', start: caret };
}

/** Type one key (a US-layout character) in the given layout. */
export function press(state, ch, layout) {
  if (ch === ' ' || ch === '\n' || ch === '\t') return insertLiteral(commit(state), ch);
  const s = state.raw ? state : { ...state, start: state.caret };
  const before = convert(layout, s.raw);
  const raw = s.raw + ch;
  const after = convert(layout, raw);
  const text = s.text.slice(0, s.start) + after + s.text.slice(s.start + before.length);
  return { text, raw, start: s.start, caret: s.start + after.length };
}

/** Backspace: inside the word being typed, remove the last key; otherwise delete one character. */
export function backspace(state, layout) {
  if (state.raw) {
    const before = convert(layout, state.raw);
    const raw = state.raw.slice(0, -1);
    const after = convert(layout, raw);
    const text = state.text.slice(0, state.start) + after + state.text.slice(state.start + before.length);
    return { text, raw, start: state.start, caret: state.start + after.length };
  }
  if (state.caret === 0) return state;
  const text = state.text.slice(0, state.caret - 1) + state.text.slice(state.caret);
  const caret = state.caret - 1;
  return { text, caret, raw: '', start: caret };
}
