import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initState, press, backspace, moveCaret, deleteRange, charForCode, charForKeyEvent, LAYOUTS } from '../src/assets/js/lib/keyboard.js';
import { ageOn, nextBirthday, daysInMonth } from '../src/assets/js/lib/age.js';
import { bsToAd } from '../src/assets/js/lib/bs-date.js';

const typeAll = (keys, layout, state = initState()) => [...keys].reduce((s, k) => press(s, k, layout), state);

test('keyboard (Preeti layout): basic words and spaces', () => {
  assert.equal(typeAll('g]kfn', 'preeti').text, 'नेपाल');
  assert.equal(typeAll('xfd|f] b]z g]kfn xf] .', 'preeti').text, 'हाम्रो देश नेपाल हो ।');
});

test('keyboard (Preeti layout): ि typed before its letter, reph, k+m, half letter + f', () => {
  assert.equal(typeAll('lxdfn', 'preeti').text, 'हिमाल');
  assert.equal(typeAll('ug{', 'preeti').text, 'गर्न');
  assert.equal(typeAll('ug{]', 'preeti').text, 'गर्ने');
  assert.equal(typeAll('km', 'preeti').text, 'फ');
  assert.equal(typeAll('Sf', 'preeti').text, 'क');
  assert.equal(typeAll('If]q', 'preeti').text, 'क्षेत्र');
});

test('keyboard: backspace inside the current word removes the last key', () => {
  let s = typeAll('g]kfn', 'preeti');
  s = backspace(s, 'preeti');
  assert.equal(s.text, 'नेपा');
  s = typeAll('nL', 'preeti', s); // continue the same word
  assert.equal(s.text, 'नेपाली');
});

test('keyboard: backspace after a space deletes one character', () => {
  let s = typeAll('g]kfn ', 'preeti');
  s = backspace(s, 'preeti');
  assert.equal(s.text, 'नेपाल');
  assert.equal(s.caret, 'नेपाल'.length);
});

test('keyboard: moving the cursor finishes the word', () => {
  let s = typeAll('g]kfn', 'preeti');
  s = moveCaret(s, 0);
  s = press(s, 'x', 'preeti');
  assert.equal(s.text, 'हनेपाल');
  assert.equal(s.caret, 1);
});

test('keyboard: typing over a selection', () => {
  let s = typeAll('g]kfn xf]', 'preeti');
  s = deleteRange(s, 0, 'नेपाल'.length);
  s = typeAll('d', 'preeti', s);
  assert.equal(s.text, 'म हो');
});

test('keyboard (Romanized layout)', () => {
  assert.equal(typeAll('namaste', 'romanized').text, 'नमस्ते');
  assert.equal(typeAll('mero naam Hari ho.', 'romanized').text, 'मेरो नाम हरि हो।');
  let s = typeAll('naam', 'romanized');
  s = backspace(s, 'romanized');
  assert.equal(s.text, 'ना');
});

test('keyboard: physical keys are read by position (UK keyboards)', () => {
  assert.equal(charForCode('Digit2', true), '@'); // Preeti २, even where Shift+2 prints "
  assert.equal(charForCode('Quote', false), "'");
  assert.equal(charForCode('KeyA', false), 'a');
  assert.equal(charForCode('IntlBackslash', false), '\\'); // UK key left of Z
  assert.equal(charForKeyEvent('IntlBackslash', '\\', false), '\\');
  assert.equal(charForCode('F5', false), null);
  assert.equal(charForKeyEvent('Digit2', '"', true), '@'); // UK keyboard, Shift+2
  assert.equal(charForKeyEvent('Backslash', '|', false), '|'); // shifted symbol even without a Shift flag
  assert.equal(charForKeyEvent('KeyA', 'A', false), 'A'); // Caps Lock
  assert.equal(charForKeyEvent('KeyA', 'a', false), 'a');
  assert.equal(LAYOUTS.preeti.label('@'), '२');
  assert.equal(LAYOUTS.preeti.label('f'), '◌ा');
  assert.equal(LAYOUTS.romanized.label('k'), 'क');
});

const d = (s) => { const [year, month, day] = s.split('-').map(Number); return { year, month, day }; };

test('age: whole months, then days', () => {
  assert.deepEqual(
    (({ years, months, days }) => ({ years, months, days }))(ageOn(d('2000-05-20'), d('2026-11-01'))),
    { years: 26, months: 5, days: 12 },
  );
  const a = ageOn(d('2026-01-31'), d('2026-03-01')); // 31st clamps to 28 Feb
  assert.deepEqual([a.years, a.months, a.days], [0, 1, 1]);
  assert.equal(ageOn(d('2026-01-31'), d('2026-03-01')).totalDays, 29);
});

test('age: 29 February birthdays', () => {
  const a = ageOn(d('2024-02-29'), d('2025-02-28'));
  assert.deepEqual([a.years, a.months, a.days], [1, 0, 0]);
  const n = nextBirthday(d('2024-02-29'), d('2025-03-01'));
  assert.deepEqual([n.year, n.month, n.day, n.turning], [2026, 2, 28, 2]);
  const leap = nextBirthday(d('2024-02-29'), d('2027-03-01'));
  assert.deepEqual([leap.year, leap.month, leap.day], [2028, 2, 29]);
});

test('age: birthday today, and invalid input', () => {
  const n = nextBirthday(d('1990-11-01'), d('2026-11-01'));
  assert.equal(n.isToday, true);
  assert.equal(n.turning, 36);
  assert.throws(() => ageOn(d('2027-01-01'), d('2026-11-01')), RangeError);
  assert.throws(() => ageOn(d('2026-02-30'), d('2026-11-01')), RangeError);
  assert.equal(daysInMonth(2028, 2), 29);
});

test('age: from a BS date of birth', () => {
  const ad = bsToAd(2081, 1, 1); // 13 April 2024
  const a = ageOn(ad, d('2026-11-01'));
  assert.deepEqual([a.years, a.months, a.days], [2, 6, 19]);
});
