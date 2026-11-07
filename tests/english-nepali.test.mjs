import { test } from 'node:test';
import assert from 'node:assert/strict';
import { englishToNepali, englishToNepaliTokens } from '../src/assets/js/lib/english-nepali.js';
import { romanizedToUnicode } from '../src/assets/js/lib/romanized.js';

test('common names in normal English spelling', () => {
  assert.equal(englishToNepali('Ram Bahadur Thapa'), 'राम बहादुर थापा');
  assert.equal(englishToNepali('Sita Kumari Shrestha'), 'सीता कुमारी श्रेष्ठ');
  assert.equal(englishToNepali('Manoj Kumar Thapa'), 'मनोज कुमार थापा');
  assert.equal(englishToNepali('Bishnu Prasad Adhikari'), 'विष्णु प्रसाद अधिकारी');
  assert.equal(englishToNepali('Hari Krishna Poudel'), 'हरि कृष्ण पौडेल');
});

test('capital letters do not change the result', () => {
  assert.equal(englishToNepali('SITA KUMARI SHRESTHA'), englishToNepali('sita kumari shrestha'));
  assert.equal(englishToNepali('tHaPa'), 'थापा');
});

test('spaces, punctuation, digits and the full stop', () => {
  assert.equal(englishToNepali('Ward 10, Lalitpur'), 'वडा १०, ललितपुर');
  assert.equal(englishToNepali('Mero naam Ram ho.'), 'मेरो नाम राम हो।');
  assert.equal(englishToNepali('Ward 10.', { digits: false, danda: false }), 'वडा 10.');
  assert.equal(englishToNepali('Sanjay {Facebook}'), 'सञ्जय Facebook');
});

test('names with two common spellings offer the other one', () => {
  const [bikash] = englishToNepaliTokens('Bikash').filter((t) => t.type === 'word');
  assert.deepEqual(bikash.options, ['विकास', 'बिकास']);
  assert.equal(bikash.guessed, false);
  assert.equal(englishToNepali('Bikash Thapa', {}, { bikash: 1 }), 'बिकास थापा');
});

test('unknown words are guessed, flagged and get alternatives', () => {
  const [w] = englishToNepaliTokens('Anusha').filter((t) => t.type === 'word');
  assert.equal(w.guessed, true);
  assert.ok(w.options.length >= 2 && w.options.length <= 5);
  assert.ok(w.options.includes('अनुषा'), w.options.join(' '));
  assert.equal(new Set(w.options).size, w.options.length);
});

test('Romanized mode is unchanged', () => {
  assert.equal(romanizedToUnicode('mero naam'), 'मेरो नाम');
  assert.equal(romanizedToUnicode('raam bahaadur thaapaa'), 'राम बहादुर थापा');
  assert.equal(romanizedToUnicode('Thapa'), 'ठप');
});
