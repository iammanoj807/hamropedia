import fs from 'node:fs';
import { site } from '../data/site.js';
import { esc, slugify } from '../lib/util.js';
import { layout } from '../templates/layout.js';
import { breadcrumbs, breadcrumbSchema, faqBlock, faqSchema, shareBar } from '../templates/components.js';

// Phase colours: a cool blue / teal / violet family that sits well with the blue site theme.
const PHASE_COLOURS = ['#64748b', '#2563eb', '#0891b2', '#4f46e5', '#0d9488', '#7c3aed', '#0284c7', '#6366f1'];
export const phases = JSON.parse(fs.readFileSync(new URL('../data/roadmap.json', import.meta.url), 'utf8'))
  .map((p, i) => ({ ...p, accent: PHASE_COLOURS[i % PHASE_COLOURS.length] }));

const KIND = {
  watch: ['Watch', 'k-watch'],
  play: ['Interactive', 'k-play'],
  read: ['Read', 'k-read'],
  code: ['Code', 'k-code'],
  paper: ['Paper', 'k-paper'],
};
const KIND_ORDER = ['watch', 'play', 'read', 'code', 'paper'];

const resourceCount = (p) => p.main.length + p.deeper.length + p.topics.reduce((a, t) => a + t.resources.length, 0);
export const totals = {
  phases: phases.length,
  topics: phases.reduce((a, p) => a + p.topics.length, 0),
  resources: phases.reduce((a, p) => a + resourceCount(p), 0),
};

const phasePath = (p) => `/ai-roadmap/${p.slug}/`;

function link(r, label) {
  return r.url
    ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${label}</a>`
    : `<span>${label}</span>`;
}

function backbone(list, heading, id) {
  if (!list.length) return '';
  return `<section class="rm-backbone" aria-labelledby="${id}">
  <h2 id="${id}">${heading}</h2>
  <ul class="res-list res-list-wide">
    ${list
      .map(
        (r) => `<li class="res">
      <span class="kind k-book">${esc(r.kind)}</span>
      <div><p class="res-title">${link(r, esc(r.title))}${r.paid ? ' <span class="tag-paid">Paid</span>' : r.free ? ' <span class="tag-free">Free</span>' : ''}</p>
      <p class="res-why">${esc(r.why)}</p></div>
    </li>`,
      )
      .join('')}
  </ul>
</section>`;
}

const RULES = [
  'Go in order. Each phase assumes the ones before it.',
  'Pick one resource per topic, not five. Where one is marked <b>Worth it</b>, start there.',
  'Build as you learn: re-type the code, then rebuild it without looking. Getting stuck is the learning.',
  'Every two weeks, test yourself on old topics. Untick anything you can no longer explain without notes.',
  'Papers are optional. Come back to them once the foundations feel solid.',
];

const ROADMAP_FAQ = [
  { q: 'Is this AI and machine learning roadmap really free?', a: 'Yes. Almost every resource is free: university courses (Stanford, MIT, Harvard), 3Blue1Brown, Andrej Karpathy, official documentation and open books. The few paid books are marked <b>Paid</b>, and each has a free alternative in the same phase.' },
  { q: 'How long does it take to finish?', a: 'There are no deadlines on purpose. It is a long road: at around 10 hours a week, plan in months per phase, not days. Going in order, and actually building things, matters far more than going fast.' },
  { q: 'Do I need a strong maths background?', a: 'No. Phase 1 starts from vectors and derivatives, with visual explanations first. School-level algebra is enough to begin.' },
  { q: 'Do I need a powerful computer or a GPU?', a: 'Not for phases 0 to 3. A normal laptop runs NumPy and small PyTorch models. For later phases you can use free cloud notebooks such as Google Colab or Kaggle.' },
  { q: 'Is this a good path to an AI engineer job?', a: 'Phase 5 (AI engineering: retrieval, evaluation, agents and deployment) is the core of most AI engineer roles today, and the earlier phases are what let you debug those systems rather than just call an API.' },
  { q: 'How do I track my progress?', a: 'Tick topics as you finish them. Your ticks are saved in your own browser only (nothing is sent anywhere), so use the same device and browser to keep them.' },
];

export function renderRoadmapIndex(version) {
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Learn & Build', path: '/learn/' }, { name: 'AI & ML Roadmap', path: '/ai-roadmap/' }];
  const cards = phases
    .map(
      (p) => `<li class="phase-card" style="--ph:${p.accent}">
    <a href="${phasePath(p)}">
      <span class="phase-num">Phase ${p.number}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.goal)}</p>
      <span class="phase-stats">${p.topics.length} topics · ${resourceCount(p)} resources</span>
      <span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span>
    </a>
  </li>`,
    )
    .join('');

  const body = `<section class="page-head rm-hero">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">Free roadmap · updated ${new Date().getUTCFullYear()}</p>
    <h1>The AI &amp; Machine Learning Roadmap</h1>
    <p class="lead">From your first NumPy array to building and shipping LLM apps: ${totals.phases} phases and ${totals.topics} topics, in order, with ${totals.resources} hand-picked free resources. No sign-up, no paywall.</p>
    <div class="rm-stats">
      <div><b>${totals.phases}</b><span>phases</span></div>
      <div><b>${totals.topics}</b><span>topics</span></div>
      <div><b>${totals.resources}</b><span>resources</span></div>
      <div><b data-rm-done>0</b><span>topics you've done</span></div>
    </div>
  </div>
</section>
<section class="wrap rm-layout">
  <div>
    <h2 class="sr-only">Phases</h2>
    <ol class="phase-grid">${cards}</ol>
  </div>
  <aside class="rm-rules">
    <h2>How to use it</h2>
    <ol>${RULES.map((r) => `<li>${r}</li>`).join('')}</ol>
    <p class="muted">Resource types: ${KIND_ORDER.map((k) => `<span class="kind ${KIND[k][1]}">${KIND[k][0]}</span>`).join(' ')}</p>
    <a class="btn" href="${phasePath(phases[0])}">Start with Phase 0</a>
    <a class="text-link" href="/how-to-learn-ai-and-machine-learning-for-free/">Read the guide to this roadmap →</a>
  </aside>
</section>
<section class="wrap-narrow">${faqBlock(ROADMAP_FAQ)}</section>`;

  return layout({
    title: `Free AI & Machine Learning Roadmap (${new Date().getUTCFullYear()}): ${totals.resources}+ resources | ${site.name}`,
    ogTitle: 'The free AI & Machine Learning Roadmap',
    description: `A free, step-by-step AI and machine learning roadmap: ${totals.phases} phases, ${totals.topics} topics and ${totals.resources} hand-picked free resources, from maths and NumPy to transformers, LLMs and AI engineering.`,
    path: '/ai-roadmap/',
    image: '/images/og/ai-roadmap.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/roadmap.js'],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'AI & Machine Learning Roadmap',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: phases.length,
        itemListElement: phases.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `Phase ${p.number}: ${p.title}`, url: `${site.url}${phasePath(p)}` })),
      },
      faqSchema(ROADMAP_FAQ),
      breadcrumbSchema(crumbs),
    ],
  });
}

export function renderPhase(p, i, version) {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Learn & Build', path: '/learn/' },
    { name: 'AI & ML Roadmap', path: '/ai-roadmap/' },
    { name: `Phase ${p.number}: ${p.title}`, path: phasePath(p) },
  ];
  const prev = phases[i - 1];
  const next = phases[i + 1];

  const topics = p.topics
    .map((t, ti) => {
      const id = `${p.slug}--${slugify(t.name)}`;
      const sorted = [...t.resources].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
      return `<li class="topic" id="${slugify(t.name)}">
    <div class="topic-head">
      <label class="tick"><input type="checkbox" data-topic="${id}" data-phase="${p.slug}"><span class="sr-only">Mark "${esc(t.name)}" as done</span></label>
      <h3><span class="topic-n">${p.number}.${ti + 1}</span> ${esc(t.name)}</h3>
    </div>
    <ul class="res-list">
      ${sorted
        .map(
          (r) => `<li class="res${r.recommended ? ' res-pick' : ''}">
        <span class="kind ${KIND[r.kind]?.[1] || ''}">${KIND[r.kind]?.[0] || esc(r.kind)}</span>
        <div>
          <p class="res-title">${link(r, esc(r.title))}</p>
          <p class="res-src">${esc(r.source)}${r.kind === 'paper' ? ' · optional' : ''}</p>
          ${r.recommended ? `<p class="res-why"><b>Worth it:</b> ${esc(r.recommended)}</p>` : ''}
        </div>
      </li>`,
        )
        .join('')}
    </ul>
  </li>`;
    })
    .join('');

  const body = `<section class="page-head phase-head" style="--ph:${p.accent}">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">Phase ${p.number} of ${phases.length - 1} · ${p.topics.length} topics</p>
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.goal)}</p>
    <p class="phase-big">${esc(p.bigPicture)}</p>
    <div class="phase-bar"><span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span><span class="phase-count" data-phase-count="${p.slug}">0 of ${p.topics.length} done</span></div>
  </div>
</section>
<div class="wrap phase-layout">
  <nav class="phase-nav" aria-label="Roadmap phases">
    <ol>${phases.map((q) => `<li><a href="${phasePath(q)}"${q.slug === p.slug ? ' aria-current="page"' : ''}><span>${q.number}</span>${esc(q.short)}</a></li>`).join('')}</ol>
  </nav>
  <div class="phase-main">
    ${backbone(p.main, 'Core resources for this phase', 'core-h')}
    <section aria-labelledby="topics-h">
      <h2 id="topics-h">Topics, in order</h2>
      <ol class="topic-list">${topics}</ol>
    </section>
    ${backbone(p.deeper, 'Go deeper (optional)', 'deeper-h')}
    <nav class="pager" aria-label="Previous and next phase">
      ${prev ? `<a class="pager-prev" href="${phasePath(prev)}"><span>← Phase ${prev.number}</span>${esc(prev.title)}</a>` : '<span></span>'}
      ${next ? `<a class="pager-next" href="${phasePath(next)}"><span>Phase ${next.number} →</span>${esc(next.title)}</a>` : `<a class="pager-next" href="/ai-roadmap/"><span>Done →</span>Back to the roadmap</a>`}
    </nav>
    ${shareBar(`${site.url}${phasePath(p)}`, `AI roadmap, phase ${p.number}: ${p.title}`)}
  </div>
</div>`;

  const kinds = new Set(p.topics.flatMap((t) => t.resources.map((r) => r.kind)));
  return layout({
    title: `Phase ${p.number}: ${p.title}, free resources | ${site.name}`,
    ogTitle: `AI roadmap, phase ${p.number}: ${p.title}`,
    description: `${p.goal} ${p.topics.length} topics with ${resourceCount(p)} free resources${kinds.has('play') ? ', including interactive explainers' : ''}.`.slice(0, 300),
    path: phasePath(p),
    image: '/images/og/ai-roadmap.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/roadmap.js'],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Phase ${p.number}: ${p.title}`,
        numberOfItems: p.topics.length,
        itemListElement: p.topics.map((t, ti) => ({ '@type': 'ListItem', position: ti + 1, name: t.name, url: `${site.url}${phasePath(p)}#${slugify(t.name)}` })),
      },
      breadcrumbSchema(crumbs),
    ],
  });
}
