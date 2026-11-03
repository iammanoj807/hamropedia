import { site, categories } from '../data/site.js';
import { esc, longDate, isoDate, abs } from '../lib/util.js';
import { layout } from '../templates/layout.js';
import {
  categoryChip, postCard, breadcrumbs, breadcrumbSchema, shareBar, supportNote, pageHead, cover, displayDate,
} from '../templates/components.js';
import { toNepaliDigits } from '../assets/js/lib/bs-date.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public');

// Google recommends 16:9, 4:3 and 1:1 images for articles; make-covers.mjs creates them.
function articleImages(og) {
  const variants = ['16x9', '4x3', '1x1']
    .map((r) => og.replace(/\.jpg$/, `-${r}.jpg`))
    .filter((p) => fs.existsSync(path.join(PUBLIC_DIR, p)));
  return [...variants, og].map((p) => abs(site.url, p));
}

const publisher = {
  '@type': 'Organization',
  name: site.name,
  url: site.url,
  logo: { '@type': 'ImageObject', url: `${site.url}/icon-512.png`, width: 512, height: 512 },
};

const T = {
  en: {
    home: 'Home', news: 'News', blog: 'Blog', by: 'By', published: 'Published', updated: 'Updated', min: (n) => `${n} min read`,
    onPage: 'On this page', keep: 'Keep reading', newsChip: 'News', updatedChip: 'Updated',
    switchTo: 'नेपालीमा पढ्नुहोस्', switchLang: 'ne',
    authorName: site.author.name,
  },
  ne: {
    home: 'गृहपृष्ठ', news: 'समाचार', blog: 'ब्लग', by: 'लेखक:', published: 'प्रकाशित', updated: 'अपडेट', min: (n) => `${toNepaliDigits(n)} मिनेट पढाइ`,
    onPage: 'यस पृष्ठमा', keep: 'अरू समाचार', newsChip: 'समाचार', updatedChip: 'अपडेट गरिएको',
    switchTo: 'Read in English', switchLang: 'en',
    authorName: 'मनोज कुमार थापा',
  },
};

export function renderPost(post, all, version, translation) {
  const lang = post.lang || 'en';
  const t = T[lang];
  const ne = lang === 'ne';
  const crumbs = ne
    ? [{ name: t.home, path: '/' }, { name: t.news, path: '/ne/' }, { name: post.title, path: post.url }]
    : [
        { name: t.home, path: '/' },
        post.type === 'news' ? { name: t.news, path: '/news/' } : { name: t.blog, path: '/blog/' },
        { name: categories[post.category].name, path: `/category/${post.category}/` },
        { name: post.title, path: post.url },
      ];
  const related = all
    .filter((p) => p.slug !== post.slug && (p.lang || 'en') === lang)
    .map((p) => ({ p, score: (p.category === post.category ? 3 : 0) + (p.type === post.type ? 1 : 0) + (p.tags || []).filter((x) => (post.tags || []).includes(x)).length }))
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date))
    .slice(0, 3)
    .map((x) => x.p);

  const updated = post.updated && post.updated !== post.date;
  const toc =
    post.toc.length >= 3
      ? `<aside class="toc" aria-label="${t.onPage}"><details open><summary>${t.onPage}</summary><ol>${post.toc
          .map((x) => `<li class="toc-l${x.level}"><a href="#${x.id}">${x.text}</a></li>`)
          .join('')}</ol></details></aside>`
      : '';
  const switcher = translation
    ? `<a class="lang-switch" href="${translation.url}" hreflang="${t.switchLang}" lang="${t.switchLang}">${t.switchTo}</a>`
    : '';
  const dateLine = ne
    ? `<time datetime="${isoDate(post.date)}">${t.published}: ${displayDate(post.date, 'ne')}</time>${updated ? ` · <time datetime="${isoDate(post.updated)}">${t.updated}: ${displayDate(post.updated, 'ne')}</time>` : ''} · ${t.min(post.readingMinutes)}`
    : `<time datetime="${isoDate(post.date)}">${t.published} ${longDate(post.date)}</time>${updated ? ` · <time datetime="${isoDate(post.updated)}">${t.updated} ${longDate(post.updated)}</time>` : ''} · ${t.min(post.readingMinutes)}`;

  const body = `<article class="post">
  <header class="post-head wrap-narrow">
    ${breadcrumbs(crumbs)}
    <div class="post-tags">${categoryChip(post.category, !ne, lang)}${post.type === 'news' ? `<span class="chip chip-live">${t.newsChip}</span>` : ''}${updated ? `<span class="chip chip-soft">${t.updatedChip}</span>` : ''}${switcher}</div>
    <h1>${esc(post.title)}</h1>
    <p class="lead">${esc(post.description)}</p>
    <div class="byline">
      <div>
        <p class="byline-name">${t.by} <a href="/about-us/">${esc(t.authorName)}</a></p>
        <p class="byline-meta">${dateLine}</p>
      </div>
    </div>
  </header>
  <figure class="post-cover wrap-mid" role="img" aria-label="${esc(post.coverAlt || post.title)}">${cover(post)}</figure>
  <div class="post-layout wrap-mid${toc ? '' : ' no-toc'}">
    ${toc}
    <div class="prose">
${post.html}
    </div>
  </div>
  <footer class="post-foot wrap-narrow">
    ${shareBar(abs(site.url, post.url), post.title, lang)}
    ${supportNote(lang)}
  </footer>
</article>
<section class="related wrap" aria-labelledby="related-h">
  <h2 id="related-h">${t.keep}</h2>
  <div class="grid grid-3">${related.map((p) => postCard(p)).join('')}</div>
</section>`;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': post.type === 'news' ? 'NewsArticle' : 'BlogPosting',
      headline: post.title,
      name: post.seoTitle || post.title,
      description: post.description,
      image: articleImages(post.ogImage),
      datePublished: isoDate(post.date),
      dateModified: isoDate(post.updated || post.date),
      author: { '@type': 'Person', name: site.author.name, url: site.author.url, jobTitle: site.author.role, sameAs: Object.values(site.social) },
      publisher,
      mainEntityOfPage: { '@type': 'WebPage', '@id': abs(site.url, post.url) },
      articleSection: categories[post.category].name,
      keywords: (post.tags || []).join(', '),
      inLanguage: lang,
    },
    breadcrumbSchema(crumbs),
  ];

  return layout({
    title: `${post.seoTitle || post.title} | ${site.name}`,
    ogTitle: post.title,
    description: post.description,
    path: post.url,
    image: post.ogImage,
    imageAlt: post.coverAlt || post.title,
    type: 'article',
    schema,
    body,
    version,
    lang,
    alternates: translation ? [{ lang, path: post.url }, { lang: translation.lang || 'en', path: translation.url }] : [],
    head: `<meta property="article:published_time" content="${isoDate(post.date)}">\n<meta property="article:modified_time" content="${isoDate(post.updated || post.date)}">\n<meta property="article:section" content="${esc(categories[post.category].name)}">`,
    section: ne ? '/ne/' : post.type === 'news' ? '/news/' : ['coding', 'ai'].includes(post.category) ? '/learn/' : '/blog/',
  });
}

export function renderBlogIndex(posts, version) {
  const pills = [
    `<button type="button" class="pill" data-filter="all" aria-pressed="true">All <span>${posts.length}</span></button>`,
    ...Object.entries(categories).map(([slug, c]) => {
      const n = posts.filter((p) => p.category === slug).length;
      return n ? `<button type="button" class="pill" data-filter="${slug}" aria-pressed="false">${esc(c.name)} <span>${n}</span></button>` : '';
    }),
  ].join('');
  const body = `${pageHead({
    crumbs: [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog/' }],
    eyebrow: 'The blog',
    title: 'Guides, roadmaps and explainers',
    lead: 'Study-abroad steps that match the official sites, coding and AI guides, and Nepal news explained with sources. Every article shows when it was published and last checked. For full courses, see <a href="/learn/">Learn &amp; Build</a>.',
  })}
<section class="wrap blog-tools" id="search">
  <label class="search-box"><span class="sr-only">Search articles</span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <input type="search" id="post-search" placeholder="Search: NOC, WES, UK visa, AI, Nepal…" autocomplete="off">
  </label>
  <div class="pills" role="group" aria-label="Filter by topic">${pills}</div>
</section>
<section class="wrap">
  <div class="grid grid-3" id="post-grid">
    ${posts.map((p) => `<div class="grid-item" data-cat="${p.category}" data-search="${esc((p.title + ' ' + p.description + ' ' + (p.tags || []).join(' ')).toLowerCase())}">${postCard(p)}</div>`).join('\n')}
  </div>
  <p class="empty" id="no-results" hidden>No articles match that search yet. Try a shorter word, or <a href="/contact-us/">suggest a topic</a>.</p>
</section>`;
  return layout({
    title: `Blog: study abroad, coding, AI and Nepal guides | ${site.name}`,
    description: 'All Hamropedia articles: NOC and WES guides, UK student visa rules, coding and AI guides, and news explainers with sources.',
    path: '/blog/',
    body,
    version,
    section: '/blog/',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: `${site.name} Blog`,
        url: `${site.url}/blog/`,
        blogPost: posts.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: abs(site.url, p.url), datePublished: isoDate(p.date) })),
      },
      breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog/' }]),
    ],
  });
}

export function renderCategory(slug, posts, version) {
  const c = categories[slug];
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog/' }, { name: c.name, path: `/category/${slug}/` }];
  const extra =
    slug === 'ai'
      ? `<a class="banner" href="/ai-roadmap/"><strong>The free AI &amp; ML roadmap</strong><span>8 phases and 98 lessons, each with an animation, a diagram and exercises with answers.</span></a>`
      : slug === 'coding'
        ? `<a class="banner" href="/learn/#start-here"><strong>Free courses: System Design, SQL and DSA</strong><span>Full lessons with diagrams, a SQL runner in your browser, and the NeetCode 150 with reviews.</span></a>`
      : slug === 'nepal'
        ? `<a class="banner" href="/ne/" lang="ne"><strong>नेपाली समाचार</strong><span>यी समाचार नेपाली भाषामा पढ्नुहोस्।</span></a>`
        : '';
  const body = `${pageHead({ crumbs, eyebrow: 'Topic', title: esc(c.name), lead: esc(c.description) })}
<section class="wrap">
  ${extra}
  <div class="grid grid-3">${posts.map((p) => postCard(p)).join('\n')}</div>
</section>`;
  return layout({
    title: `${c.name} articles | ${site.name}`,
    description: c.description,
    path: `/category/${slug}/`,
    body,
    version,
    section: ['coding', 'ai'].includes(slug) ? '/learn/' : '/blog/',
    schema: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.name, url: `${site.url}/category/${slug}/`, description: c.description },
      breadcrumbSchema(crumbs),
    ],
  });
}

function newsSection(title, list, moreHref, moreLabel) {
  if (!list.length) return '';
  return `<section class="wrap section">
  <div class="section-head"><h2>${title}</h2>${moreHref ? `<a href="${moreHref}">${moreLabel}</a>` : ''}</div>
  <div class="grid grid-3">${list.map((p) => postCard(p)).join('')}</div>
</section>`;
}

function newsLead(news, lang) {
  const [lead, ...rest] = news;
  const ne = lang === 'ne';
  return `<section class="wrap news-lead">
  ${lead ? postCard(lead, { size: 'lg' }) : ''}
  <div class="news-side">
    <h2 class="side-h">${ne ? 'ताजा समाचार' : 'Latest'}</h2>
    <ol class="headline-list">
      ${rest.slice(0, 6).map((p) => `<li>${categoryChip(p.category, false, lang)}<a href="${p.url}">${esc(p.title)}</a><span>${displayDate(p.date, lang)}</span></li>`).join('')}
    </ol>
    <p class="side-note">${ne ? '<a class="lang-switch" href="/news/" lang="en" hreflang="en">Read in English</a>' : '<a class="lang-switch" href="/ne/" lang="ne" hreflang="ne">नेपालीमा पढ्नुहोस्</a>'}</p>
  </div>
</section>`;
}

export function renderNews(posts, version) {
  const news = posts.filter((p) => p.type === 'news');
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'News', path: '/news/' }];
  const body = `${pageHead({
    crumbs,
    eyebrow: 'News',
    title: 'Nepal, AI &amp; study-abroad news, explained',
    lead: 'The latest news, explained simply. <a class="lang-switch" href="/ne/" lang="ne" hreflang="ne">नेपालीमा पढ्नुहोस्</a>',
  })}
${newsLead(news, 'en')}
${newsSection('Nepal', news.filter((p) => p.category === 'nepal'), '/category/nepal/', 'All Nepal articles')}
${newsSection('AI &amp; technology', news.filter((p) => p.category === 'ai'), '/category/ai/', 'All AI articles')}
${newsSection('Study abroad &amp; visas', news.filter((p) => p.category === 'study-abroad'), '/category/study-abroad/', 'All study-abroad guides')}`;
  return layout({
    title: `Nepal news, AI news and UK visa updates, explained with sources | ${site.name}`,
    description: 'News explained simply: the EDV 2027 (DV lottery) update, PM Balen Shah and Nepal\'s 2026 election, the UK Graduate visa change and Nepal\'s AI policy. Also in Nepali.',
    path: '/news/',
    body,
    version,
    section: '/news/',
    alternates: [{ lang: 'en', path: '/news/' }, { lang: 'ne', path: '/ne/' }],
    schema: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'News', url: `${site.url}/news/` },
      breadcrumbSchema(crumbs),
    ],
  });
}

export function renderNeHub(nePosts, version) {
  const crumbs = [{ name: 'गृहपृष्ठ', path: '/' }, { name: 'समाचार', path: '/ne/' }];
  const body = `${pageHead({
    crumbs,
    eyebrow: 'समाचार',
    title: 'नेपाली समाचार',
    lead: 'नेपाल, एआई र विदेश अध्ययनसम्बन्धी प्रमुख समाचार, सरल नेपालीमा। <a class="lang-switch" href="/news/" lang="en" hreflang="en">Read in English</a>',
  })}
${newsLead(nePosts, 'ne')}
${newsSection('नेपाल', nePosts.filter((p) => p.category === 'nepal'), null)}
${newsSection('एआई र प्रविधि', nePosts.filter((p) => p.category === 'ai'), null)}
${newsSection('विदेश अध्ययन र भिसा', nePosts.filter((p) => p.category === 'study-abroad'), null)}`;
  return layout({
    title: `नेपाली समाचार: नेपाल, एआई र विदेश अध्ययन | ${site.name}`,
    ogTitle: 'Hamropedia नेपाली समाचार',
    description: 'नेपाल, कृत्रिम बुद्धिमत्ता (एआई) र विदेश अध्ययनसम्बन्धी प्रमुख समाचार सरल नेपाली भाषामा, मूल स्रोतको लिंकसहित।',
    path: '/ne/',
    body,
    version,
    lang: 'ne',
    section: '/ne/',
    alternates: [{ lang: 'ne', path: '/ne/' }, { lang: 'en', path: '/news/' }],
    schema: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'नेपाली समाचार', url: `${site.url}/ne/`, inLanguage: 'ne' },
      breadcrumbSchema(crumbs),
    ],
  });
}
