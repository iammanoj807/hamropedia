import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { layout, ICONS } from '../templates/layout.js';
import { postCard, categoryChip, displayDate } from '../templates/components.js';
import { roadmapBand } from './learn.js';

export function renderHome(posts, version) {
  const news = posts.filter((p) => p.type === 'news');
  const guides = posts.filter((p) => p.type !== 'news');
  const [topNews, ...moreNews] = news;
  const studyAbroad = guides.filter((p) => p.category === 'study-abroad').slice(0, 3);
  const learning = guides.filter((p) => p.category === 'ai' || p.category === 'coding').slice(0, 3);
  const popularSlugs = [
    'ilr-changes-uk-5-year-vs-10-year-route-earned-settlement',
    'edv-2027-nepal-dv-lottery-open-date',
    'uk-graduate-visa-two-years-high-compliance-universities',
    'how-to-apply-noc-online-easy-steps-for-nepali-students',
    'how-to-apply-for-wes-evaluation-in-2025-a-complete-step-by-step-guide',
  ];
  const popular = popularSlugs.map((s) => posts.find((p) => p.slug === s)).filter(Boolean);

  const body = `<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Hamropedia · <span lang="ne">हाम्रोपेडिया</span></p>
      <h1>News, study-abroad guides and learning, <em>explained simply</em>.</h1>
      <p class="lead">Clear, sourced guides for studying abroad, the news that matters, and free courses in AI, system design, SQL and DSA, written in plain language for everyone.</p>
      <div class="hero-cta">
        <a class="btn btn-lg" href="/news/">Read the latest news</a>
        <a class="btn-ghost btn-lg" href="/blog/">Explore the guides</a>
      </div>
    </div>
    <div class="hero-panel">
      <div class="today-mini" aria-live="polite">
        <span class="today-label">आज · Today in Nepal</span>
        <b lang="ne" data-np-today-ne>&nbsp;</b>
        <span data-np-today-en>&nbsp;</span>
      </div>
      <div class="popular">
        <h2 class="popular-h">Popular right now</h2>
        <ol>
          ${popular.map((p) => `<li><a href="${p.url}">${esc(p.title)}</a></li>`).join('')}
        </ol>
      </div>
    </div>
  </div>
</section>

<section class="wrap section">
  <div class="section-head"><h2>Latest news</h2><a href="/news/">All news</a></div>
  <div class="news-lead">
    ${topNews ? postCard(topNews, { size: 'lg' }) : ''}
    <div class="news-side">
      <ol class="headline-list">
        ${moreNews.slice(0, 4).map((p) => `<li>${categoryChip(p.category, false)}<a href="${p.url}">${esc(p.title)}</a><span>${displayDate(p.date)}</span></li>`).join('')}
      </ol>
      <p class="side-note"><a class="lang-switch" href="/ne/" lang="ne" hreflang="ne">नेपालीमा पढ्नुहोस्</a></p>
    </div>
  </div>
</section>

<section class="wrap section">
  <div class="section-head"><h2>Study abroad guides</h2><a href="/category/study-abroad/">All guides</a></div>
  <div class="grid grid-3">${studyAbroad.map((p) => postCard(p)).join('')}</div>
</section>

<section class="wrap section">
  <div class="section-head"><h2>Learn to code</h2><a href="/blog/">All articles</a></div>
  <div class="grid grid-3">${learning.map((p) => postCard(p)).join('')}</div>
</section>

${roadmapBand()}

<section class="wrap section promise">
  <div>
    <h2>The Hamropedia promise</h2>
    <p>Every fact is checked against an official or named source and linked. Every article shows when it was published and last updated. If something changes or I get it wrong, I fix it and say so.</p>
  </div>
  <ul>
    <li><b>Sourced</b><span>Links to gov.uk, WES, ministries and named reports</span></li>
    <li><b>Dated</b><span>Published and updated dates on every page</span></li>
    <li><b>Clear</b><span>Plain language, with the news also in Nepali</span></li>
  </ul>
</section>`;

  return layout({
    title: `${site.name}: news, study-abroad guides and learning`,
    ogTitle: `${site.name}: news, study-abroad guides and learning, explained simply`,
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
        alternateName: ['हाम्रोपेडिया', 'Hamropedia.com'],
        url: `${site.url}/`,
        description: site.description,
        inLanguage: 'en',
        publisher: { '@type': 'Organization', name: site.name, url: site.url, logo: `${site.url}/icon-512.png`, sameAs: Object.values(site.social) },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: site.name,
        url: site.url,
        logo: `${site.url}/icon-512.png`,
        email: site.email,
        founder: { '@type': 'Person', name: site.author.name },
        foundingDate: String(site.established),
        sameAs: Object.values(site.social),
      },
    ],
  });
}
