import {
  adToBs, bsToAd, daysInBsMonth, todayInNepal, formatBs, formatAd, toNepaliDigits,
  BS_MONTHS_NE, BS_MONTHS_EN, AD_MONTHS_EN, BS_MIN_YEAR, BS_MAX_YEAR, BS_PROVISIONAL_FROM,
} from './lib/bs-date.js';

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const provisional = (y) => (y >= BS_PROVISIONAL_FROM ? '<span class="warn">Provisional: the official calendar for this year is not final.</span>' : '');

// ---- today ----
function tick() {
  const now = new Date();
  const t = todayInNepal(now);
  const ad = bsToAd(t.year, t.month, t.day);
  $('dt-today-ne').textContent = formatBs(t);
  $('dt-today-en').textContent = `${formatBs(t, 'en')} · ${formatAd(ad)}`;
  const npt = new Date(now.getTime() + (5 * 60 + 45) * 60000);
  $('dt-time').textContent = `Nepal time ${pad(npt.getUTCHours())}:${pad(npt.getUTCMinutes())}:${pad(npt.getUTCSeconds())} (UTC+5:45)`;
}
tick();
setInterval(tick, 1000);
const today = todayInNepal();

// ---- AD -> BS ----
const adInput = $('ad-date');
function adToBsRun() {
  const out = $('ad2bs-out');
  if (!adInput.value) { out.innerHTML = 'Pick a date to convert.'; return; }
  const [y, m, d] = adInput.value.split('-').map(Number);
  try {
    const bs = adToBs(y, m, d);
    out.innerHTML = `<b>${formatBs(bs, 'en')}</b><span class="ne" lang="ne">${formatBs(bs)}</span> · ${bs.year}-${pad(bs.month)}-${pad(bs.day)} BS${provisional(bs.year)}`;
    showMonth(bs.year, bs.month, bs.day);
  } catch (e) {
    out.innerHTML = `<span class="warn">${e.message}</span>`;
  }
}
adInput.addEventListener('input', adToBsRun);

// ---- BS -> AD ----
const by = $('bs-y'); const bm = $('bs-m'); const bd = $('bs-d');
function fillDays(keep) {
  const n = daysInBsMonth(Number(by.value), Number(bm.value));
  bd.innerHTML = Array.from({ length: n }, (_, i) => `<option value="${i + 1}">${i + 1} (${toNepaliDigits(i + 1)})</option>`).join('');
  bd.value = String(Math.min(keep || 1, n));
}
function bsToAdRun() {
  const y = Number(by.value); const m = Number(bm.value); const d = Number(bd.value);
  const out = $('bs2ad-out');
  try {
    const ad = bsToAd(y, m, d);
    out.innerHTML = `<b>${formatAd(ad)}</b>${ad.year}-${pad(ad.month)}-${pad(ad.day)} AD${provisional(y)}`;
    showMonth(y, m, d);
  } catch (e) {
    out.innerHTML = `<span class="warn">${e.message}</span>`;
  }
}
[by, bm].forEach((s) => s.addEventListener('change', () => { fillDays(Number(bd.value)); bsToAdRun(); }));
bd.addEventListener('change', bsToAdRun);

// ---- month calendar ----
let view = { y: today.year, m: today.month, sel: null };
const DOW = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'];
function showMonth(y, m, sel = null) { view = { y, m, sel }; drawCalendar(); }
function drawCalendar() {
  const { y, m, sel } = view;
  const first = bsToAd(y, m, 1);
  const n = daysInBsMonth(y, m);
  const last = bsToAd(y, m, n);
  $('cal-title').textContent = `${BS_MONTHS_NE[m - 1]} ${toNepaliDigits(y)} · ${BS_MONTHS_EN[m - 1]} ${y}`;
  $('cal-prov').textContent = y >= BS_PROVISIONAL_FROM ? 'This year is provisional.' : `${AD_MONTHS_EN[first.month - 1]} ${first.year}${first.month !== last.month ? ` – ${AD_MONTHS_EN[last.month - 1]} ${last.year}` : ''}.`;
  let html = DOW.map((d) => `<div class="cal-dow" role="columnheader">${d}</div>`).join('');
  html += '<div class="cal-blank"></div>'.repeat(first.weekday);
  for (let d = 1; d <= n; d++) {
    const ad = bsToAd(y, m, d);
    const cls = ['cal-day'];
    if (ad.weekday === 6) cls.push('is-sat');
    if (y === today.year && m === today.month && d === today.day) cls.push('is-today');
    if (sel === d) cls.push('is-sel');
    html += `<button type="button" class="${cls.join(' ')}" data-d="${d}" aria-label="${formatBs({ year: y, month: m, day: d }, 'en')}, ${formatAd(ad)}"><b>${toNepaliDigits(d)}</b><span>${ad.day} ${AD_MONTHS_EN[ad.month - 1].slice(0, 3)}</span></button>`;
  }
  $('cal-grid').innerHTML = html;
  $('cal-prev').disabled = y === BS_MIN_YEAR && m === 1;
  $('cal-next').disabled = y === BS_MAX_YEAR && m === 12;
}
$('cal-grid').addEventListener('click', (e) => {
  const b = e.target.closest('.cal-day');
  if (!b) return;
  const d = Number(b.dataset.d);
  by.value = String(view.y); bm.value = String(view.m); fillDays(d); bd.value = String(d);
  bsToAdRun();
  const ad = bsToAd(view.y, view.m, d);
  adInput.value = `${ad.year}-${pad(ad.month)}-${pad(ad.day)}`;
  adToBsRun();
});
$('cal-prev').addEventListener('click', () => { let { y, m } = view; m--; if (m < 1) { m = 12; y--; } showMonth(y, m); });
$('cal-next').addEventListener('click', () => { let { y, m } = view; m++; if (m > 12) { m = 1; y++; } showMonth(y, m); });
$('cal-today').addEventListener('click', () => showMonth(today.year, today.month, today.day));

// ---- start on today ----
const todayAd = bsToAd(today.year, today.month, today.day);
adInput.value = `${todayAd.year}-${pad(todayAd.month)}-${pad(todayAd.day)}`;
by.value = String(today.year); bm.value = String(today.month); fillDays(today.day);
adToBsRun();
bsToAdRun();
showMonth(today.year, today.month, today.day);
