import { site } from '../data/site.js';
import { esc, longDate } from '../lib/util.js';
import { layout, ICONS } from '../templates/layout.js';
import { postCard, categoryChip } from '../templates/components.js';
import { phases, totals } from './roadmap.js';
import { TOOLS } from './tools.js';

export function renderHome(posts, version) {
  const news = posts.filter((p) => p.type === 'news');
  const guides = posts.filter((p) => p.type !== 'news');
  const [topNews, ...moreNews] = news;
  const studyAbroad = guides.filter((p) => p.category === 'study-abroad').slice(0, 3);
  const learning = guides.filter((p) => p.category === 'ai' || p.category === 'coding').slice(0, 3);

  const body = `<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Explore and enjoy · your daily discovery hub</p>
      <h1>Nepali tools, a free AI roadmap and guides you can <em>trust</em>.</h1>
      <p class="lead">Type Nepali with an English keyboard or the Preeti layout, convert Nepali dates, read the news in English or Nepali, learn AI from zero for free, and get study-abroad steps that match the official sites. All in one place, made by a Nepali engineer.</p>
      <div class="hero-cta">
        <a class="btn btn-lg" href="/tools/english-to-nepali/">Start typing Nepali</a>
        <a class="btn-ghost btn-lg" href="/ai-roadmap/">Explore the AI roadmap</a>
      </div>
    </div>
    <div class="hero-panel">
      <div class="today-mini" aria-live="polite">
        <span class="today-label">आज · Today in Nepal</span>
        <b lang="ne" data-np-today-ne>&nbsp;</b>
        <span data-np-today-en>&nbsp;</span>
        <a href="/tools/nepali-date-converter/">Open the Nepali calendar →</a>
      </div>
      <div class="quick-type">
        <label for="qt-in">Try it: type Nepali in English letters</label>
        <input id="qt-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" value="mero desh nepal ho">
        <p class="qt-out" lang="ne" id="qt-out" aria-live="polite">मेरो देश नेपाल हो</p>
        <a href="/tools/english-to-nepali/">Full typing tool, with copy &amp; cheat sheet →</a>
      </div>
    </div>
  </div>
</section>

<section class="wrap section">
  <div class="section-head"><h2>Free tools</h2><a href="/tools/">All tools</a></div>
  <div class="tool-cards tool-cards-compact">
    ${TOOLS.map(
      (t) => `<a class="tool-card" href="/tools/${t.slug}/">
      <h3>${esc(t.name)}</h3>
      <p>${esc(t.blurb)}</p>
      <span class="tool-demo"><code>${esc(t.sample[0])}</code><span aria-hidden="true">→</span><b lang="ne">${esc(t.sample[1])}</b></span>
    </a>`,
    ).join('')}
  </div>
</section>

<section class="wrap section">
  <div class="section-head"><h2>Nepal &amp; AI news, explained</h2><a href="/news/">All news</a></div>
  <div class="news-lead">
    ${topNews ? postCard(topNews, { size: 'lg' }) : ''}
    <div class="news-side">
      <ol class="headline-list">
        ${moreNews.slice(0, 4).map((p) => `<li>${categoryChip(p.category, false)}<a href="${p.url}">${esc(p.title)}</a><span>${longDate(p.updated || p.date)}</span></li>`).join('')}
      </ol>
    </div>
  </div>
</section>

<section class="roadmap-band">
  <div class="wrap band-grid">
    <div>
      <p class="eyebrow">Free · no sign-up</p>
      <h2>Learn AI &amp; machine learning from zero</h2>
      <p>${totals.phases} phases, ${totals.topics} topics and ${totals.resources} hand-picked free resources: the best videos, interactive explainers, books and courses for each topic, in the order that makes sense. Tick topics off as you go; your progress stays on your device.</p>
      <a class="btn btn-lg" href="/ai-roadmap/">Open the roadmap ${ICONS.arrow}</a>
    </div>
    <ol class="band-phases">
      ${phases.map((p) => `<li style="--ph:${p.accent}"><a href="/ai-roadmap/${p.slug}/"><span>${p.number}</span>${esc(p.title)}</a></li>`).join('')}
    </ol>
  </div>
</section>

<section class="wrap section">
  <div class="section-head"><h2>Study abroad guides</h2><a href="/category/study-abroad/">All guides</a></div>
  <div class="grid grid-3">${studyAbroad.map((p) => postCard(p)).join('')}</div>
</section>

<section class="wrap section">
  <div class="section-head"><h2>Learn to code &amp; build with AI</h2><a href="/blog/">All articles</a></div>
  <div class="grid grid-3">${learning.map((p) => postCard(p)).join('')}</div>
</section>

<section class="wrap section promise">
  <div>
    <h2>The Hamropedia promise</h2>
    <p>Every fact is checked against an official or named source and linked. Every article shows when it was last updated. If something changes or I get it wrong, I fix it and say so.</p>
  </div>
  <ul>
    <li><b>Sourced</b><span>Links to gov.uk, WES, ministries and named reports</span></li>
    <li><b>Dated</b><span>Published and updated dates on every page</span></li>
    <li><b>Private</b><span>No trackers, no ads, tools run on your device</span></li>
  </ul>
</section>`;

  return layout({
    title: `${site.name}: English to Nepali typing, Nepali date converter, AI roadmap & guides`,
    ogTitle: `${site.name}: Nepali tools, a free AI roadmap and honest guides`,
    description: site.description,
    path: '/',
    body,
    version,
    scripts: ['/assets/js/home.js'],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name,
        url: `${site.url}/`,
        description: site.description,
        inLanguage: 'en',
        publisher: { '@type': 'Organization', name: site.name, url: site.url, logo: `${site.url}/apple-touch-icon.png`, sameAs: Object.values(site.social) },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: site.name,
        url: site.url,
        logo: `${site.url}/apple-touch-icon.png`,
        email: site.email,
        founder: { '@type': 'Person', name: site.author.name },
        foundingDate: String(site.established),
        sameAs: Object.values(site.social),
      },
    ],
  });
}
