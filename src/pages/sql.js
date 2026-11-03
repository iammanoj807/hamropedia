// SQL: the course page, the practice database, one page per phase, one lesson
// per topic (lessons and interview problems), and revision notes.
// Content comes from src/data/courses/sql.json (npm run sync-courses).
//
// Every example shows the exact rows it returns (checked by atomic-hub's
// tests), and "Try it" runs it in the browser on a real SQLite engine
// (assets/js/sql.js, which loads sql.js only on the first Run).
import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { codeBlock } from '../lib/markdown.js';
import { createGlossary, paragraphs, plain } from '../lib/glossary.js';
import { layout } from '../templates/layout.js';
import { breadcrumbs, breadcrumbSchema, faqBlock, faqSchema, shareBar } from '../templates/components.js';
import { readCourse, progressBackup } from './course-parts.js';
import { renderLesson, list, animationBox, diagramBox, questions } from './lesson.js';

const PHASE_COLOURS = ['#64748b', '#2563eb', '#0891b2', '#4f46e5', '#0d9488', '#7c3aed', '#0284c7', '#6366f1', '#0f766e'];
const course = readCourse('sql');
const animations = readCourse('sql-animations');
export const sqlPhases = course.phases.map((p, i) => ({ ...p, accent: PHASE_COLOURS[i % PHASE_COLOURS.length] }));

const BASE = '/sql/';
const DB_PAGE = `${BASE}practice-database/`;
export const CHECKS_ATTR = `data-course="sql" data-checks="${course.checks.map((c) => c.key).join(',')}"`;
const allTopics = sqlPhases.flatMap((phase) => phase.topics.map((topic) => ({ phase, topic })));
export const sqlTotals = {
  phases: sqlPhases.length,
  topics: allTopics.length,
  problems: allTopics.filter((x) => x.topic.kind === 'problem').length,
  must: allTopics.filter((x) => x.topic.priority === 'must').length,
  queries: allTopics.reduce((n, { topic: t }) => n + (t.examples?.length || 0) + (t.solution ? 1 + (t.alternatives?.length || 0) : 0), 0),
  exercises: allTopics.length * course.checks.length,
};
const HINTS = { write: 'from a blank page, then run it', predict: 'say it before you run it' };

/** Every piece of prose in a topic, in reading order (atomic-hub's sqlTopicProse). */
const proseOf = (t) => {
  const tail = [...t.mistakes, ...course.checks.map((c) => t.practice[c.key]), t.interviewAnswer, ...t.followUps.flatMap((f) => [f.q, f.a])];
  if (t.kind === 'lesson') {
    return [t.definition, t.problem, t.idea, ...t.howItWorks, t.analogy, t.breaks, ...t.examples.flatMap((e) => [e.title, e.note ?? '']), ...t.keyPoints, ...(t.dialects ?? []), ...tail];
  }
  return [
    t.definition, t.problem, t.pattern, t.spot, ...t.approach, t.solution.note ?? '',
    ...(t.alternatives ?? []).flatMap((e) => [e.title, e.note ?? '']), ...t.edgeCases, ...(t.dialects ?? []), ...tail,
  ];
};
const glossary = createGlossary(course.glossary, allTopics.map((x) => x.topic), proseOf);

const phasePath = (p) => `${BASE}${p.slug}/`;
const lessonPath = (p, t) => `${BASE}${p.slug}/${t.slug}/`;
const CRUMBS = [{ name: 'Home', path: '/' }, { name: 'Learn & Build', path: '/learn/' }, { name: 'SQL', path: BASE }];

const tags = (t) =>
  `<p class="topic-tags"><span class="pri pri-${t.priority}">${esc(course.priorityLabels[t.priority])}</span>${t.kind === 'problem' ? `<span class="dtype">Interview problem</span><span class="diff diff-${t.difficulty}">${esc(course.difficultyLabels[t.difficulty])}</span>` : ''}</p>`;

/** atomic-hub's study order, with its page names changed to this site's. */
export const howToStudy = course.howToStudy.map((s) =>
  s
    .replace('Open "The practice database" once', `Open <a href="${DB_PAGE}">the practice database</a> once`)
    .replace('Use Revise mode the night before.', `Read the <a href="${BASE}revise/">revision notes</a> the night before.`),
);

// ---------------------------------------------------------------------------
// Query results and run boxes

const cell = (v) => (v === null ? '<td class="null">NULL</td>' : `<td${typeof v === 'number' ? ' class="num"' : ''}>${esc(v)}</td>`);

/** The rows a query returns (or the error it gives), as a table. */
export function resultTable(r) {
  if (!r) return '';
  const n = r.rows.length;
  return `<div class="result">
  <p class="result-h">${n === 0 ? 'No rows' : `${n} ${n === 1 ? 'row' : 'rows'}`}</p>
  <div class="table-wrap"><table class="rows"><thead><tr>${r.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${r.rows.map((row) => `<tr>${row.map(cell).join('')}</tr>`).join('')}</tbody></table></div>
</div>`;
}

const queryResult = (q) => (q.error ? `<p class="result-err"><b>Error:</b> ${esc(q.error)}</p>` : resultTable(q.result));

/**
 * A box to write and run SQL on the practice database. `key` names the box
 * (with the topic) so the queries run in it are saved and listed under it.
 */
export function runBox({ sql, key, topic = '', topicName = '', place, label }) {
  return `<div class="sql-run" data-key="${esc(key)}" data-topic="${esc(topic)}" data-topic-name="${esc(topicName)}" data-place="${esc(place)}">
  ${label ? `<p class="run-label">${esc(label)}</p>` : ''}
  <textarea class="run-sql" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="${esc(label || place)}" rows="${Math.min(14, Math.max(4, sql.split('\n').length + 1))}">${esc(sql)}</textarea>
  <div class="run-actions">
    <button type="button" class="btn run-go" data-run>Run</button>
    <button type="button" class="btn-ghost" data-reset>Reset</button>
    <span class="run-hint">Ctrl/⌘ + Enter runs it. Select part of the query to run only that part.</span>
  </div>
  <div class="run-out" aria-live="polite"></div>
  <details class="run-history" hidden><summary>Your queries in this box</summary><ul></ul></details>
</div>`;
}

/** A worked query: its SQL, a "Try it" button, and the rows it returns. */
function exampleBlock(ex, mark, { topic, topicName, key, place, heading = 'h4' }) {
  return `<div class="sql-example">
  ${ex.title ? `<${heading} class="ex-title">${mark(ex.title)}</${heading}>` : ''}
  ${codeBlock(ex.sql, 'sql')}
  <button type="button" class="btn-ghost try-it" data-try="${esc(key)}" data-sql="${esc(ex.sql)}" data-topic="${esc(topic)}" data-topic-name="${esc(topicName)}" data-place="${esc(place)}">Try it</button>
  ${queryResult(ex)}
  ${ex.note ? `<p class="ex-note">${mark(ex.note)}</p>` : ''}
</div>`;
}

// ---------------------------------------------------------------------------
// Lessons

function lessonBody(t, mark, phase, wordsBox, ids) {
  return `<p class="lesson-lead-q"><b>Why you need it.</b> ${mark(t.problem)}</p>
${wordsBox}
${animationBox(lessonCtx, t, phase.accent)}
${diagramBox(t, mark)}
<h3>The idea</h3>
${paragraphs(t.idea, mark)}
${t.syntax ? `<h3>The shape of it</h3>${codeBlock(t.syntax, 'sql')}<p class="muted">Words in lower case are the parts you fill in.</p>` : ''}
<h3>How it works, step by step</h3>
${list(t.howItWorks, mark, 'ol')}
<h3>Analogy</h3>
<blockquote class="callout">${paragraphs(t.analogy, mark)}</blockquote>
<h3>Where the analogy breaks</h3>
${paragraphs(t.breaks, mark)}
<h3>${t.examples.length === 1 ? 'Worked example' : 'Worked examples'}</h3>
${t.examples.map((ex, i) => exampleBlock(ex, mark, { ...ids, key: `example-${i + 1}`, place: t.examples.length > 1 ? `Step 1 · Example ${i + 1}: ${ex.title}` : `Step 1 · Worked example: ${ex.title}` })).join('\n')}
<h3>Must-know points</h3>
${list(t.keyPoints, mark)}
<h3>Common mistakes</h3>
${list(t.mistakes, mark, 'ul', 'mistakes')}
${t.dialects?.length ? `<h3>In other databases</h3>${list(t.dialects, mark)}` : ''}`;
}

const tableLinks = (names) => `<p class="table-names">${names.map((n) => `<a href="${DB_PAGE}#table-${esc(n)}"><code>${esc(n)}</code></a>`).join(' ')}</p>`;

function problemBody(t, mark, phase, wordsBox, ids) {
  return `<h3>Tables you will use</h3>
${tableLinks(t.tables)}
${wordsBox}
<h3>What it really tests</h3>
${paragraphs(t.problem, mark)}
<h3>The pattern: ${mark(t.pattern)}</h3>
${paragraphs(t.spot, mark)}
${diagramBox(t, mark)}
<h3>The approach, step by step</h3>
${list(t.approach, mark, 'ol')}
${runBox({ ...ids, key: 'your-turn', place: 'Step 1 · Your turn', label: 'Your turn: write it before you look', sql: `-- Tables: ${t.tables.join(', ')}\n-- Write your answer here, run it, then compare with the solution.\nSELECT ` })}
<details class="solution">
  <summary>Show the solution</summary>
  <p class="muted">Stuck for more than ten minutes? Open it, read it, close it, and write it again from memory.</p>
  ${exampleBlock({ ...t.solution, title: t.solution.title || 'Solution' }, mark, { ...ids, key: 'solution', place: 'Step 1 · Solution', heading: 'h4' })}
  ${(t.alternatives ?? []).map((ex, i) => exampleBlock({ ...ex, title: `Another way: ${ex.title}` }, mark, { ...ids, key: `alternative-${i + 1}`, place: `Step 1 · Another way: ${ex.title}` })).join('\n')}
  <h4>Edge cases to say out loud</h4>
  ${list(t.edgeCases, mark)}
  <h4>Common mistakes</h4>
  ${list(t.mistakes, mark, 'ul', 'mistakes')}
  ${t.dialects?.length ? `<h4>In other databases</h4>${list(t.dialects, mark)}` : ''}
</details>`;
}

const lessonCtx = {
  key: 'sql',
  course,
  animations,
  glossary,
  topicById: new Map(allTopics.map((x) => [x.topic.id, x])),
  base: BASE,
  name: 'SQL',
  shareFrom: 'the SQL course',
  crumbs: CRUMBS,
  animBase: '/assets/anim/sql/',
  image: '/images/og/sql.jpg',
  lessonNoun: 'SQL lesson',
  schemaCourse: 'SQL, from SELECT to interview problems',
  scripts: ['/assets/js/sql.js'],
  level: (phase, t) => (t.kind === 'problem' ? (t.difficulty === 'easy' ? 'Beginner' : t.difficulty === 'hard' ? 'Advanced' : 'Intermediate') : phase.number <= 3 ? 'Beginner' : 'Intermediate'),
  tags,
  steps: (t) => [
    t.kind === 'problem' ? { id: 'solve', label: 'Solve it yourself first', short: 'Solve it first' } : { id: 'understand', label: 'Understand it' },
    { id: 'go-further', label: 'Go further', note: 'free, optional' },
    { id: 'practise', label: 'Practise' },
    { id: 'interview', label: 'Interview-ready, then prove it', short: 'Interview-ready' },
  ],
  furtherNote: 'Optional. The notes above are written to be enough on their own. These free resources give a second explanation and more practice.',
  understand(t, mark, phase, wordsBox) {
    const ids = { topic: this.topicKey(phase, t), topicName: t.name };
    return t.kind === 'problem' ? problemBody(t, mark, phase, wordsBox, ids) : lessonBody(t, mark, phase, wordsBox, ids);
  },
  topicKey: (phase, t) => `${phase.slug}--${t.slug}`,
  practise(t, mark, phase) {
    const ids = { topic: this.topicKey(phase, t), topicName: t.name };
    return `<p>Try each one yourself first: out loud, or written and run in the practice box below, which saves every query you run. Then open the answer and compare.</p>
<ol class="exercises">
${course.checks
  .map((c) => {
    const a = t.answers[c.key];
    return `<li class="exercise">
  <p class="ex-head"><span class="ex-kind">${esc(c.label)}</span><span class="ex-meaning">${esc(HINTS[c.key] || c.meaning)}</span></p>
  <div class="ex-q">${paragraphs(t.practice[c.key], mark)}</div>
  <details class="reveal"><summary>Show answer</summary><div class="reveal-body">${paragraphs(a.answer, mark)}${a.query ? exampleBlock({ ...a.query, title: '' }, mark, { ...ids, key: `answer-${c.key}`, place: `Step 3 · ${c.label} answer` }) : ''}</div></details>
</li>`;
  })
  .join('\n')}
</ol>
${runBox({ ...ids, key: 'practice', place: 'Step 3 · Practice box', label: 'Practice box: write and run your answers here', sql: '-- Write and run your answers here.\nSELECT ' })}`;
  },
  interview: (t, mark) => `<h3>Your interview answer</h3>
<p class="muted">About 20 to 40 seconds, said out loud.</p>
<blockquote class="callout callout-glance">${paragraphs(t.interviewAnswer, mark)}</blockquote>
<h3>Follow-up questions</h3>
${questions(t.followUps, mark)}`,
};

export function renderSqlLessons(version) {
  return allTopics.map(({ phase, topic }, i) => [
    lessonPath(phase, topic),
    renderLesson(lessonCtx, phase, phase.topics.indexOf(topic), { prev: allTopics[i - 1], next: allTopics[i + 1] }, version),
  ]);
}

export const sqlAnimations = () => Object.entries(animations).map(([id, spec]) => [`assets/anim/sql/${id}.json`, JSON.stringify(spec)]);
/** The practice database's SQL, fetched by the runner on the first Run. */
export const sqlPracticeDb = () => [['assets/sql/practice-db.json', JSON.stringify(readCourse('sql-practice-db'))]];

// ---------------------------------------------------------------------------
// Course page

const FAQ = [
  { q: 'Is this SQL course free?', a: `Yes: all ${sqlTotals.topics} lessons and interview problems, every example and answer, and the query runner. There is no sign-up and nothing to install.` },
  { q: 'Do I need to install a database?', a: 'No. Every lesson uses one small practice database of six tables, and <b>Try it</b> runs your query on a real SQLite engine inside your browser. Each run starts from a fresh copy, so you cannot break anything.' },
  { q: 'Is this SQLite, MySQL or PostgreSQL?', a: 'The runner is SQLite, but almost everything here is standard SQL that works the same in MySQL, PostgreSQL and SQL Server. Where they differ, the lesson says so under <b>In other databases</b>.' },
  { q: 'How do I prepare for a SQL interview?', a: `Learn every <b>Must know</b> topic (${sqlTotals.must} of them), then do the ${sqlTotals.problems} interview problems twice: once with the hints, once from a blank page. The night before, read the <a href="${BASE}revise/">revision notes</a>.` },
  { q: 'Where are my queries saved?', a: 'Every query you change and run is saved in your browser, under the box you ran it in, and all of them are listed on the <a href="/sql/practice-database/">practice database</a> page. <b>Download my progress</b> backs them up with your ticks.' },
];

export function renderSqlIndex(version) {
  const cards = sqlPhases
    .map(
      (p) => `<li class="phase-card" style="--ph:${p.accent}">
    <a href="${phasePath(p)}">
      <span class="phase-num">Phase ${p.number}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.goal)}</p>
      <span class="phase-stats">${p.topics.length} ${p.topics.every((t) => t.kind === 'problem') ? 'problems' : 'lessons'} · ${p.topics.filter((t) => t.priority === 'must').length} must know</span>
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
    <h1>SQL, from your first SELECT to interview problems</h1>
    <p class="lead">${sqlTotals.phases} phases: ${sqlTotals.topics - sqlTotals.problems} lessons and ${sqlTotals.problems} classic interview problems, all on one small practice database. Every example shows the exact rows it returns, and <b>Try it</b> runs it in your browser, so you can change it and see what happens.</p>
    <div class="rm-stats">
      <div><b>${sqlTotals.topics}</b><span>lessons and problems</span></div>
      <div><b>${sqlTotals.queries}</b><span>worked queries you can run</span></div>
      <div><b>${sqlTotals.exercises}</b><span>exercises with answers</span></div>
      <div><b data-rm-done>0</b><span>topics you've finished</span></div>
    </div>
  </div>
</section>
<section class="wrap rm-layout">
  <div>
    <h2 class="sr-only">Phases</h2>
    <ol class="phase-grid">${cards}</ol>
    <section class="rm-loop" aria-labelledby="db-h">
      <h2 id="db-h">The practice database</h2>
      <p>Six small tables, with the awkward cases planted on purpose: NULLs, ties, duplicates and a customer with no orders. <a href="${DB_PAGE}">See every table and run any query →</a></p>
      <p class="table-names">${course.practice.tables.map((tb) => `<a href="${DB_PAGE}#table-${esc(tb.name)}"><code>${esc(tb.name)}</code></a>`).join(' ')}</p>
    </section>
    <section class="rm-loop" aria-labelledby="cheat-h">
      <h2 id="cheat-h">SQL cheat sheet: the shapes to know by heart</h2>
      <div class="cheat-grid">${course.cheatSheet.map((c) => `<div><h3>${esc(c.title)}</h3>${codeBlock(c.code, 'text')}</div>`).join('')}</div>
    </section>
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
    <a class="btn" href="${lessonPath(sqlPhases[0], sqlPhases[0].topics[0])}">Start the first lesson</a>
    <a class="text-link" href="${BASE}revise/">Interview soon? Read the revision notes →</a>
  </aside>
</section>
<section class="wrap-narrow">${faqBlock(FAQ)}</section>
</div>`;

  return layout({
    title: `Free SQL Course with a Query Runner: ${sqlTotals.topics} lessons | ${site.name}`,
    ogTitle: 'The free SQL course, with a query runner',
    description: `Learn SQL for free: ${sqlTotals.topics} lessons and interview problems, from SELECT to window functions, with ${sqlTotals.queries} example queries you can run in your browser.`,
    path: BASE,
    image: '/images/og/sql.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/roadmap.js'],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'SQL',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: sqlPhases.length,
        itemListElement: sqlPhases.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `Phase ${p.number}: ${p.title}`, url: `${site.url}${phasePath(p)}` })),
      },
      faqSchema(FAQ),
      breadcrumbSchema(CRUMBS),
    ],
  });
}

// ---------------------------------------------------------------------------
// The practice database: every table, the diagram, a box to run anything, and
// every query the reader has saved.

export function renderSqlDatabase(version) {
  const crumbs = [...CRUMBS, { name: 'The practice database', path: DB_PAGE }];
  const tables = course.practice.tables
    .map(
      (tb) => `<section class="db-table" id="table-${esc(tb.name)}" aria-labelledby="table-${esc(tb.name)}-h">
  <h3 id="table-${esc(tb.name)}-h"><code>${esc(tb.name)}</code> <span class="muted">${tb.rows.length} rows</span></h3>
  <p>${plain(tb.about)}</p>
  <div class="table-wrap"><table class="rows"><thead><tr>${tb.columns.map((c) => `<th title="${esc(c.definition)}">${esc(c.name)}${c.key ? ` <span class="col-key">${esc(c.key)}</span>` : ''}</th>`).join('')}</tr></thead>
  <tbody>${tb.rows.map((row) => `<tr>${row.map(cell).join('')}</tr>`).join('')}</tbody></table></div>
  <details class="col-notes"><summary>What each column means</summary><ul>${tb.columns.map((c) => `<li><code>${esc(c.name)}</code> <span class="muted">${esc(c.definition)}</span>${c.about ? `: ${plain(c.about)}` : ''}</li>`).join('')}</ul></details>
</section>`,
    )
    .join('\n');

  const body = `<section class="page-head">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">SQL · practice</p>
    <h1>The practice database</h1>
    <p class="lead">Every SQL lesson and interview problem uses these six small tables. The awkward cases are planted on purpose: NULLs, ties, duplicates, and a customer with no orders. Get to know the rows, and you can check any answer by eye.</p>
  </div>
</section>
<div class="wrap-narrow prose">
  <h2>Run any query</h2>
  <p>This box runs on a fresh copy of the database every time, so <code>INSERT</code>, <code>UPDATE</code> and <code>DELETE</code> are safe to try: nothing you do here can break a lesson.</p>
  ${runBox({ key: 'database', topic: 'practice-database', topicName: 'The practice database', place: 'The practice database', label: 'Run any query on the practice database', sql: 'SELECT name, salary, dept_id\nFROM employees\nORDER BY salary DESC;' })}
  <h2>How the tables connect</h2>
  <figure class="diagram">
    <div class="diagram-stage" data-mermaid><pre class="diagram-src">${esc(course.practice.diagram.code)}</pre></div>
    ${course.practice.diagram.caption ? `<figcaption>${plain(course.practice.diagram.caption)}</figcaption>` : ''}
  </figure>
  <h2>The six tables</h2>
  ${tables}
  <section class="saved-queries" aria-labelledby="saved-h" data-saved-queries>
    <h2 id="saved-h">My saved queries</h2>
    <p>Every query you change and run in any SQL lesson is saved in this browser, under the topic and the box you ran it in. <a href="${BASE}#your-progress">Download my progress</a> backs them up.</p>
    <div class="saved-list"><p class="muted">No saved queries yet.</p></div>
  </section>
</div>`;

  return layout({
    title: `SQL practice database: six tables and a query box | ${site.name}`,
    ogTitle: 'The SQL practice database',
    description: 'The six tables every Hamropedia SQL lesson uses, with every row, a diagram of how they connect, and a box to run any query in your browser.',
    path: DB_PAGE,
    image: '/images/og/sql.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/lesson.js', '/assets/js/sql.js'],
    schema: [breadcrumbSchema(crumbs)],
  });
}

// ---------------------------------------------------------------------------
// Phase pages

export function renderSqlPhase(p, i, version) {
  const crumbs = [...CRUMBS, { name: `Phase ${p.number}: ${p.title}`, path: phasePath(p) }];
  const prev = sqlPhases[i - 1];
  const next = sqlPhases[i + 1];
  const topics = p.topics
    .map(
      (t, ti) => `<li class="topic" id="${t.slug}">
    <a class="topic-card" href="${lessonPath(p, t)}" data-topic-link="${p.slug}--${t.slug}">
      <span class="topic-n">${p.number}.${ti + 1}</span>
      <div class="topic-body"><h3>${esc(t.name)}</h3>${tags(t)}<p>${plain(t.definition)}</p></div>
      <span class="check-dots" data-check-dots="${p.slug}--${t.slug}" title="Checks ticked">${course.checks.map(() => '<i></i>').join('')}</span>
    </a>
  </li>`,
    )
    .join('');
  const unit = p.topics.every((t) => t.kind === 'problem') ? 'problems' : 'lessons';

  const body = `<div ${CHECKS_ATTR}>
<section class="page-head phase-head" style="--ph:${p.accent}">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">Phase ${p.number} of ${sqlPhases.length - 1} · ${p.topics.length} ${unit}</p>
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.goal)}</p>
    <p class="phase-big">${esc(p.bigPicture)}</p>
    <div class="phase-bar"><span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span><span class="phase-count" data-phase-count="${p.slug}" data-total="${p.topics.length}">0 of ${p.topics.length} done</span></div>
  </div>
</section>
<div class="wrap phase-layout">
  <nav class="phase-nav" aria-label="SQL phases">
    <ol>${sqlPhases.map((q) => `<li><a href="${phasePath(q)}"${q.slug === p.slug ? ' aria-current="page"' : ''}><span>${q.number}</span>${esc(q.short)}</a></li>`).join('')}</ol>
  </nav>
  <div class="phase-main">
    <section aria-labelledby="topics-h">
      <h2 id="topics-h">${unit === 'problems' ? 'Problems' : 'Lessons'}, in order</h2>
      <ol class="topic-list">${topics}</ol>
    </section>
    <nav class="pager" aria-label="Previous and next phase">
      ${prev ? `<a class="pager-prev" href="${phasePath(prev)}"><span>← Phase ${prev.number}</span>${esc(prev.title)}</a>` : `<a class="pager-prev" href="${BASE}"><span>← Back</span>SQL</a>`}
      ${next ? `<a class="pager-next" href="${phasePath(next)}"><span>Phase ${next.number} →</span>${esc(next.title)}</a>` : `<a class="pager-next" href="${BASE}revise/"><span>Done →</span>Revision notes</a>`}
    </nav>
    ${shareBar(`${site.url}${phasePath(p)}`, `SQL, phase ${p.number}: ${p.title}`)}
  </div>
</div>
</div>`;

  return layout({
    title: `SQL, phase ${p.number}: ${p.short} | ${site.name}`,
    ogTitle: `SQL, phase ${p.number}: ${p.title}`,
    description: `${p.goal} ${p.topics.length} free ${unit} with examples you can run in your browser.`.slice(0, 300),
    path: phasePath(p),
    image: '/images/og/sql.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/roadmap.js'],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `SQL, phase ${p.number}: ${p.title}`,
        numberOfItems: p.topics.length,
        itemListElement: p.topics.map((t, ti) => ({ '@type': 'ListItem', position: ti + 1, name: t.name, url: `${site.url}${lessonPath(p, t)}` })),
      },
      breadcrumbSchema(crumbs),
    ],
  });
}

// ---------------------------------------------------------------------------
// Revision notes (kept out of search results: they repeat the lessons)

export function renderSqlRevise(version) {
  const crumbs = [...CRUMBS, { name: 'Revision notes', path: `${BASE}revise/` }];
  const note = (t, p) => `<article class="rev-topic" data-priority="${t.priority}" id="${p.slug}--${t.slug}">
  <h3><a href="${lessonPath(p, t)}">${esc(t.name)}</a></h3>
  ${tags(t)}
  <p class="rev-def">${plain(t.definition)}</p>
  ${t.kind === 'lesson'
    ? `${t.syntax ? codeBlock(t.syntax, 'sql') : ''}<p class="rev-h">Must-know points</p>${list(t.keyPoints, plain)}`
    : `<p class="rev-h">The pattern: ${plain(t.pattern)}</p><p>${plain(t.spot)}</p><p class="rev-h">The approach</p>${list(t.approach, plain, 'ol')}<details class="reveal"><summary>Show the solution</summary><div class="reveal-body">${codeBlock(t.solution.sql, 'sql')}</div></details>`}
  <p class="rev-h">Common mistakes</p>${list(t.mistakes, plain, 'ul', 'mistakes')}
  <p class="rev-h">Interview answer</p>
  <blockquote class="callout">${paragraphs(t.interviewAnswer)}</blockquote>
  <p class="rev-h">Follow-up questions</p>
  ${questions(t.followUps, plain)}
</article>`;

  const body = `<section class="page-head">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">SQL · revision</p>
    <h1>SQL revision notes</h1>
    <p class="lead">Every topic's must-know points, the pattern behind each interview problem, common mistakes and the interview answer, on one page. Each title opens the full lesson.</p>
    <label class="rev-filter"><input type="checkbox" data-must-only data-must-key="hp-sql-must-only"> Must know only <span class="muted">(${sqlTotals.must} of ${sqlTotals.topics} topics)</span></label>
  </div>
</section>
<div class="wrap-narrow prose rev-list">
${sqlPhases.map((p) => `<section class="rev-phase" aria-labelledby="rev-${p.slug}"><h2 id="rev-${p.slug}">Phase ${p.number}: ${esc(p.title)}</h2>\n${p.topics.map((t) => note(t, p)).join('\n')}\n</section>`).join('\n')}
</div>`;

  return layout({
    title: `SQL revision notes | ${site.name}`,
    description: `Revision notes for SQL interviews: the must-know points, interview problem patterns, common mistakes and interview answer of all ${sqlTotals.topics} topics, on one page.`,
    path: `${BASE}revise/`,
    image: '/images/og/sql.jpg',
    body,
    version,
    noindex: true,
    section: '/learn/',
    scripts: ['/assets/js/revise.js'],
    schema: [breadcrumbSchema(crumbs)],
  });
}
