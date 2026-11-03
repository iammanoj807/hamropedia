// DSA: the NeetCode 150, taught one pattern per topic. The hub (with today's
// reviews), one page per topic, and "Which pattern?" (the pattern finders and
// a drill). Content comes from src/data/courses/dsa.json (npm run sync-courses).
//
// Ticks, review dates and the drill are kept in the reader's browser
// (assets/js/lib/dsa.js); the problems themselves link to LeetCode.
import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { codeBlock } from '../lib/markdown.js';
import { paragraphs, plain } from '../lib/glossary.js';
import { layout } from '../templates/layout.js';
import { breadcrumbs, breadcrumbSchema, faqBlock, faqSchema, shareBar } from '../templates/components.js';
import { readCourse, progressBackup, clip, courseByline, newest } from './course-parts.js';
import { list, animationBox, diagramBox } from './lesson.js';

const COLOURS = ['#2563eb', '#0891b2', '#4f46e5', '#0d9488', '#7c3aed', '#0284c7'];
const course = readCourse('dsa');
const animations = readCourse('dsa-animations');
const BASE = '/dsa/';
const PATTERNS = `${BASE}patterns/`;
const CRUMBS = [{ name: 'Home', path: '/' }, { name: 'Learn & Build', path: '/learn/' }, { name: 'DSA (NeetCode 150)', path: BASE }];

export const dsaTopics = course.phases.flatMap((phase) =>
  phase.sections.flatMap((section) => section.topics.map((topic) => ({ ...topic, phase, section }))),
).map((t, i) => ({ ...t, index: i, accent: COLOURS[i % COLOURS.length] }));
const topicPath = (t) => `${BASE}${t.slug}/`;
const allProblems = dsaTopics.flatMap((t) => t.problems.map((p) => ({ ...p, topic: t })));
export const dsaTotals = { topics: dsaTopics.length, problems: allProblems.length };
const DIFF = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

/** What the hub and the drill need about every problem, in course order. */
const problemData = () =>
  allProblems.map((p) => ({
    id: p.id, title: p.title, url: p.url, difficulty: p.difficulty, topic: p.topic.id, topicTitle: p.topic.title, topicUrl: topicPath(p.topic),
    summary: p.card.summary, technique: p.card.technique, clue: p.card.clue, trick: p.card.trick, ...(p.card.alsoAccept ? { alsoAccept: p.card.alsoAccept } : {}),
  }));
const json = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
/** Which problems belong to which topic, so any DSA page can show progress for all of them. */
const topicMap = () => `<script type="application/json" id="dsa-map">${json(Object.fromEntries(dsaTopics.map((t) => [t.id, t.problems.map((p) => p.id)])))}</script>`;

const animCtx = { animations, animBase: '/assets/anim/dsa/' };
export const dsaAnimations = () => Object.entries(animations).map(([id, spec]) => [`assets/anim/dsa/${id}.json`, JSON.stringify(spec)]);

// ---------------------------------------------------------------------------
// Topic pages

const STEPS = [
  { id: 'understand', label: 'Understand it' },
  { id: 'recognise', label: 'Recognise it' },
  { id: 'template', label: 'The template' },
  { id: 'watch', label: 'Watch it run' },
  { id: 'practise', label: 'Practise' },
];

function trace(label, ex) {
  return `<div class="trace">
  <h3>${label}: ${esc(ex.title)}</h3>
  <p><b>Input:</b> <code>${esc(ex.input)}</code></p>
  <div class="table-wrap"><table class="rows trace-rows"><thead><tr>${ex.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${ex.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <p><b>Result:</b> <code>${esc(ex.result)}</code></p>
  <blockquote class="callout callout-tip"><p><b>Notice:</b> ${plain(ex.insight)}</p></blockquote>
  ${ex.code ? codeBlock(ex.code, 'python') : ''}
</div>`;
}

function problemRow(p) {
  const c = p.card;
  return `<li class="dsa-problem" id="problem-${esc(p.id)}">
  <div class="dsa-problem-head">
    <label class="tick"><input type="checkbox" data-problem="${esc(p.id)}"><span class="sr-only">Mark "${esc(p.title)}" as solved</span></label>
    <a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>
    ${p.difficulty ? `<span class="diff diff-${p.difficulty}">${DIFF[p.difficulty]}</span>` : ''}
  </div>
  <p class="dsa-q">${plain(c.summary)}</p>
  <details class="reveal"><summary>Show answer</summary><div class="reveal-body">
    <p><b>Technique:</b> ${plain(c.technique)}</p>
    <p><b>The clue:</b> ${plain(c.clue)}</p>
    <p><b>The trick:</b> ${plain(c.trick)}</p>
  </div></details>
  <p class="dsa-review muted" data-review-for="${esc(p.id)}"></p>
</li>`;
}

export function renderDsaTopic(t, version) {
  const g = t.guide;
  const c = t.content;
  const url = topicPath(t);
  const crumbs = [...CRUMBS, { name: t.title, path: url }];
  const prev = dsaTopics[t.index - 1];
  const next = dsaTopics[t.index + 1];

  const more = [
    c.whatItIs ? `<h4>What it is</h4>${paragraphs(c.whatItIs)}` : '',
    c.whenToUse?.length ? `<h4>When to use it</h4>${list(c.whenToUse, plain)}` : '',
    c.howItWorks ? `<h4>How it works</h4>${paragraphs(c.howItWorks)}` : '',
    c.exampleWalkthrough ? `<h4>Example walkthrough</h4><p><b>Input:</b> <code>${esc(c.exampleWalkthrough.input)}</code></p>${list(c.exampleWalkthrough.steps, plain, 'ol')}<p><b>Result:</b> ${plain(c.exampleWalkthrough.result)}</p>` : '',
    c.relatedPatterns?.length ? `<h4>Related patterns</h4><ul>${c.relatedPatterns.map((r) => `<li><b>${esc(r.pattern)}:</b> ${plain(r.description)}</li>`).join('')}</ul>` : '',
  ].join('');

  const understand = `<blockquote class="callout callout-glance"><p class="glance-h">Remember it by</p><p>${plain(g.hook)}</p></blockquote>
${animationBox(animCtx, t, t.accent)}
<h3>The idea</h3>
${paragraphs(g.idea)}
${diagramBox(g, plain)}
<h3>Analogy</h3>
<blockquote class="callout">${paragraphs(g.analogy)}</blockquote>
<h3>Where the analogy breaks</h3>
${paragraphs(g.breaks)}
${more ? `<details class="solution more-detail"><summary>More detail</summary>${more}</details>` : ''}`;

  const recognise = `<h3>Words that signal it</h3>
${list(g.signals, plain)}
<h3>Don't confuse it with</h3>
<ul>${g.lookAlikes.map((l) => `<li><b>${esc(l.pattern)}:</b> ${plain(l.clue)}</li>`).join('')}</ul>
<h3>Gut check</h3>
<blockquote class="callout"><p>${plain(g.gutCheck)}</p></blockquote>
${c.interviewTips?.howToRecognize ? `<h3>How to recognise it in an interview</h3>${paragraphs(c.interviewTips.howToRecognize)}` : ''}`;

  const template = `<p>The general shape. Adapt it to each problem rather than learning one solution per problem.</p>
${codeBlock(g.template, 'python')}
${c.codeTemplate ? `<details class="solution"><summary>The same template in Java</summary>${codeBlock(c.codeTemplate, 'text')}</details>` : ''}
${g.extraTemplate ? `<h3>${esc(g.extraTemplate.title)}</h3>${codeBlock(g.extraTemplate.code, 'python')}` : ''}
<div class="complexity"><div><span>Time</span><b>${esc(g.time)}</b></div><div><span>Space</span><b>${esc(g.space)}</b></div></div>
<h3>Common mistakes</h3>
${list(t.mistakes, plain, 'ul', 'mistakes')}`;

  const watch = `<p>Two problems, traced step by step exactly as the code runs.</p>
${trace('Easy example', g.easy)}
${trace('Medium example', g.medium)}`;

  const groups = ['easy', 'medium', 'hard']
    .map((d) => ({ d, items: t.problems.filter((p) => p.difficulty === d) }))
    .filter((x) => x.items.length);
  const unlisted = t.problems.filter((p) => !p.difficulty);
  const practise = `<p>Read each question and say the pattern and the trick out loud before you open the answer. Then solve it on LeetCode. Tick a problem once you've solved it on your own: it comes back for review tomorrow, then after 3, 7, 14 and 30 days, then every month, on the <a href="${BASE}#review-today">DSA page</a>.</p>
${groups.map((x) => `<h3>${DIFF[x.d]}</h3><ol class="dsa-problems">${x.items.map(problemRow).join('\n')}</ol>`).join('\n')}
${unlisted.length ? `<ol class="dsa-problems">${unlisted.map(problemRow).join('\n')}</ol>` : ''}
${c.interviewTips?.whatToSay ? `<h3>What to say in the interview</h3><blockquote class="callout callout-glance">${paragraphs(c.interviewTips.whatToSay)}</blockquote>` : ''}
${c.interviewTips?.followUpPrep ? `<h3>Follow-up prep</h3>${paragraphs(c.interviewTips.followUpPrep)}` : ''}`;

  const sections = [understand, recognise, template, watch, practise]
    .map((html, i) => `<section class="lesson-step" id="${STEPS[i].id}" aria-labelledby="${STEPS[i].id}-h">
  <h2 id="${STEPS[i].id}-h"><span class="step-n">Step ${i + 1}</span> ${STEPS[i].label}</h2>
  ${html}
</section>`)
    .join('\n');

  const body = `<section class="page-head lesson-head" style="--ph:${t.accent}">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">DSA · Topic ${t.index + 1} of ${dsaTopics.length} · ${esc(t.section.title)}</p>
    <h1>${esc(t.title)}</h1>
    <p class="lead">${plain(g.hook)}</p>
    ${courseByline(t.updated)}
    <p class="lesson-progress"><span data-dsa-count="${esc(t.id)}" data-total="${t.problems.length}">${t.problems.length} problems</span> · <span>${esc(g.time)} time, ${esc(g.space)} space</span></p>
  </div>
</section>
<div class="wrap lesson-layout" data-dsa-topic="${esc(t.id)}">
  <aside class="lesson-rail">
    <nav aria-label="Steps in this topic">
      <p class="rail-h">This topic</p>
      <ol class="rail-steps">${STEPS.map((s, i) => `<li><a href="#${s.id}"><span>${i + 1}</span>${s.label}</a></li>`).join('')}</ol>
    </nav>
    <details class="rail-phase">
      <summary>All ${dsaTopics.length} topics</summary>
      <ol>${dsaTopics.map((x) => `<li><a href="${topicPath(x)}"${x.id === t.id ? ' aria-current="page"' : ''} data-dsa-topic-link="${esc(x.id)}" data-total="${x.problems.length}"><span>${x.index + 1}</span>${esc(x.title)}</a></li>`).join('')}</ol>
    </details>
  </aside>
  <article class="lesson prose">
    ${sections}
    <nav class="pager" aria-label="Previous and next topic">
      ${prev ? `<a class="pager-prev" href="${topicPath(prev)}"><span>← Previous</span>${esc(prev.title)}</a>` : `<a class="pager-prev" href="${BASE}"><span>← Back</span>DSA (NeetCode 150)</a>`}
      ${next ? `<a class="pager-next" href="${topicPath(next)}"><span>Next →</span>${esc(next.title)}</a>` : `<a class="pager-next" href="${PATTERNS}"><span>Finished →</span>Which pattern? drill</a>`}
    </nav>
    ${shareBar(`${site.url}${url}`, `${t.title}: the pattern and the NeetCode problems, explained`)}
  </article>
</div>
${topicMap()}`;

  return layout({
    title: `${t.title}: pattern and problems | ${site.name}`,
    ogTitle: `${t.title}: the pattern, the template and the NeetCode problems`,
    description: clip(`${t.title}: ${c.whatItIs || g.idea} With a Python template, traced examples and ${t.problems.length} NeetCode problems.`),
    path: url,
    image: '/images/og/dsa.jpg',
    type: 'article',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/lesson.js', '/assets/js/dsa.js'],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: `${t.title} (data structures and algorithms)`,
        description: plain(g.hook),
        url: `${site.url}${url}`,
        learningResourceType: 'Lesson',
        educationalLevel: t.phase.id.includes('1') ? 'Beginner' : 'Intermediate',
        inLanguage: 'en',
        isAccessibleForFree: true,
        isPartOf: { '@type': 'Course', name: 'DSA: the NeetCode 150, one pattern at a time', url: `${site.url}${BASE}`, provider: { '@type': 'Organization', name: site.name, url: site.url } },
        author: { '@type': 'Person', name: site.author.name, url: `${site.url}/about-us/` },
        ...(t.updated ? { dateModified: t.updated } : {}),
      },
      breadcrumbSchema(crumbs),
    ],
  });
}

// ---------------------------------------------------------------------------
// The hub

const FAQ = [
  { q: 'What is the NeetCode 150?', a: 'A well-known list of 150 LeetCode problems, chosen by NeetCode (neetcode.io), that covers the patterns asked in coding interviews. The list and its order are NeetCode\'s; every lesson, template, traced example and answer here is Hamropedia\'s own. The problems themselves link to LeetCode.' },
  { q: 'Is it free?', a: 'Yes: all 18 lessons, the templates, the traced examples, the 150 question-and-answer cards, the review schedule and the drill, with no sign-up. Most of the problems can be solved on LeetCode with a free account, but a few (such as Meeting Rooms, Alien Dictionary and Graph Valid Tree) are LeetCode Premium. For those, the pattern, the template and the answer card here still teach you the idea.' },
  { q: 'How do the reviews work?', a: 'Tick a problem once you have solved it on your own. It comes back here the next day, to solve again from a blank editor. Each time you solve it, the gap grows: 1, 3, 7, 14, then 30 days, then every month. "Struggled" keeps the same gap; "Couldn\'t" starts again tomorrow. At most three a day, longest overdue first, so it never becomes a pile.' },
  { q: 'Which language are the templates in?', a: 'Python, with a Java version of each topic\'s template underneath. The patterns are the same in any language.' },
  { q: 'Where is my progress saved?', a: 'In your browser only. Use <b>Download my progress</b> on this page to back it up or move it to another device: it carries your solved problems, review dates and drill progress.' },
];

export function renderDsaHub(version) {
  const grid = course.phases
    .map((ph) => `<section class="dsa-phase" aria-labelledby="ph-${esc(ph.id)}"><h2 id="ph-${esc(ph.id)}">${esc(ph.title)}</h2>
${ph.sections.map((s) => `<ol class="phase-grid dsa-grid">${s.topics.map((x) => {
      const t = dsaTopics.find((y) => y.id === x.id);
      return `<li class="phase-card" style="--ph:${t.accent}"><a href="${topicPath(t)}">
  <span class="phase-num">Topic ${t.index + 1}</span>
  <h3>${esc(t.title)}</h3>
  <p>${plain(t.guide.hook)}</p>
  <span class="phase-stats" data-dsa-count="${esc(t.id)}" data-total="${t.problems.length}">${t.problems.length} problems</span>
  <span class="phase-progress" data-dsa-progress="${esc(t.id)}" data-total="${t.problems.length}"><span></span></span>
</a></li>`;
    }).join('')}</ol>`).join('')}
</section>`)
    .join('\n');

  const body = `<section class="page-head rm-hero">
  <div class="wrap">
    ${breadcrumbs(CRUMBS)}
    <p class="eyebrow">Free course · coding interviews</p>
    <h1>DSA: the NeetCode 150, one pattern at a time</h1>
    <p class="lead">${dsaTotals.topics} patterns and ${dsaTotals.problems} problems, in order. Each topic teaches the pattern first (the idea, a picture, a Python template and two traced examples), then gives its problems as questions with hidden answers. Problems you solve come back for review, so they are still there in a month.</p>
    ${courseByline(newest(dsaTopics))}
    <div class="rm-stats">
      <div><b>${dsaTotals.topics}</b><span>patterns</span></div>
      <div><b>${dsaTotals.problems}</b><span>problems</span></div>
      <div><b data-dsa-solved>0</b><span>you've solved</span></div>
      <div><b data-dsa-due>0</b><span>to review today</span></div>
    </div>
  </div>
</section>
<div class="wrap">
  <section class="review-today" id="review-today" aria-labelledby="review-h" data-review-today>
    <h2 id="review-h">Review today</h2>
    <div class="review-list"><p class="muted">Nothing to review yet. Tick a problem as solved in any topic, and it comes back here tomorrow to solve again.</p></div>
  </section>
  <p class="dsa-links"><a class="btn" href="${topicPath(dsaTopics[0])}">Start with ${esc(dsaTopics[0].title)}</a> <a class="btn-ghost" href="${PATTERNS}">Which pattern? Practise spotting them</a></p>
  ${grid}
  ${progressBackup()}
</div>
<section class="wrap-narrow">${faqBlock(FAQ)}</section>
<script type="application/json" id="dsa-problems">${json(problemData())}</script>
${topicMap()}`;

  return layout({
    title: `DSA: the NeetCode 150, one pattern at a time | ${site.name}`,
    ogTitle: 'DSA: the NeetCode 150, one pattern at a time',
    description: `Learn data structures and algorithms for free: ${dsaTotals.topics} patterns and the ${dsaTotals.problems} NeetCode problems, with templates, traced examples, answers and a review schedule.`,
    path: BASE,
    image: '/images/og/dsa.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/dsa.js', '/assets/js/roadmap.js'],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'DSA: the NeetCode 150',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: dsaTopics.length,
        itemListElement: dsaTopics.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.title, url: `${site.url}${topicPath(t)}` })),
      },
      faqSchema(FAQ),
      breadcrumbSchema(CRUMBS),
    ],
  });
}

// ---------------------------------------------------------------------------
// Which pattern? The finders, the look-alikes, and the drill

export function renderDsaPatterns(version) {
  const crumbs = [...CRUMBS, { name: 'Which pattern?', path: PATTERNS }];
  const title = (id) => dsaTopics.find((t) => t.id === id)?.title || id;
  const body = `<section class="page-head">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">DSA · recognising patterns</p>
    <h1>Which pattern? Spot it from the question</h1>
    <p class="lead">Most of a coding interview is choosing the right pattern. Ask three questions, follow the two finders, then practise on real problems until you can name the pattern in seconds.</p>
    ${courseByline(newest(dsaTopics))}
  </div>
</section>
<div class="wrap-narrow prose">
  <h2>Three questions to ask first</h2>
  ${list(course.questions, plain, 'ol')}
  ${course.finders.map((f) => `<h2>${esc(f.title)}</h2>\n${diagramBox({ diagram: { code: f.code, caption: f.caption } }, plain, null)}`).join('\n')}
  <h2 id="drill">The drill</h2>
  <p>Read what a problem asks and pick its pattern. A right answer brings the card back later (1, 3, 7, 14, then 30 days); a wrong one brings it back tomorrow. Each day: the cards that are due, plus five new ones.</p>
  <div class="drill" data-drill><p class="muted">Loading the drill…</p></div>
  <h2>Patterns people confuse</h2>
  <div class="table-wrap"><table><thead><tr><th>Pattern</th><th>Often confused with</th></tr></thead><tbody>${Object.entries(course.lookAlikes).map(([id, like]) => `<tr><td><a href="${BASE}${dsaTopics.find((t) => t.id === id)?.slug || id}/">${esc(title(id))}</a></td><td>${like.map((x) => esc(title(x))).join(', ')}</td></tr>`).join('')}</tbody></table></div>
</div>
<script type="application/json" id="dsa-problems">${json(problemData())}</script>
<script type="application/json" id="dsa-patterns">${json({ lookAlikes: course.lookAlikes, topics: dsaTopics.map((t) => ({ id: t.id, title: t.title, url: topicPath(t) })) })}</script>
${topicMap()}`;

  return layout({
    title: `Which DSA pattern? Spot it from the question | ${site.name}`,
    ogTitle: 'Which pattern? Spot the DSA pattern from the question',
    description: 'How to choose the right data structure or algorithm pattern in a coding interview: three questions, two flowcharts, and a drill on the NeetCode 150.',
    path: PATTERNS,
    image: '/images/og/dsa.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/lesson.js', '/assets/js/dsa.js'],
    schema: [breadcrumbSchema(crumbs)],
  });
}
