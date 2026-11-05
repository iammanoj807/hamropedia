// System Design: the course page, one page per phase, one lesson per topic,
// and a revision page with every lesson's interview notes laid out flat.
// Content comes from src/data/courses/sd.json (npm run sync-courses).
import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { createGlossary, paragraphs, plain } from '../lib/glossary.js';
import { layout } from '../templates/layout.js';
import { breadcrumbs, breadcrumbSchema, faqBlock, faqSchema, shareBar } from '../templates/components.js';
import { readCourse, progressBackup, courseByline, newest } from './course-parts.js';
import { renderLesson, list, animationBox, diagramBox, questions, topicCode } from './lesson.js';

const PHASE_COLOURS = ['#64748b', '#2563eb', '#0891b2', '#4f46e5', '#0d9488', '#7c3aed', '#0284c7', '#6366f1', '#0f766e', '#9333ea'];
const course = readCourse('sd');
const animations = readCourse('sd-animations');
export const sdPhases = course.phases.map((p, i) => ({ ...p, accent: PHASE_COLOURS[i % PHASE_COLOURS.length] }));

const BASE = '/system-design/';
export const CHECKS_ATTR = `data-course="sd" data-checks="${course.checks.map((c) => c.key).join(',')}"`;
const allTopics = sdPhases.flatMap((phase) => phase.topics.map((topic) => ({ phase, topic })));
export const sdTotals = {
  phases: sdPhases.length,
  topics: allTopics.length,
  designs: allTopics.filter((x) => x.topic.kind === 'design').length,
  must: allTopics.filter((x) => x.topic.priority === 'must').length,
  exercises: allTopics.length * course.checks.length,
};
const DESIGN_TYPE = { hld: 'High-level design', lld: 'Low-level design', ml: 'AI/ML design' };
const DESIGN_SHORT = { hld: 'HLD', lld: 'LLD', ml: 'AI/ML' };

/** Every piece of prose in a topic, in reading order (atomic-hub's System Design topicProse). */
const proseOf = (t) => {
  const tail = [...t.mistakes, t.interviewAnswer, ...t.followUps.flatMap((f) => [f.q, f.a]), ...course.checks.map((c) => t.practice[c.key])];
  if (t.kind === 'concept') {
    return [t.definition, t.problem, t.idea, ...t.howItWorks, t.analogy, t.breaks, t.example, ...t.keyPoints, ...(t.tradeOffs ?? []), ...tail];
  }
  return [
    t.definition, t.problem, ...t.functional, ...t.nonFunctional, ...(t.estimates ?? []), ...(t.dataModel ?? []), ...(t.classes ?? []),
    ...(t.patterns ?? []), ...t.evolution, ...t.design, ...t.deepDives, ...tail,
  ];
};
const glossary = createGlossary(course.glossary, allTopics.map((x) => x.topic), proseOf);

const phasePath = (p) => `${BASE}${p.slug}/`;
const lessonPath = (p, t) => `${BASE}${p.slug}/${t.slug}/`;
const CRUMBS = [{ name: 'Home', path: '/' }, { name: 'Learn & Build', path: '/learn/' }, { name: 'System Design', path: BASE }];

/** "Must know", "HLD" and so on, as small tags. */
const tags = (t) =>
  `<p class="topic-tags"><span class="pri pri-${t.priority}">${esc(course.priorityLabels[t.priority])}</span>${t.kind === 'design' ? `<span class="dtype" title="${DESIGN_TYPE[t.designType]}">${DESIGN_SHORT[t.designType]}</span>` : ''}</p>`;

/** atomic-hub's study order, with its page names changed to this site's. */
export const howToStudy = course.howToStudy.map((s) =>
  s
    .replace('the ML Foundations AI-engineering topics', `the <a href="/ai-roadmap/ai-engineering/">AI engineering phase of the AI &amp; ML roadmap</a>`)
    .replace('Use Revise mode with "Must know only".', `Use the <a href="${BASE}revise/">revision notes</a> with "Must know only".`),
);

// ---------------------------------------------------------------------------
// Lessons

function concept(t, mark, phase, wordsBox) {
  return `<p class="lesson-lead-q"><b>The problem it solves.</b> ${mark(t.problem)}</p>
${wordsBox}
${animationBox(lessonCtx, t, phase.accent)}
${diagramBox(t, mark)}
<h3>The idea</h3>
${paragraphs(t.idea, mark)}
<h3>How it works, step by step</h3>
${list(t.howItWorks, mark, 'ol')}
<h3>Analogy</h3>
<blockquote class="callout">${paragraphs(t.analogy, mark)}</blockquote>
<h3>Where the analogy breaks</h3>
${paragraphs(t.breaks, mark)}
<h3>Example</h3>
${paragraphs(t.example, mark)}
<h3>Must-know points</h3>
${list(t.keyPoints, mark)}
<h3>Common mistakes</h3>
${list(t.mistakes, mark, 'ul', 'mistakes')}
${t.tradeOffs?.length ? `<h3>Trade-offs</h3>\n${list(t.tradeOffs, mark)}` : ''}
${topicCode(t)}`;
}

function design(t, mark, phase, wordsBox) {
  const block = (title, items, opts = {}) => (items?.length ? `<h3>${title}</h3>\n${opts.code ? `<ul class="api-list">${items.map((s) => `<li><code>${esc(s)}</code></li>`).join('')}</ul>` : list(items, mark, opts.tag || 'ul')}` : '');
  return `<p class="lesson-lead-q"><b>Why interviewers ask this.</b> ${mark(t.problem)}</p>
${wordsBox}
${animationBox(lessonCtx, t, phase.accent)}
<h3>Requirements</h3>
<div class="req-grid">
  <div><p class="req-h">Functional</p>${list(t.functional, mark)}</div>
  <div><p class="req-h">Non-functional</p>${list(t.nonFunctional, mark)}</div>
</div>
${block('Estimates', t.estimates)}
${block('API', t.api, { code: true })}
${block('Data model', t.dataModel)}
${block('Classes', t.classes)}
${block('Patterns used', t.patterns)}
${block('Start simple, then scale', t.evolution, { tag: 'ol' })}
${diagramBox(t, mark)}
${block('The design, step by step', t.design, { tag: 'ol' })}
${block('Deep dives', t.deepDives)}
<h3>Common mistakes</h3>
${list(t.mistakes, mark, 'ul', 'mistakes')}
${topicCode(t)}`;
}

const lessonCtx = {
  key: 'sd',
  course,
  animations,
  glossary,
  topicById: new Map(allTopics.map((x) => [x.topic.id, x])),
  base: BASE,
  name: 'System Design',
  shareFrom: 'the System Design course',
  crumbs: CRUMBS,
  animBase: '/assets/anim/sd/',
  image: '/images/og/system-design.jpg',
  lessonNoun: 'system design lesson',
  schemaCourse: 'System Design',
  // Search words per phase (Semrush): "url shortener system design", "singleton design pattern"...
  seoName: (phase, t) => {
    if (['hld-practice', 'ai-ml-design'].includes(phase.slug)) return `${t.name}: system design`;
    if (phase.slug === 'lld-practice') return `${t.name}: low-level design`;
    if (phase.slug === 'patterns') return /pattern/i.test(t.name) ? t.name : `${t.name} design pattern`;
    if (['networking', 'core-concepts', 'data', 'distributed'].includes(phase.slug)) return `${t.name} in system design`;
    return t.name;
  },
  level: (phase, t) => (t.priority === 'bonus' ? 'Advanced' : t.kind === 'design' || phase.number >= 4 ? 'Intermediate' : 'Beginner'),
  tags,
  steps: [
    { id: 'understand', label: 'Understand it' },
    { id: 'go-further', label: 'Go further', note: 'free, optional' },
    { id: 'practise', label: 'Practise' },
    { id: 'interview', label: 'Interview-ready, then prove it', short: 'Interview-ready' },
  ],
  furtherNote: 'Optional. The notes above are written to be enough on their own. These free resources give a second explanation and extra practice.',
  understand: (t, mark, phase, wordsBox) => (t.kind === 'concept' ? concept(t, mark, phase, wordsBox) : design(t, mark, phase, wordsBox)),
  interview: (t, mark) => `<h3>Your interview answer</h3>
<p class="muted">About 20 to 40 seconds, said out loud. Practise it until it sounds like you, not like notes.</p>
<blockquote class="callout callout-glance">${paragraphs(t.interviewAnswer, mark)}</blockquote>
<h3>Follow-up questions</h3>
${questions(t.followUps, mark)}`,
};

// Phase page titles built around what people search for (Semrush, Nov 2026).
const PHASE_TITLES = {
  networking: 'Networking for System Design: DNS, HTTP, REST, WebSockets',
  data: 'Databases for System Design: SQL vs NoSQL, Sharding, Replication',
  distributed: 'Microservices, Sagas and Raft: Distributed Systems Basics',
  'interview-basics': 'How System Design Interviews Work: A Step-by-Step Framework',
  'core-concepts': 'System Design Concepts: Load Balancing, Caching, CAP',
  'oop-and-solid': 'OOP and SOLID Principles Explained, with Examples',
  patterns: 'Design Patterns Explained: Singleton, Factory, Strategy, Observer',
  'lld-practice': 'Low-Level Design (LLD) Interview Questions: Parking Lot, LRU',
  'hld-practice': 'System Design Interview Questions: URL Shortener, Chat, Feed',
  'ai-ml-design': 'AI/ML System Design: RAG, Recommendations, Fraud Detection',
};

export function renderSdLessons(version) {
  return allTopics.map(({ phase, topic }, i) => [
    lessonPath(phase, topic),
    renderLesson(lessonCtx, phase, phase.topics.indexOf(topic), { prev: allTopics[i - 1], next: allTopics[i + 1] }, version),
  ]);
}

export const sdAnimations = () => Object.entries(animations).map(([id, spec]) => [`assets/anim/sd/${id}.json`, JSON.stringify(spec)]);

// ---------------------------------------------------------------------------
// Course page

const FAQ = [
  { q: 'Is this system design course free?', a: `Yes, all ${sdTotals.topics} lessons, with every diagram, animation, exercise and answer. There is no sign-up. The extra videos and articles linked from each lesson are free too.` },
  { q: 'Who is it for?', a: 'Students and junior engineers preparing for software engineering interviews, and anyone who wants to understand how large systems are built. It starts from what happens when you type a URL, so no prior system design knowledge is needed.' },
  { q: 'What is the difference between HLD and LLD?', a: '<b>High-level design</b> (HLD) is the big picture: services, databases, caches, queues and how they scale, as in "design a URL shortener". <b>Low-level design</b> (LLD) is the code inside one service: classes, interfaces, SOLID and design patterns, as in "design a parking lot". This course teaches both, plus <b>AI/ML system design</b> (RAG assistants, recommendation and fraud detection).' },
  { q: 'I have an interview soon. Where should I start?', a: `Learn the <b>Must know</b> topics first (${sdTotals.must} of them), starting with Phase 0's answer frameworks. The night before, read the <a href="${BASE}revise/">revision notes</a> with "Must know only" switched on.` },
  { q: 'How do I track my progress?', a: `Each lesson ends with ${course.checks.length} checks: ${course.checks.map((c) => c.label).join(', ')}. Tick each one only when you can do it without notes; a topic counts as done when all ${course.checks.length} are ticked. Your ticks are saved in your own browser only; to keep them safe or move to another device, use <b>Download my progress</b> on this page.` },
];

export function renderSdIndex(version) {
  const cards = sdPhases
    .map(
      (p) => `<li class="phase-card" style="--ph:${p.accent}">
    <a href="${phasePath(p)}">
      <span class="phase-num">Phase ${p.number}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.goal)}</p>
      <span class="phase-stats">${p.topics.length} lessons · ${p.topics.filter((t) => t.priority === 'must').length} must know</span>
      <span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span>
    </a>
  </li>`,
    )
    .join('');

  const body = `<div ${CHECKS_ATTR}>
<section class="page-head rm-hero">
  <div class="wrap">
    ${breadcrumbs(CRUMBS)}
    <p class="eyebrow">Free course · updated ${new Date().getUTCFullYear()}</p>
    <h1>System Design, from building blocks to full designs</h1>
    <p class="lead">${sdTotals.phases} phases and ${sdTotals.topics} lessons: high-level design, low-level design (OOP, SOLID and design patterns) and AI/ML system design, ending with ${sdTotals.designs} full interview questions worked through step by step. Every lesson has a diagram, an animation, a spoken interview answer and ${course.checks.length} exercises with answers.</p>
    ${courseByline(newest(allTopics.map((x) => x.topic)))}
    <div class="rm-stats">
      <div><b>${sdTotals.topics}</b><span>lessons</span></div>
      <div><b>${sdTotals.designs}</b><span>full design questions</span></div>
      <div><b>${sdTotals.exercises}</b><span>exercises with answers</span></div>
      <div><b data-rm-done>0</b><span>lessons you've finished</span></div>
    </div>
  </div>
</section>
<section class="wrap rm-layout">
  <div>
    <h2 class="sr-only">Phases</h2>
    <ol class="phase-grid">${cards}</ol>
    <section class="rm-loop" aria-labelledby="checks-h">
      <h2 id="checks-h">The four checks</h2>
      <ol class="loop-steps">${course.checks.map((c, i) => `<li><b><span>${i + 1}</span>${esc(c.label)}</b><p>${esc(c.meaning)}</p></li>`).join('')}</ol>
      <p class="muted">${esc(course.confidentRule)}</p>
    </section>
    ${progressBackup()}
  </div>
  <aside class="rm-rules">
    <h2>How to study it</h2>
    <ol>${howToStudy.map((s) => `<li>${s.includes('<a ') ? s : esc(s)}</li>`).join('')}</ol>
    <a class="btn" href="${lessonPath(sdPhases[0], sdPhases[0].topics[0])}">Start the first lesson</a>
    <a class="text-link" href="${BASE}revise/">Interview soon? Read the revision notes →</a>
  </aside>
</section>
<section class="wrap-narrow">${faqBlock(FAQ)}</section>
</div>`;

  return layout({
    title: `System Design Course (Free): HLD, LLD and Interview Roadmap | ${site.name}`,
    ogTitle: 'The free System Design course',
    description: `Free system design course and roadmap: ${sdTotals.topics} lessons on HLD, LLD, design patterns and AI/ML design, with diagrams and interview answers.`,
    path: BASE,
    image: '/images/og/system-design.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/roadmap.js'],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'System Design',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: sdPhases.length,
        itemListElement: sdPhases.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `Phase ${p.number}: ${p.title}`, url: `${site.url}${phasePath(p)}` })),
      },
      faqSchema(FAQ),
      breadcrumbSchema(CRUMBS),
    ],
  });
}

// ---------------------------------------------------------------------------
// Phase pages

export function renderSdPhase(p, i, version) {
  const crumbs = [...CRUMBS, { name: `Phase ${p.number}: ${p.title}`, path: phasePath(p) }];
  const prev = sdPhases[i - 1];
  const next = sdPhases[i + 1];
  const topics = p.topics
    .map(
      (t, ti) => `<li class="topic" id="${t.slug}">
    <a class="topic-card" href="${lessonPath(p, t)}" data-topic-link="${p.slug}--${t.slug}">
      <span class="topic-n">${p.number}.${ti + 1}</span>
      <div class="topic-body"><h3>${esc(t.name)}</h3>${tags(t)}<p>${esc(t.definition)}</p></div>
      <span class="check-dots" data-check-dots="${p.slug}--${t.slug}" title="Checks ticked">${course.checks.map(() => '<i></i>').join('')}</span>
    </a>
  </li>`,
    )
    .join('');

  const body = `<div ${CHECKS_ATTR}>
<section class="page-head phase-head" style="--ph:${p.accent}">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">Phase ${p.number} of ${sdPhases.length - 1} · ${p.topics.length} lessons</p>
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.goal)}</p>
    <p class="phase-big">${esc(p.bigPicture)}</p>
    ${courseByline(newest(p.topics))}
    <div class="phase-bar"><span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span><span class="phase-count" data-phase-count="${p.slug}" data-total="${p.topics.length}">0 of ${p.topics.length} done</span></div>
  </div>
</section>
<div class="wrap phase-layout">
  <nav class="phase-nav" aria-label="System design phases">
    <ol>${sdPhases.map((q) => `<li><a href="${phasePath(q)}"${q.slug === p.slug ? ' aria-current="page"' : ''}><span>${q.number}</span>${esc(q.short)}</a></li>`).join('')}</ol>
  </nav>
  <div class="phase-main">
    <section aria-labelledby="topics-h">
      <h2 id="topics-h">Lessons, in order</h2>
      <ol class="topic-list">${topics}</ol>
    </section>
    <nav class="pager" aria-label="Previous and next phase">
      ${prev ? `<a class="pager-prev" href="${phasePath(prev)}"><span>← Phase ${prev.number}</span>${esc(prev.title)}</a>` : `<a class="pager-prev" href="${BASE}"><span>← Back</span>System Design</a>`}
      ${next ? `<a class="pager-next" href="${phasePath(next)}"><span>Phase ${next.number} →</span>${esc(next.title)}</a>` : `<a class="pager-next" href="${BASE}revise/"><span>Done →</span>Revision notes</a>`}
    </nav>
    ${shareBar(`${site.url}${phasePath(p)}`, `System design, phase ${p.number}: ${p.title}`)}
  </div>
</div>
</div>`;

  return layout({
    title: `${PHASE_TITLES[p.slug] || `System Design, phase ${p.number}: ${p.short}`} | ${site.name}`,
    ogTitle: `System design, phase ${p.number}: ${p.title}`,
    description: `${p.goal} ${p.topics.length} free lessons with diagrams, interview answers and exercises.`.slice(0, 300),
    path: phasePath(p),
    image: '/images/og/system-design.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/roadmap.js'],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `System design, phase ${p.number}: ${p.title}`,
        numberOfItems: p.topics.length,
        itemListElement: p.topics.map((t, ti) => ({ '@type': 'ListItem', position: ti + 1, name: t.name, url: `${site.url}${lessonPath(p, t)}` })),
      },
      breadcrumbSchema(crumbs),
    ],
  });
}

// ---------------------------------------------------------------------------
// Revision notes: every lesson's interview notes on one page, for the night
// before. It repeats the lessons, so it is kept out of search results.

export function renderSdRevise(version) {
  const crumbs = [...CRUMBS, { name: 'Revision notes', path: `${BASE}revise/` }];
  const note = (t, p) => {
    const points = t.kind === 'concept' ? t.keyPoints : t.design;
    return `<article class="rev-topic" data-priority="${t.priority}" id="${t.slug}">
  <h3><a href="${lessonPath(p, t)}">${esc(t.name)}</a></h3>
  ${tags(t)}
  <p class="rev-def">${plain(t.definition)}</p>
  <div class="rev-cols">
    <div><p class="rev-h">${t.kind === 'concept' ? 'Must-know points' : 'The design, step by step'}</p>${list(points, plain, t.kind === 'concept' ? 'ul' : 'ol')}
    ${t.kind === 'design' && t.deepDives?.length ? `<p class="rev-h">Deep dives</p>${list(t.deepDives, plain)}` : ''}</div>
    <div><p class="rev-h">Common mistakes</p>${list(t.mistakes, plain, 'ul', 'mistakes')}</div>
  </div>
  <p class="rev-h">Interview answer</p>
  <blockquote class="callout">${paragraphs(t.interviewAnswer)}</blockquote>
  <p class="rev-h">Follow-up questions</p>
  ${questions(t.followUps, plain)}
</article>`;
  };

  const body = `<section class="page-head">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">System Design · revision</p>
    <h1>System design revision notes</h1>
    <p class="lead">Every lesson's must-know points, design steps, common mistakes and interview answer on one page, for the night before an interview. Each title opens the full lesson.</p>
    <label class="rev-filter"><input type="checkbox" data-must-only> Must know only <span class="muted">(${sdTotals.must} of ${sdTotals.topics} topics)</span></label>
  </div>
</section>
<div class="wrap-narrow prose rev-list">
${sdPhases.map((p) => `<section class="rev-phase" aria-labelledby="rev-${p.slug}"><h2 id="rev-${p.slug}">Phase ${p.number}: ${esc(p.title)}</h2>\n${p.topics.map((t) => note(t, p)).join('\n')}\n</section>`).join('\n')}
</div>`;

  return layout({
    title: `System Design Cheat Sheet: Interview Revision Notes | ${site.name}`,
    description: `Revision notes for system design interviews: the must-know points, design steps, common mistakes and interview answer of all ${sdTotals.topics} lessons, on one page.`,
    path: `${BASE}revise/`,
    image: '/images/og/system-design.jpg',
    body,
    version,
    noindex: true,
    section: '/learn/',
    scripts: ['/assets/js/revise.js'],
    schema: [breadcrumbSchema(crumbs)],
  });
}
