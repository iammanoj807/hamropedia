import { todayInNepal, formatBs, formatAd } from './lib/bs-date.js';

const root = document.documentElement;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } },
};

// ---- light / dark mode (blue theme only) ----
const themeBtn = document.getElementById('theme-btn');
function syncTheme() {
  const dark = root.dataset.theme === 'dark';
  themeBtn?.setAttribute('aria-pressed', String(dark));
  themeBtn?.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}
themeBtn?.addEventListener('click', () => {
  if (root.dataset.theme === 'dark') { delete root.dataset.theme; store.set('hp-theme', null); }
  else { root.dataset.theme = 'dark'; store.set('hp-theme', 'dark'); }
  syncTheme();
});
syncTheme();

// ---- cookie settings ----
// Consent is asked by Google's certified consent message, which the AdSense tag
// shows to visitors in the UK, EEA and Switzerland (set up in AdSense > Privacy &
// messaging). "Cookie settings" reopens that message. Where it doesn't apply (other
// regions, ad blockers, Nepali pages without ads), it opens the privacy policy.
store.set('hp-consent', null); // choice saved by the old home-made banner, no longer used
function openPrivacySettings() {
  const fc = window.googlefc;
  const fallback = () => { location.href = '/privacy-policy/#cookies'; };
  if (typeof fc?.showRevocationMessage !== 'function' || typeof window.__tcfapi !== 'function') return fallback();
  window.__tcfapi('ping', 2, (ping) => (ping?.gdprApplies ? fc.showRevocationMessage() : fallback()));
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-privacy-settings]')) openPrivacySettings();
});

// ---- mobile menu ----
const menuBtn = document.getElementById('menu-btn');
const nav = document.getElementById('main-nav');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
}

// ---- reading progress (articles only) ----
const bar = document.querySelector('.progress span');
const article = document.querySelector('.prose');
if (bar && article && document.querySelector('.post')) {
  const onScroll = () => {
    const r = article.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const done = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
    bar.style.width = `${done * 100}%`;
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---- table of contents highlight ----
const tocLinks = [...document.querySelectorAll('.toc a')];
if (tocLinks.length && 'IntersectionObserver' in window) {
  const map = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        tocLinks.forEach((a) => a.classList.remove('active'));
        map.get(en.target.id)?.classList.add('active');
      }
    }
  }, { rootMargin: '-80px 0px -70% 0px' });
  map.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
}

// ---- copy buttons ----
async function copyText(text, btn, done = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  const label = btn.querySelector('span') || btn;
  const before = label.textContent;
  label.textContent = done;
  setTimeout(() => { label.textContent = before; }, 1600);
}
document.addEventListener('click', (e) => {
  const code = e.target.closest('.copy-code');
  if (code) copyText(code.parentElement.querySelector('code').innerText, code);
  const link = e.target.closest('.copy-link');
  if (link) copyText(link.dataset.url, link, 'Link copied');
});
export { copyText, store };

// ---- today's date in Nepal, in the footer, in the page's language ----
// Nepali pages: the Nepali (BS) date in Nepali. English pages: the English (AD)
// date, then the same day in the Nepali calendar, written in English.
const np = document.querySelector('[data-np-today]');
if (np) {
  try {
    const t = todayInNepal();
    if (document.documentElement.lang === 'ne') {
      np.textContent = formatBs(t);
      np.lang = 'ne';
    } else {
      const npt = new Date(Date.now() + (5 * 60 + 45) * 60000); // Nepal time
      const ad = { year: npt.getUTCFullYear(), month: npt.getUTCMonth() + 1, day: npt.getUTCDate(), weekday: npt.getUTCDay() };
      np.textContent = `${formatAd(ad)} · ${formatBs({ ...t, weekday: undefined }, 'en')}`; // the weekday once, not twice
      np.lang = 'en';
    }
  } catch { /* outside supported range */ }
}

// ---- blog search & filter ----
const grid = document.getElementById('post-grid');
if (grid) {
  const items = [...grid.querySelectorAll('.grid-item')];
  const input = document.getElementById('post-search');
  const pills = [...document.querySelectorAll('.pill')];
  const empty = document.getElementById('no-results');
  let cat = 'all';
  const apply = () => {
    const q = (input.value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const it of items) {
      const okCat = cat === 'all' || it.dataset.cat === cat;
      const okQ = q.every((w) => it.dataset.search.includes(w));
      it.hidden = !(okCat && okQ);
      if (!it.hidden) shown++;
    }
    empty.hidden = shown > 0;
  };
  pills.forEach((p) => p.addEventListener('click', () => {
    cat = p.dataset.filter;
    pills.forEach((x) => x.setAttribute('aria-pressed', String(x === p)));
    apply();
  }));
  input.addEventListener('input', apply);
  const q = new URLSearchParams(location.search).get('q');
  if (q) { input.value = q; apply(); }
  if (location.hash === '#search') input.focus({ preventScroll: true });
}
