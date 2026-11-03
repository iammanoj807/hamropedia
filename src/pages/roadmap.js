// The AI & ML roadmap: the index, one page per phase, and one lesson per topic.
// Content comes from src/data/courses/ml.json (npm run sync-courses).
import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { createGlossary, paragraphs } from '../lib/glossary.js';
import { layout } from '../templates/layout.js';
import { breadcrumbs, breadcrumbSchema, faqBlock, faqSchema, shareBar } from '../templates/components.js';
import { readCourse, backbone, progressBackup, courseByline, newest, KIND } from './course-parts.js';
import { renderLesson, list, animationBox, diagramBox, questions } from './lesson.js';
import { codeBlock } from '../lib/markdown.js';

// Phase colours: a cool blue / teal / violet family that sits well with the blue site theme.
const PHASE_COLOURS = ['#64748b', '#2563eb', '#0891b2', '#4f46e5', '#0d9488', '#7c3aed', '#0284c7', '#6366f1'];
const course = readCourse('ml');
const animations = readCourse('ml-animations');
export const phases = course.phases.map((p, i) => ({ ...p, accent: PHASE_COLOURS[i % PHASE_COLOURS.length] }));

const BASE = '/ai-roadmap/';
const allTopics = phases.flatMap((phase) => phase.topics.map((topic) => ({ phase, topic })));
const resourceCount = (p) => p.main.length + p.deeper.length + p.topics.reduce((a, t) => a + t.resources.length, 0);
export const totals = {
  phases: phases.length,
  topics: allTopics.length,
  exercises: allTopics.length * course.checks.length,
  resources: phases.reduce((a, p) => a + resourceCount(p), 0),
};

/** Every piece of prose in a topic, in reading order (atomic-hub's foundationProse). */
const proseOf = (t) => [
  t.definition, t.problem, t.note.idea, ...t.howItWorks, t.note.analogy, t.note.breaks,
  ...(t.note.example ? [t.note.example] : []), ...t.keyPoints, ...t.mistakes,
  ...course.checks.map((c) => t.practice[c.key]), ...t.followUps.flatMap((f) => [f.q, f.a]),
];
const glossary = createGlossary(course.glossary, allTopics.map((x) => x.topic), proseOf);

const phasePath = (p) => `${BASE}${p.slug}/`;
const lessonPath = (p, t) => `${BASE}${p.slug}/${t.slug}/`;
const CRUMBS = [{ name: 'Home', path: '/' }, { name: 'Learn & Build', path: '/learn/' }, { name: 'AI & ML Roadmap', path: BASE }];

const ROADMAP_FAQ = [
  { q: 'Is this AI and machine learning roadmap really free?', a: 'Yes, all of it: every lesson, animation, exercise and answer. The extra resources are free too (university courses, 3Blue1Brown, Andrej Karpathy, official documentation and open books). The few paid books are marked <b>Paid</b>, and each has a free alternative in the same phase.' },
  { q: 'How long does it take to finish?', a: 'There are no deadlines on purpose. It is a long road: at around 10 hours a week, plan in months per phase, not days. Going in order, and actually building things, matters far more than going fast.' },
  { q: 'Do I need a strong maths background?', a: 'No. Phase 1 starts from vectors and derivatives, with visual explanations first. School-level algebra is enough to begin.' },
  { q: 'Do I need a powerful computer or a GPU?', a: 'Not for phases 0 to 3. A normal laptop runs NumPy and small PyTorch models. For later phases you can use free cloud notebooks such as Google Colab or Kaggle.' },
  { q: 'Is this a good path to an AI engineer job?', a: 'Phase 5 (AI engineering: retrieval, evaluation, agents and deployment) is the core of most AI engineer roles today, and the earlier phases are what let you debug those systems rather than just call an API. Each phase also ends with interview-style questions.' },
  { q: 'How do I track my progress?', a: `Each lesson ends with ${course.checks.length} checks: ${course.checks.map((c) => c.label).join(', ')}. Tick each one only when you can do it without notes; a topic counts as done when all ${course.checks.length} are ticked. Your ticks are saved in your own browser only (nothing is sent anywhere). To keep them safe or move to another device, use <b>Download my progress</b> on this page, then load the file on the other device.` },
];

export function renderRoadmapIndex(version) {
  const cards = phases
    .map(
      (p) => `<li class="phase-card" style="--ph:${p.accent}">
    <a href="${phasePath(p)}">
      <span class="phase-num">Phase ${p.number}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.goal)}</p>
      <span class="phase-stats">${p.topics.length} lessons · ${p.topics.length * course.checks.length} exercises</span>
      <span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span>
    </a>
  </li>`,
    )
    .join('');

  const body = `<section class="page-head rm-hero">
  <div class="wrap">
    ${breadcrumbs(CRUMBS)}
    <p class="eyebrow">Free course · updated ${new Date().getUTCFullYear()}</p>
    <h1>The AI &amp; Machine Learning Roadmap</h1>
    <p class="lead">From your first NumPy array to building and shipping LLM apps: ${totals.phases} phases and ${totals.topics} lessons, in order. Every lesson has an animation, a diagram, worked code and ${course.checks.length} exercises with answers. No sign-up, no paywall.</p>
    ${courseByline(newest(allTopics.map((x) => x.topic)))}
    <div class="rm-stats">
      <div><b>${totals.topics}</b><span>lessons</span></div>
      <div><b>${totals.exercises}</b><span>exercises with answers</span></div>
      <div><b>${totals.resources}</b><span>free extras</span></div>
      <div><b data-rm-done>0</b><span>lessons you've finished</span></div>
    </div>
  </div>
</section>
<section class="wrap rm-layout">
  <div>
    <h2 class="sr-only">Phases</h2>
    <ol class="phase-grid">${cards}</ol>
    <section class="rm-loop" aria-labelledby="loop-h">
      <h2 id="loop-h">How every lesson works</h2>
      <ol class="loop-steps">${course.loop.map((s, i) => `<li><b><span>${i + 1}</span>${esc(s.step.charAt(0) + s.step.slice(1).toLowerCase())}</b><p>${esc(s.detail)}</p></li>`).join('')}</ol>
      <p class="muted">The ${course.checks.length} checks: ${course.checks.map((c) => `<b>${esc(c.label)}</b> (${esc(c.meaning.replace(/\.$/, '').toLowerCase())})`).join(', ')}.</p>
    </section>
    ${progressBackup()}
  </div>
  <aside class="rm-rules">
    <h2>How to use it</h2>
    <ol>${course.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
    <p class="muted">Extra resource types: ${['watch', 'play', 'read', 'code', 'paper'].map((k) => `<span class="kind ${KIND[k][1]}">${KIND[k][0]}</span>`).join(' ')}</p>
    <a class="btn" href="${lessonPath(phases[0], phases[0].topics[0])}">Start the first lesson</a>
    <a class="text-link" href="/how-to-learn-ai-and-machine-learning-for-free/">Read the guide to this roadmap →</a>
  </aside>
</section>
<section class="wrap-narrow">${faqBlock(ROADMAP_FAQ)}</section>`;

  return layout({
    title: `Free AI & Machine Learning Roadmap (${new Date().getUTCFullYear()}): ${totals.topics} lessons | ${site.name}`,
    ogTitle: 'The free AI & Machine Learning Roadmap',
    description: `A free AI and machine learning course: ${totals.topics} lessons in ${totals.phases} phases, each with an animation, a diagram and exercises with answers, from NumPy to LLMs.`,
    path: BASE,
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
      breadcrumbSchema(CRUMBS),
    ],
  });
}

export function renderPhase(p, i, version) {
  const crumbs = [...CRUMBS, { name: `Phase ${p.number}: ${p.title}`, path: phasePath(p) }];
  const prev = phases[i - 1];
  const next = phases[i + 1];

  // Each row keeps the id it had before lessons existed, so old #links still land on it.
  const topics = p.topics
    .map(
      (t, ti) => `<li class="topic" id="${t.slug}">
    <a class="topic-card" href="${lessonPath(p, t)}" data-topic-link="${p.slug}--${t.slug}">
      <span class="topic-n">${p.number}.${ti + 1}</span>
      <div class="topic-body"><h3>${esc(t.name)}</h3><p>${esc(t.definition)}</p></div>
      <span class="check-dots" data-check-dots="${p.slug}--${t.slug}" title="Checks ticked">${course.checks.map(() => '<i></i>').join('')}</span>
    </a>
  </li>`,
    )
    .join('');

  const builds = p.builds?.length
    ? `<section aria-labelledby="builds-h" class="rm-backbone">
      <h2 id="builds-h">Mini-builds</h2>
      <p class="muted">Small projects that use this phase's topics together. Build each one from a blank file.</p>
      <ol class="build-list">${p.builds.map((b) => `<li>${esc(b.text)}</li>`).join('')}</ol>
    </section>`
    : '';
  const ready = p.ready?.length
    ? `<section aria-labelledby="ready-h" class="rm-backbone">
      <h2 id="ready-h">Ready when you can answer</h2>
      <p class="muted">Interview-style questions. Answer out loud first, then open the answer and compare.</p>
      <div class="qa-list">${p.ready.map((q) => `<details class="reveal"><summary>${esc(q.q)}</summary><div class="reveal-body">${paragraphs(q.a)}</div></details>`).join('')}</div>
    </section>`
    : '';

  const body = `<section class="page-head phase-head" style="--ph:${p.accent}">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">Phase ${p.number} of ${phases.length - 1} · ${p.topics.length} lessons</p>
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.goal)}</p>
    <p class="phase-big">${esc(p.bigPicture)}</p>
    ${courseByline(newest(p.topics))}
    <div class="phase-bar"><span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span><span class="phase-count" data-phase-count="${p.slug}" data-total="${p.topics.length}">0 of ${p.topics.length} done</span></div>
  </div>
</section>
<div class="wrap phase-layout">
  <nav class="phase-nav" aria-label="Roadmap phases">
    <ol>${phases.map((q) => `<li><a href="${phasePath(q)}"${q.slug === p.slug ? ' aria-current="page"' : ''}><span>${q.number}</span>${esc(q.short)}</a></li>`).join('')}</ol>
  </nav>
  <div class="phase-main">
    <section aria-labelledby="topics-h">
      <h2 id="topics-h">Lessons, in order</h2>
      <ol class="topic-list">${topics}</ol>
    </section>
    ${builds}
    ${ready}
    ${backbone(p.main, 'Core books and courses for this phase', 'core-h')}
    ${backbone(p.deeper, 'Go deeper (optional)', 'deeper-h')}
    <nav class="pager" aria-label="Previous and next phase">
      ${prev ? `<a class="pager-prev" href="${phasePath(prev)}"><span>← Phase ${prev.number}</span>${esc(prev.title)}</a>` : '<span></span>'}
      ${next ? `<a class="pager-next" href="${phasePath(next)}"><span>Phase ${next.number} →</span>${esc(next.title)}</a>` : `<a class="pager-next" href="${BASE}"><span>Done →</span>Back to the roadmap</a>`}
    </nav>
    ${shareBar(`${site.url}${phasePath(p)}`, `AI roadmap, phase ${p.number}: ${p.title}`)}
  </div>
</div>`;

  return layout({
    title: `Phase ${p.number}: ${p.title}, free lessons | ${site.name}`,
    ogTitle: `AI roadmap, phase ${p.number}: ${p.title}`,
    description: `${p.goal} ${p.topics.length} free lessons, each with an animation, a diagram and exercises with answers.`.slice(0, 300),
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
        itemListElement: p.topics.map((t, ti) => ({ '@type': 'ListItem', position: ti + 1, name: t.name, url: `${site.url}${lessonPath(p, t)}` })),
      },
      breadcrumbSchema(crumbs),
    ],
  });
}

/** Step 1 of an ML lesson, in atomic-hub's order. */
function understand(t, mark, phase, wordsBox) {
  return `<p class="lesson-lead-q"><b>The problem it solves.</b> ${mark(t.problem)}</p>
${wordsBox}
${animationBox(lessonCtx, t, phase.accent)}
<h3>The idea</h3>
${paragraphs(t.note.idea, mark)}
<h3>How it works, step by step</h3>
${list(t.howItWorks, mark, 'ol')}
${diagramBox(t, mark)}
<h3>Analogy</h3>
<blockquote class="callout">${paragraphs(t.note.analogy, mark)}</blockquote>
<h3>Where the analogy breaks</h3>
${paragraphs(t.note.breaks, mark)}
${t.note.example || t.note.code ? `<h3>Worked example</h3>${t.note.example ? paragraphs(t.note.example, mark) : ''}${t.note.code ? codeBlock(t.note.code, t.note.codeLanguage || 'python') : ''}` : ''}
<h3>Must-know points</h3>
${list(t.keyPoints, mark)}
<h3>Common mistakes</h3>
${list(t.mistakes, mark, 'ul', 'mistakes')}`;
}

const lessonCtx = {
  key: 'ml',
  course,
  animations,
  glossary,
  topicById: new Map(allTopics.map((x) => [x.topic.id, x])),
  base: BASE,
  name: 'AI & ML Roadmap',
  shareFrom: 'the AI & ML roadmap',
  crumbs: CRUMBS,
  animBase: '/assets/anim/ml/',
  image: '/images/og/ai-roadmap.jpg',
  lessonNoun: 'AI & ML lesson',
  schemaCourse: 'AI & Machine Learning Roadmap',
  level: (phase) => (phase.number <= 2 ? 'Beginner' : 'Intermediate'),
  steps: [
    { id: 'understand', label: 'Understand it' },
    { id: 'go-further', label: 'Go further', note: 'optional' },
    { id: 'practise', label: 'Practise' },
    { id: 'prove', label: 'Prove it' },
  ],
  furtherNote: 'Optional. The lesson above is written to be enough on its own. If you want a second explanation, start with the one marked <b>Worth it</b>.',
  understand,
  interview: (t, mark) => `<h3>Check you understood</h3>\n${questions(t.followUps, mark)}`,
};

/** Every lesson page: [path, html]. */
export function renderLessons(version) {
  const ctx = lessonCtx;
  return allTopics.map(({ phase, topic }, i) => [
    lessonPath(phase, topic),
    renderLesson(ctx, phase, phase.topics.indexOf(topic), { prev: allTopics[i - 1], next: allTopics[i + 1] }, version),
  ]);
}

/** The animation data, written next to the site as one small JSON file per lesson. */
export const lessonAnimations = () => Object.entries(animations).map(([id, spec]) => [`assets/anim/ml/${id}.json`, JSON.stringify(spec)]);
