import { site, categories } from '../data/site.js';
import { esc, longDate, isoDate, abs } from '../lib/util.js';
import { layout } from '../templates/layout.js';
import { categoryChip, postCard, breadcrumbs, breadcrumbSchema, shareBar, pageHead } from '../templates/components.js';

const publisher = {
  '@type': 'Organization',
  name: site.name,
  url: site.url,
  logo: { '@type': 'ImageObject', url: `${site.url}/apple-touch-icon.png`, width: 180, height: 180 },
};

export function renderPost(post, all, version) {
  const crumbs = [
    { name: 'Home', path: '/' },
    post.type === 'news' ? { name: 'News', path: '/news/' } : { name: 'Blog', path: '/blog/' },
    { name: categories[post.category].name, path: `/category/${post.category}/` },
    { name: post.title, path: post.url },
  ];
  const related = all
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, score: (p.category === post.category ? 3 : 0) + (p.tags || []).filter((t) => (post.tags || []).includes(t)).length }))
    .sort((a, b) => b.score - a.score || (b.p.updated || b.p.date).localeCompare(a.p.updated || a.p.date))
    .slice(0, 3)
    .map((x) => x.p);

  const updated = post.updated && post.updated !== post.date;
  const toc =
    post.toc.length >= 3
      ? `<aside class="toc" aria-label="On this page"><details open><summary>On this page</summary><ol>${post.toc
          .map((t) => `<li class="toc-l${t.level}"><a href="#${t.id}">${t.text}</a></li>`)
          .join('')}</ol></details></aside>`
      : '';

  const body = `<article class="post">
  <header class="post-head wrap-narrow">
    ${breadcrumbs(crumbs)}
    <div class="post-tags">${categoryChip(post.category)}${post.type === 'news' ? '<span class="chip chip-live">News</span>' : ''}${updated ? '<span class="chip chip-soft">Updated</span>' : ''}</div>
    <h1>${esc(post.title)}</h1>
    <p class="lead">${esc(post.description)}</p>
    <div class="byline">
      <span class="avatar" aria-hidden="true">MT</span>
      <div>
        <p class="byline-name">By <a href="/about-us/">${esc(site.author.name)}</a></p>
        <p class="byline-meta"><time datetime="${isoDate(post.date)}">Published ${longDate(post.date)}</time>${updated ? ` · <time datetime="${isoDate(post.updated)}">Updated ${longDate(post.updated)}</time>` : ''} · ${post.readingMinutes} min read</p>
      </div>
    </div>
  </header>
  <figure class="post-cover wrap-mid">
    <img src="${post.coverCard}" alt="${esc(post.coverAlt || post.title)}" width="1200" height="630" fetchpriority="high" decoding="async">
  </figure>
  <div class="post-layout wrap-mid${toc ? '' : ' no-toc'}">
    ${toc}
    <div class="prose">
${post.html}
    </div>
  </div>
  <footer class="post-foot wrap-narrow">
    ${shareBar(abs(site.url, post.url), post.title)}
    <div class="author-box">
      <span class="avatar avatar-lg" aria-hidden="true">MT</span>
      <div>
        <p class="author-name">${esc(site.author.name)}</p>
        <p>${esc(site.author.role)} in ${esc(site.author.location)}, originally from Nepal. I write practical guides for Nepali students and learners, and I check every fact against an official or named source before it goes up. <a href="/contact-us/">Spotted a mistake? Tell me.</a></p>
      </div>
    </div>
  </footer>
</article>
<section class="related wrap" aria-labelledby="related-h">
  <h2 id="related-h">Keep reading</h2>
  <div class="grid grid-3">${related.map((p) => postCard(p)).join('')}</div>
</section>`;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': post.type === 'news' ? 'NewsArticle' : 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: [abs(site.url, post.ogImage)],
      datePublished: isoDate(post.date),
      dateModified: isoDate(post.updated || post.date),
      author: { '@type': 'Person', name: site.author.name, url: site.author.url },
      publisher,
      mainEntityOfPage: { '@type': 'WebPage', '@id': abs(site.url, post.url) },
      articleSection: categories[post.category].name,
      keywords: (post.tags || []).join(', '),
      inLanguage: 'en',
    },
    breadcrumbSchema(crumbs),
  ];

  return layout({
    title: `${post.seoTitle || post.title} | ${site.name}`,
    ogTitle: post.title,
    description: post.description,
    path: post.url,
    image: post.ogImage,
    type: 'article',
    schema,
    body,
    version,
    head: `<meta property="article:published_time" content="${isoDate(post.date)}">\n<meta property="article:modified_time" content="${isoDate(post.updated || post.date)}">\n<meta property="article:section" content="${esc(categories[post.category].name)}">`,
    section: post.type === 'news' ? '/news/' : '/blog/',
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
    lead: 'Study-abroad steps that match the official sites, coding and AI learning paths, and Nepal news explained with sources. Every article shows when it was last checked.',
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
    ${posts.map((p, i) => `<div class="grid-item" data-cat="${p.category}" data-search="${esc((p.title + ' ' + p.description + ' ' + (p.tags || []).join(' ')).toLowerCase())}">${postCard(p, { eager: i < 3 })}</div>`).join('\n')}
  </div>
  <p class="empty" id="no-results" hidden>No articles match that search yet. Try a shorter word, or <a href="/contact-us/">suggest a topic</a>.</p>
</section>`;
  return layout({
    title: `Blog: study abroad, coding, AI and Nepal guides | ${site.name}`,
    description: 'All Hamropedia articles: NOC and WES guides for Nepali students, UK student visa rules, coding and AI roadmaps, and sourced Nepal news explainers.',
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
      ? `<a class="banner" href="/ai-roadmap/"><strong>New: the free AI &amp; ML roadmap</strong><span>8 phases, 98 topics, 370+ hand-picked free resources, in order.</span></a>`
      : slug === 'nepal'
        ? `<a class="banner" href="/news/"><strong>All Nepal and AI news</strong><span>Sourced round-ups and explainers, newest first.</span></a>`
        : '';
  const body = `${pageHead({ crumbs, eyebrow: 'Topic', title: esc(c.name), lead: esc(c.description) })}
<section class="wrap">
  ${extra}
  <div class="grid grid-3">${posts.map((p, i) => postCard(p, { eager: i < 3 })).join('\n')}</div>
</section>`;
  return layout({
    title: `${c.name} articles | ${site.name}`,
    description: c.description,
    path: `/category/${slug}/`,
    body,
    version,
    section: slug === 'nepal' ? '/news/' : '/blog/',
    schema: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.name, url: `${site.url}/category/${slug}/`, description: c.description },
      breadcrumbSchema(crumbs),
    ],
  });
}

export function renderNews(posts, version) {
  const news = posts.filter((p) => p.type === 'news');
  const nepal = news.filter((p) => p.category === 'nepal');
  const ai = news.filter((p) => p.category === 'ai');
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'News', path: '/news/' }];
  const [lead, ...rest] = news;
  const body = `${pageHead({
    crumbs,
    eyebrow: 'News',
    title: 'Nepal &amp; AI news, explained',
    lead: 'No rumours, no copy-paste. Each story links to the reports it is based on, says what is confirmed and what is only proposed, and shows the date it was written.',
  })}
<section class="wrap news-lead">
  ${lead ? postCard(lead, { size: 'lg', eager: true }) : ''}
  <div class="news-side">
    <h2 class="side-h">Latest</h2>
    <ol class="headline-list">
      ${rest.slice(0, 5).map((p) => `<li><a href="${p.url}">${esc(p.title)}</a><span>${categories[p.category].name} · ${longDate(p.updated || p.date)}</span></li>`).join('')}
    </ol>
    <p class="side-note">Follow along: <a href="/rss.xml">RSS feed</a></p>
  </div>
</section>
<section class="wrap section">
  <div class="section-head"><h2>Nepal</h2><a href="/category/nepal/">All Nepal news</a></div>
  <div class="grid grid-3">${nepal.map((p) => postCard(p)).join('')}</div>
</section>
<section class="wrap section">
  <div class="section-head"><h2>AI &amp; technology</h2><a href="/category/ai/">All AI articles</a></div>
  <div class="grid grid-3">${ai.map((p) => postCard(p)).join('')}</div>
</section>`;
  return layout({
    title: `Nepal news and AI news, explained with sources | ${site.name}`,
    description: 'Sourced explainers on Nepal: the 2026 election and Balen Shah government, the national AI policy, weather and economy round-ups. Every claim linked to its report.',
    path: '/news/',
    body,
    version,
    section: '/news/',
    schema: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Nepal & AI news', url: `${site.url}/news/` },
      breadcrumbSchema(crumbs),
    ],
  });
}
