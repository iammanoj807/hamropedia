import { todayInNepal, formatBs } from './lib/bs-date.js';

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

// ---- cookie consent (asked once; change any time from "Cookie settings") ----
// Stored as { value: 'granted' | 'denied', date }. Ad code added later should
// check window.hamropediaConsent() === 'granted' before loading personalised ads.
const consentBox = document.getElementById('consent');
function readConsent() {
  try { return JSON.parse(store.get('hp-consent') || 'null'); } catch { return null; }
}
window.hamropediaConsent = () => readConsent()?.value || null;
function showConsent(show) { if (consentBox) consentBox.hidden = !show; }
if (!readConsent()) showConsent(true);
document.addEventListener('click', (e) => {
  const choice = e.target.closest('[data-consent]');
  if (choice) {
    store.set('hp-consent', JSON.stringify({ value: choice.dataset.consent, date: new Date().toISOString().slice(0, 10) }));
    showConsent(false);
    window.dispatchEvent(new CustomEvent('hamropedia:consent', { detail: choice.dataset.consent }));
  }
  if (e.target.closest('[data-open-consent]')) showConsent(true);
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

// ---- today's Nepali date in the footer ----
const np = document.querySelector('[data-np-today]');
if (np) {
  try {
    const t = todayInNepal();
    np.textContent = `${formatBs(t)} · ${formatBs(t, 'en')}`;
    np.lang = 'ne';
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
