import { site, nav, navNe, categories } from '../data/site.js';
import { esc, jsonLd, abs } from '../lib/util.js';

export const ICONS = {
  logo: `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="var(--accent)"/><path d="M5 30 L15 14 L20 21 L25 12 L35 30 Z" fill="#fff"/><path d="M22.6 16 L25 12 L27.5 16.2 L25.6 15 L24.2 16.6 Z" fill="var(--accent)" opacity=".45"/></svg>`,
  search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.9 8.6H3.8V20h3.1V8.6ZM5.3 3.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM20.2 13.4c0-3.1-1.7-4.9-4.1-4.9-1.6 0-2.6.9-3 1.6V8.6H10V20h3.1v-5.9c0-1.6.6-2.8 2.1-2.8s2 1.2 2 2.9V20h3.1v-6.6Z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.6 2.6 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.5 9.5 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  rss: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="18.5" r="2" fill="currentColor"/><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};

// Runs before first paint, so the chosen theme never flashes.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem('hp-theme'),a=localStorage.getItem('hp-accent'),d=document.documentElement;if(t==='dark'||t==='auto')d.dataset.theme=t;if(a&&a!=='blue')d.dataset.accent=a;}catch(e){}})();`;

/**
 * @param {object} p
 * @param {string} p.title         full <title>
 * @param {string} p.description
 * @param {string} p.path          canonical path, e.g. "/blog/"
 * @param {string} p.body          page HTML (inside <main>)
 * @param {string} [p.image]       absolute or root path to the social image
 * @param {string} [p.type]        og:type
 * @param {object[]} [p.schema]    JSON-LD objects
 * @param {string[]} [p.scripts]   extra module scripts
 * @param {string} [p.head]        extra head HTML
 * @param {boolean} [p.noindex]
 * @param {string} [p.section]     nav href to mark active
 * @param {string} [p.lang]        'en' (default) or 'ne'
 * @param {{lang:string, path:string}[]} [p.alternates]  language versions, for hreflang
 */
export function layout(p) {
  const url = abs(site.url, p.path);
  const image = abs(site.url, p.image || '/images/og-default.jpg');
  const schemas = (p.schema || []).map(jsonLd).join('\n');
  const scripts = ['/assets/js/site.js', ...(p.scripts || [])]
    .map((s) => `<script type="module" src="${s}"></script>`)
    .join('\n');
  const verify = site.googleSiteVerification
    ? `<meta name="google-site-verification" content="${esc(site.googleSiteVerification)}">`
    : '';

  const lang = p.lang || 'en';
  const hreflang = (p.alternates || []).length
    ? [...p.alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${abs(site.url, a.path)}">`),
       `<link rel="alternate" hreflang="x-default" href="${abs(site.url, (p.alternates.find((a) => a.lang === 'en') || p.alternates[0]).path)}">`].join('\n')
    : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
${p.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta property="og:site_name" content="${site.name}">
<meta property="og:type" content="${p.type || 'website'}">
<meta property="og:title" content="${esc(p.ogTitle || p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${lang === 'ne' ? 'ne_NP' : site.locale}">
${hreflang}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.ogTitle || p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${image}">
<meta name="theme-color" content="#ffffff">
<meta name="color-scheme" content="light">
${verify}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${site.name}" href="/rss.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Mukta:wght@400;500;700&display=swap">
<link rel="stylesheet" href="/assets/css/site.css?v=${p.version}">
<script>${THEME_BOOT}</script>
${p.head || ''}
${schemas}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"><span></span></div>
${header(p.section, lang)}
<main id="main">
${p.body}
</main>
${footer()}
${scripts}
</body>
</html>`;
}

function header(section, lang) {
  const links = (lang === 'ne' ? navNe : nav)
    .map((n) => `<a href="${n.href}"${section === n.href ? ' aria-current="page"' : ''}${n.lang ? ` lang="${n.lang}"` : ''}>${n.label}</a>`)
    .join('');
  return `<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="/" aria-label="${site.name} home">${ICONS.logo}<span>Hamro<b>pedia</b></span></a>
    <nav class="main-nav" id="main-nav" aria-label="Main">${links}</nav>
    <div class="header-actions">
      <a class="icon-btn" href="/blog/#search" aria-label="Search articles">${ICONS.search}</a>
      <div class="theme-picker">
        <button class="icon-btn" type="button" id="theme-btn" aria-haspopup="true" aria-expanded="false" aria-controls="theme-menu" aria-label="Theme and colour">${ICONS.sun}</button>
        <div class="theme-menu" id="theme-menu" hidden>
          <p class="menu-label">Theme</p>
          <div class="seg" role="radiogroup" aria-label="Theme">
            <button type="button" role="radio" data-theme-choice="light">Light</button>
            <button type="button" role="radio" data-theme-choice="dark">Dark</button>
            <button type="button" role="radio" data-theme-choice="auto">Auto</button>
          </div>
          <p class="menu-label">Colour</p>
          <div class="swatches" role="radiogroup" aria-label="Accent colour">
            <button type="button" role="radio" data-accent-choice="blue" style="--sw:#2453c4" aria-label="Himalayan blue (default)"></button>
            <button type="button" role="radio" data-accent-choice="crimson" style="--sw:#c8102e" aria-label="Crimson"></button>
            <button type="button" role="radio" data-accent-choice="green" style="--sw:#13795b" aria-label="Rhododendron green"></button>
            <button type="button" role="radio" data-accent-choice="violet" style="--sw:#6d3fd6" aria-label="Violet"></button>
            <button type="button" role="radio" data-accent-choice="amber" style="--sw:#b45309" aria-label="Marigold"></button>
          </div>
        </div>
      </div>
      <button class="icon-btn menu-btn" type="button" id="menu-btn" aria-controls="main-nav" aria-expanded="false" aria-label="Open menu">${ICONS.menu}</button>
    </div>
  </div>
</header>`;
}

function footer() {
  const year = new Date().getUTCFullYear();
  const cats = Object.entries(categories)
    .map(([slug, c]) => `<li><a href="/category/${slug}/">${c.name}</a></li>`)
    .join('');
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-about">
      <a class="brand" href="/">${ICONS.logo}<span>Hamro<b>pedia</b></span></a>
      <p>${esc(site.tagline)}. Written in ${esc(site.author.location)} by ${esc(site.author.name)}, for curious people in Nepal and Nepalis everywhere.</p>
      <div class="social">
        <a href="${site.social.github}" target="_blank" rel="noopener" aria-label="GitHub">${ICONS.github}</a>
        <a href="${site.social.portfolio}" target="_blank" rel="noopener" aria-label="Portfolio">${ICONS.globe}</a>
        <a href="${site.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${ICONS.facebook}</a>
        <a href="${site.social.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICONS.linkedin}</a>
        <a href="${site.social.youtube}" target="_blank" rel="noopener" aria-label="YouTube">${ICONS.youtube}</a>
        <a href="/rss.xml" aria-label="RSS feed">${ICONS.rss}</a>
      </div>
    </div>
    <div>
      <h2 class="footer-h">Free tools</h2>
      <ul>
        <li><a href="/tools/english-to-nepali/">English to Nepali typing</a></li>
        <li><a href="/tools/nepali-keyboard/">Nepali keyboard</a></li>
        <li><a href="/tools/nepali-date-converter/">Nepali date converter</a></li>
        <li><a href="/tools/age-calculator/">Age calculator</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-h">Read</h2>
      <ul>${cats}<li><a href="/ai-roadmap/">AI &amp; ML roadmap</a></li><li><a href="/ne/" lang="ne">समाचार</a></li><li><a href="/news/">News in English</a></li></ul>
    </div>
    <div>
      <h2 class="footer-h">Hamropedia</h2>
      <ul>
        <li><a href="/about-us/">About</a></li>
        <li><a href="/contact-us/">Contact</a></li>
        <li><a href="/privacy-policy/">Privacy policy</a></li>
        <li><a href="/terms-of-use-hamropedia/">Terms of use</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap footer-base">
    <p>© ${site.established}–${year} ${site.name}.</p>
    <p class="np-date" data-np-today></p>
  </div>
</footer>`;
}
