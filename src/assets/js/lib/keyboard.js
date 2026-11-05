// Nepali keyboard engine: pure functions, no DOM, so it can be unit-tested.
//
// One layout: Nepali Unicode Traditional, the standard of Madan Puraskar Pustakalaya (MPP)
// and Language Technology Kendra (LTK), made for people who learned on Preeti or Kantipur.
// Key map from LTK/MPP's own keyboard file (keymanapp/keyboards, nepali_mpp_traditional).
//
// Each keystroke is added to the "raw" keys of the word being typed, and the whole word is
// re-converted, so a Preeti habit such as ा then े can be turned into ो as you type.
// A space, a new line, or moving the cursor finishes ("commits") the word.

// US keyboard rows: [event.code, normal character, shifted character]
export const ROWS = [
  [['Backquote', '`', '~'], ['Digit1', '1', '!'], ['Digit2', '2', '@'], ['Digit3', '3', '#'], ['Digit4', '4', '$'], ['Digit5', '5', '%'], ['Digit6', '6', '^'], ['Digit7', '7', '&'], ['Digit8', '8', '*'], ['Digit9', '9', '('], ['Digit0', '0', ')'], ['Minus', '-', '_'], ['Equal', '=', '+']],
  [['KeyQ', 'q', 'Q'], ['KeyW', 'w', 'W'], ['KeyE', 'e', 'E'], ['KeyR', 'r', 'R'], ['KeyT', 't', 'T'], ['KeyY', 'y', 'Y'], ['KeyU', 'u', 'U'], ['KeyI', 'i', 'I'], ['KeyO', 'o', 'O'], ['KeyP', 'p', 'P'], ['BracketLeft', '[', '{'], ['BracketRight', ']', '}'], ['Backslash', '\\', '|']],
  [['KeyA', 'a', 'A'], ['KeyS', 's', 'S'], ['KeyD', 'd', 'D'], ['KeyF', 'f', 'F'], ['KeyG', 'g', 'G'], ['KeyH', 'h', 'H'], ['KeyJ', 'j', 'J'], ['KeyK', 'k', 'K'], ['KeyL', 'l', 'L'], ['Semicolon', ';', ':'], ['Quote', "'", '"']],
  [['KeyZ', 'z', 'Z'], ['KeyX', 'x', 'X'], ['KeyC', 'c', 'C'], ['KeyV', 'v', 'V'], ['KeyB', 'b', 'B'], ['KeyN', 'n', 'N'], ['KeyM', 'm', 'M'], ['Comma', ',', '<'], ['Period', '.', '>'], ['Slash', '/', '?']],
];

const BY_CODE = new Map(ROWS.flat().map(([code, normal, shifted]) => [code, [normal, shifted]]));
// UK and other ISO keyboards have an extra key left of Z; treat it like Backslash.
BY_CODE.set('IntlBackslash', ['\\', '|']);

/**
 * The US-layout character for a physical key. Nepali layouts are defined on
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

/** US-layout character → Nepali, for every key (normal and Shift). */
export const TRADITIONAL = new Map([
  ['`', 'ञ'],
  ['~', '॥'],
  ['1', '१'],
  ['!', 'ज्ञ'],
  ['2', '२'],
  ['@', 'ई'],
  ['3', '३'],
  ['#', 'घ'],
  ['4', '४'],
  ['$', 'द्ध'],
  ['5', '५'],
  ['%', 'छ'],
  ['6', '६'],
  ['^', 'ट'],
  ['7', '७'],
  ['&', 'ठ'],
  ['8', '८'],
  ['*', 'ड'],
  ['9', '९'],
  ['(', 'ढ'],
  ['0', '०'],
  [')', 'ण'],
  ['-', 'औ'],
  ['_', 'ओ'],
  ['=', '\u200D'],
  ['+', '\u200C'],
  ['q', 'त्र'],
  ['Q', 'त्त'],
  ['w', 'ध'],
  ['W', 'ड्ढ'],
  ['e', 'भ'],
  ['E', 'ऐ'],
  ['r', 'च'],
  ['R', 'द्व'],
  ['t', 'त'],
  ['T', 'ट्ट'],
  ['y', 'थ'],
  ['Y', 'ठ्ठ'],
  ['u', 'ग'],
  ['U', 'ऊ'],
  ['i', 'ष'],
  ['I', 'क्ष'],
  ['o', 'य'],
  ['O', 'इ'],
  ['p', 'उ'],
  ['P', 'ए'],
  ['[', 'र्'],
  ['{', 'ृ'],
  [']', 'े'],
  ['}', 'ै'],
  ['\\', '्'],
  ['|', 'ं'],
  ['a', 'ब'],
  ['A', 'आ'],
  ['s', 'क'],
  ['S', 'ङ्क'],
  ['d', 'म'],
  ['D', 'ङ्ग'],
  ['f', 'ा'],
  ['F', 'ँ'],
  ['g', 'न'],
  ['G', 'द्द'],
  ['h', 'ज'],
  ['H', 'झ'],
  ['j', 'व'],
  ['J', 'ो'],
  ['k', 'प'],
  ['K', 'फ'],
  ['l', 'ि'],
  ['L', 'ी'],
  [';', 'स'],
  [':', 'ट्ठ'],
  ['\'', 'ु'],
  ['"', 'ू'],
  ['z', 'श'],
  ['Z', 'क्क'],
  ['x', 'ह'],
  ['X', 'ह्म'],
  ['c', 'अ'],
  ['C', 'ऋ'],
  ['v', 'ख'],
  ['V', 'ॐ'],
  ['b', 'द'],
  ['B', 'ौ'],
  ['n', 'ल'],
  ['N', 'द्य'],
  ['m', 'ः'],
  ['M', 'ड्ड'],
  [',', 'ऽ'],
  ['<', 'ङ'],
  ['.', '।'],
  ['>', 'श्र'],
  ['/', 'र'],
  ['?', 'रु'],
]);

// Sequences a Preeti typist often types that are never right in Unicode, and what they mean.
// (k then m and e then m are how Preeti makes फ and झ; here they are Shift+K and Shift+H.)
const FIXES = [['अा', 'आ'], ['अो', 'ओ'], ['अौ', 'औ'], ['ाे', 'ो'], ['ाै', 'ौ'], ['एे', 'ऐ'], ['पः', 'फ'], ['भः', 'झ']];

export function traditionalToUnicode(raw) {
  let out = [...raw].map((ch) => (TRADITIONAL.has(ch) ? TRADITIONAL.get(ch) : ch)).join('');
  for (const [from, to] of FIXES) out = out.split(from).join(to);
  return out;
}

const COMBINING = /^[ऀ-ःऺ-ॏ॑-ॗॢॣ]/;
const showMark = (s) => (COMBINING.test(s) ? '◌' + s : s);

/** What an on-screen key shows. */
export function keyLabel(ch) {
  const v = TRADITIONAL.get(ch);
  if (v === undefined) return ch;
  if (v === '\u200D') return 'ZWJ';
  if (v === '\u200C') return 'ZWNJ';
  return showMark(v);
}

/** Editor state: the text, the cursor, and the raw keys of the word being typed. */
export function initState(text = '') {
  return { text, caret: text.length, raw: '', start: text.length };
}

const convert = (raw) => (raw ? traditionalToUnicode(raw) : '');

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

/** Type one key (a US-layout character). */
export function press(state, ch) {
  if (ch === ' ' || ch === '\n' || ch === '\t') return insertLiteral(commit(state), ch);
  const s = state.raw ? state : { ...state, start: state.caret };
  const before = convert(s.raw);
  const raw = s.raw + ch;
  const after = convert(raw);
  const text = s.text.slice(0, s.start) + after + s.text.slice(s.start + before.length);
  return { text, raw, start: s.start, caret: s.start + after.length };
}

/** Backspace: inside the word being typed, remove the last key; otherwise delete one character. */
export function backspace(state) {
  if (state.raw) {
    const before = convert(state.raw);
    const raw = state.raw.slice(0, -1);
    const after = convert(raw);
    const text = state.text.slice(0, state.start) + after + state.text.slice(state.start + before.length);
    return { text, raw, start: state.start, caret: state.start + after.length };
  }
  if (state.caret === 0) return state;
  const text = state.text.slice(0, state.caret - 1) + state.text.slice(state.caret);
  const caret = state.caret - 1;
  return { text, caret, raw: '', start: caret };
}
