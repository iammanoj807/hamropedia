import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initState, press, backspace, moveCaret, deleteRange, charForCode, charForKeyEvent, keyLabel, TRADITIONAL } from '../src/assets/js/lib/keyboard.js';

const typeAll = (keys, state = initState()) => [...keys].reduce((s, k) => press(s, k), state);

test('keyboard (Nepali Unicode Traditional): the official key map', () => {
  assert.equal(TRADITIONAL.size, 94); // every key of a US keyboard, normal and Shift
  assert.equal(TRADITIONAL.get('K'), 'फ');
  assert.equal(TRADITIONAL.get('H'), 'झ');
  assert.equal(TRADITIONAL.get('1'), '१');
  assert.equal(TRADITIONAL.get('!'), 'ज्ञ');
  assert.equal(TRADITIONAL.get('['), 'र्');
});

test('keyboard (Traditional): words, फ and झ, ि after the letter, reph before it', () => {
  assert.equal(typeAll('g]kfn').text, 'नेपाल');
  assert.equal(typeAll('xldfn').text, 'हिमाल');
  assert.equal(typeAll('KJ^J').text, 'फोटो');
  assert.equal(typeAll('H/gf').text, 'झरना');
  assert.equal(typeAll('u[g').text, 'गर्न');
  assert.equal(typeAll('I]q').text, 'क्षेत्र');
  assert.equal(typeAll('s\\n').text, 'क्ल');
  assert.equal(typeAll('2083').text, '२०८३');
});

test('keyboard (Traditional): Preeti habits still give the right letters', () => {
  assert.equal(typeAll('km').text, 'फ'); // Preeti k + m
  assert.equal(typeAll('em').text, 'झ'); // Preeti e + m
  assert.equal(typeAll('Kf]^f]').text, 'फोटो'); // ा then े = ो
  assert.equal(typeAll('cf').text, 'आ');
});

test('keyboard: backspace inside the current word removes the last key', () => {
  let s = typeAll('g]kfn');
  s = backspace(s);
  assert.equal(s.text, 'नेपा');
  s = typeAll('nL', s); // continue the same word
  assert.equal(s.text, 'नेपाली');
});

test('keyboard: backspace after a space deletes one character', () => {
  let s = typeAll('g]kfn ');
  s = backspace(s);
  assert.equal(s.text, 'नेपाल');
  assert.equal(s.caret, 'नेपाल'.length);
});

test('keyboard: moving the cursor finishes the word', () => {
  let s = typeAll('g]kfn');
  s = moveCaret(s, 0);
  s = press(s, 'x');
  assert.equal(s.text, 'हनेपाल');
  assert.equal(s.caret, 1);
});

test('keyboard: typing over a selection', () => {
  let s = typeAll('g]kfn xf]');
  s = deleteRange(s, 0, 'नेपाल'.length);
  s = typeAll('d', s);
  assert.equal(s.text, 'म हो');
});

test('keyboard: physical keys are read by position (UK keyboards)', () => {
  assert.equal(charForCode('Digit2', true), '@'); // the @ key (ई), even where Shift+2 prints "
  assert.equal(charForCode('Quote', false), "'");
  assert.equal(charForCode('KeyA', false), 'a');
  assert.equal(charForCode('IntlBackslash', false), '\\'); // UK key left of Z
  assert.equal(charForKeyEvent('IntlBackslash', '\\', false), '\\');
  assert.equal(charForCode('F5', false), null);
  assert.equal(charForKeyEvent('Digit2', '"', true), '@'); // UK keyboard, Shift+2
  assert.equal(charForKeyEvent('Backslash', '|', false), '|'); // shifted symbol even without a Shift flag
  assert.equal(charForKeyEvent('KeyA', 'A', false), 'A'); // Caps Lock
  assert.equal(charForKeyEvent('KeyA', 'a', false), 'a');
  assert.equal(keyLabel('K'), 'फ');
  assert.equal(keyLabel('f'), '◌ा');
  assert.equal(keyLabel('='), 'ZWJ');
});

