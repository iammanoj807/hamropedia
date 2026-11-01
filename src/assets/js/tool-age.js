import { ageOn, nextBirthday } from './lib/age.js';
import {
  bsToAd, adToBs, daysInBsMonth, formatBs, formatAd, BS_MONTHS_EN, WEEKDAYS_EN,
} from './lib/bs-date.js';

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
const parse = (v) => {
  const [year, month, day] = String(v).split('-').map(Number);
  return { year, month, day };
};
const num = (n) => n.toLocaleString('en');
const plural = (n, w) => `${num(n)} ${w}${n === 1 ? '' : 's'}`;

// The visitor's own local date, not UTC: a birthday is a local thing.
const now = new Date();
const today = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };

let cal = 'ad';
const dob = $('age-dob');
const on = $('age-on');
const by = $('age-bs-y'); const bm = $('age-bs-m'); const bd = $('age-bs-d');

on.value = iso(today);
dob.max = iso(today);
dob.value = '2000-01-01';
by.value = '2057'; bm.value = '1';

function fillBsDays() {
  const keep = Number(bd.value) || 1;
  const n = daysInBsMonth(Number(by.value), Number(bm.value));
  bd.innerHTML = Array.from({ length: n }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
  bd.value = String(Math.min(keep, n));
}

function birthDate() {
  if (cal === 'bs') return bsToAd(Number(by.value), Number(bm.value), Number(bd.value));
  return parse(dob.value);
}

function bsText(ad) {
  try { return adToBs(ad.year, ad.month, ad.day); } catch { return null; }
}

/** Next birthday by the Nepali calendar: same BS month and day, which moves in AD every year. */
function nextBsBirthday(birthBs, onDate) {
  const onBs = adToBs(onDate.year, onDate.month, onDate.day);
  for (const y of [onBs.year, onBs.year + 1]) {
    const day = Math.min(birthBs.day, daysInBsMonth(y, birthBs.month));
    const ad = bsToAd(y, birthBs.month, day);
    const diff = Math.round((Date.UTC(ad.year, ad.month - 1, ad.day) - Date.UTC(onDate.year, onDate.month - 1, onDate.day)) / 86400000);
    if (diff >= 0) return { bs: { year: y, month: birthBs.month, day }, ad, diff, turning: y - birthBs.year };
  }
  return null;
}

function run() {
  const out = (id, html) => { $(id).innerHTML = html; };
  try {
    if (cal === 'ad' && !dob.value) throw new RangeError('Enter your date of birth');
    const birth = birthDate();
    const at = parse(on.value || iso(today));
    const a = ageOn(birth, at);
    out('age-y', num(a.years)); out('age-m', num(a.months)); out('age-d', num(a.days));
    out('age-total-months', num(a.totalMonths)); out('age-total-weeks', num(a.totalWeeks)); out('age-total-days', num(a.totalDays));
    const bBs = bsText(birth);
    out('age-born', `<b>Born on a ${WEEKDAYS_EN[a.weekdayBorn]}</b>, ${formatAd(birth)}${bBs ? ` · ${bBs.day} ${BS_MONTHS_EN[bBs.month - 1]} ${bBs.year} BS` : ''}`);
    const nb = nextBirthday(birth, at);
    out('age-next', nb.isToday
      ? `<b>Happy birthday! 🎉</b> You turn ${num(nb.turning)} on this day.`
      : `<b>Next birthday:</b> ${formatAd(nb)}, in ${plural(nb.daysUntil, 'day')} (turning ${num(nb.turning)})`);
    out('age-bs-born', bBs ? `<b>Nepali date of birth:</b> <span lang="ne">${formatBs({ ...bBs, weekday: undefined })}</span>` : '');
    const nbs = bBs ? (() => { try { return nextBsBirthday(bBs, at); } catch { return null; } })() : null;
    out('age-bs-next', nbs
      ? `<b>Next Nepali (BS) birthday:</b> ${nbs.bs.day} ${BS_MONTHS_EN[nbs.bs.month - 1]} ${nbs.bs.year} = ${formatAd(nbs.ad)}${nbs.diff === 0 ? ', today' : `, in ${plural(nbs.diff, 'day')}`}`
      : '');
    $('age-result').classList.remove('is-error');
  } catch (e) {
    ['age-y', 'age-m', 'age-d', 'age-total-months', 'age-total-weeks', 'age-total-days'].forEach((id) => out(id, '–'));
    out('age-born', `<span class="warn">${e.message}</span>`);
    ['age-next', 'age-bs-born', 'age-bs-next'].forEach((id) => out(id, ''));
    $('age-result').classList.add('is-error');
  }
}

document.querySelectorAll('[data-cal]').forEach((b) => b.addEventListener('click', () => {
  cal = b.dataset.cal;
  document.querySelectorAll('[data-cal]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  document.querySelector('.age-ad').hidden = cal !== 'ad';
  document.querySelector('.age-bs').hidden = cal !== 'bs';
  if (cal === 'bs') {
    const bs = bsText(parse(dob.value || '2000-01-01'));
    if (bs) { by.value = String(bs.year); bm.value = String(bs.month); fillBsDays(); bd.value = String(bs.day); }
  } else {
    try { dob.value = iso(bsToAd(Number(by.value), Number(bm.value), Number(bd.value))); } catch { /* keep */ }
  }
  run();
}));
[dob, on, bd].forEach((el) => el.addEventListener('input', run));
[by, bm].forEach((el) => el.addEventListener('change', () => { fillBsDays(); run(); }));
fillBsDays();
run();
