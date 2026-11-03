import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGlossary, paragraphs } from '../src/lib/glossary.js';
import { openProgress } from '../src/assets/js/lib/progress.js';
import { howToStudy } from '../src/pages/system-design.js';

const read = (f) => JSON.parse(fs.readFileSync(new URL(`../src/data/courses/${f}`, import.meta.url), 'utf8'));
const ml = read('ml.json');
const animations = read('ml-animations.json');
const slugs = read('slugs.json');
const topics = ml.phases.flatMap((p) => p.topics.map((t) => ({ p, t })));

test('ML course: every phase, lesson, exercise answer and animation is there', () => {
  // Floors, not exact counts: adding a topic in atomic-hub must not break the build.
  assert.ok(ml.phases.length >= 8);
  assert.ok(topics.length >= 98);
  for (const { t } of topics) {
    for (const c of ml.checks) {
      assert.ok(t.practice[c.key], `${t.id}: ${c.key} exercise`);
      assert.ok(t.answers[c.key]?.answer, `${t.id}: ${c.key} answer`);
    }
    assert.ok(animations[t.id]?.variants?.[0]?.frames?.length, `${t.id}: animation`);
    assert.ok(t.diagram?.code, `${t.id}: diagram`);
  }
});

test('ML course: URLs are unique and match the saved slugs (so they never change)', () => {
  const urls = new Set(topics.map(({ p, t }) => `/ai-roadmap/${p.slug}/${t.slug}/`));
  assert.equal(urls.size, topics.length);
  for (const p of ml.phases) assert.equal(p.slug, slugs.ml.phases[p.id]);
  for (const { t } of topics) assert.equal(t.slug, slugs.ml.topics[t.id]);
  // Every lesson that was ever published must still exist, or its URL would now be a 404.
  const ids = new Set(topics.map(({ t }) => t.id));
  const gone = Object.keys(slugs.ml.topics).filter((id) => !ids.has(id));
  assert.deepEqual(gone, [], `lessons removed in atomic-hub (add a redirect for each, then drop it from slugs.json): ${gone.join(', ')}`);
  // The phase pages were live before the lessons; their addresses must not move.
  assert.deepEqual(ml.phases.map((p) => p.slug), [
    'your-toolkit', 'math-foundations', 'classical-ml-built-by-you', 'deep-learning-foundations',
    'transformers-and-llms', 'ai-engineering', 'systems-and-scale', 'generative-models-and-reinforcement-learning',
  ]);
});

const sd = read('sd.json');
const sdAnimations = read('sd-animations.json');
const sdTopics = sd.phases.flatMap((p) => p.topics.map((t) => ({ p, t })));

test('System Design: every lesson has its exercises, answers and diagram; designs have their sections', () => {
  assert.ok(sd.phases.length >= 10);
  assert.ok(sdTopics.length >= 72);
  for (const { t } of sdTopics) {
    for (const c of sd.checks) {
      assert.ok(t.practice[c.key], `${t.id}: ${c.key} exercise`);
      assert.ok(t.answers[c.key]?.answer, `${t.id}: ${c.key} answer`);
    }
    assert.ok(t.diagram?.code && t.interviewAnswer && t.followUps.length, `${t.id}: diagram, interview answer, follow-ups`);
    if (t.kind === 'design') assert.ok(t.functional.length && t.design.length && t.evolution.length, `${t.id}: design sections`);
    else assert.ok(t.idea && t.keyPoints.length, `${t.id}: concept sections`);
  }
  // All but the UML class-diagram lesson have an animation.
  assert.ok(sdTopics.filter(({ t }) => sdAnimations[t.id]).length >= sdTopics.length - 1);
});

test('System Design: URLs are unique, saved, and no published lesson has gone missing', () => {
  const urls = new Set(sdTopics.map(({ p, t }) => `/system-design/${p.slug}/${t.slug}/`));
  assert.equal(urls.size, sdTopics.length);
  for (const p of sd.phases) assert.equal(p.slug, slugs.sd.phases[p.id]);
  for (const { t } of sdTopics) assert.equal(t.slug, slugs.sd.topics[t.id]);
  const ids = new Set(sdTopics.map(({ t }) => t.id));
  assert.deepEqual(Object.keys(slugs.sd.topics).filter((id) => !ids.has(id)), []);
});

test("System Design: atomic-hub's page names don't appear on the site", () => {
  // If atomic-hub rewords these lines, update the replacements in src/pages/system-design.js.
  const text = howToStudy.join(' ');
  for (const name of ['ML Foundations', 'Revise mode', 'Learn mode']) assert.ok(!text.includes(name), `"${name}" in the study order`);
  assert.ok(text.includes('/system-design/revise/'), 'links to the revision notes');
});

test('glossary: marks whole words, longest first, first mention only, never inside `code`', () => {
  const terms = [
    { id: 'lr', term: 'learning rate', definition: 'Step size.', matches: ['learning rate'] },
    { id: 'rate', term: 'rate', definition: 'How fast.', matches: ['rate'] },
    { id: 'loss', term: 'loss', definition: 'How wrong.', matches: ['loss'] },
  ];
  const g = createGlossary(terms, [], () => []);
  const { mark, used } = g.marker();
  const html = mark('The learning rate sets the rate; the loss and `loss` and the loss again. Glossary <b>.');
  assert.equal((html.match(/data-term="lr"/g) || []).length, 1);
  assert.equal((html.match(/data-term="rate"/g) || []).length, 1);
  assert.equal((html.match(/data-term="loss"/g) || []).length, 1);
  assert.ok(html.includes('<code>loss</code>'));
  assert.ok(html.includes('&lt;b&gt;'), 'text is escaped');
  assert.deepEqual([...used].sort(), ['loss', 'lr', 'rate']);
  assert.equal(mark('loss'), 'loss', 'a word already marked on the page stays plain');
});

test('paragraphs: a blank line starts a new paragraph, a single newline is a line break', () => {
  assert.equal(paragraphs('one\ntwo\n\nthree'), '<p>one<br>two</p><p>three</p>');
});

const memory = (init = {}) => {
  const data = { ...init };
  return { data, get: (k) => data[k] ?? null, set: (k, v) => { data[k] = v; }, remove: (k) => { delete data[k]; } };
};

test('progress: old single ticks carry over as fully done, then the old list is removed', () => {
  const storage = memory({ 'hp-roadmap-done': JSON.stringify(['math--vectors']) });
  const p = openProgress({ key: 'hp-course-ml', checks: ['explain', 'derive', 'build', 'break'], legacyKey: 'hp-roadmap-done', storage });
  assert.ok(p.isDone('math--vectors'));
  assert.equal(p.doneCount('math'), 1);
  assert.equal(storage.data['hp-roadmap-done'], undefined);
  // opening it again does not re-add anything
  p.toggle('math--vectors', 'build', false);
  const again = openProgress({ key: 'hp-course-ml', checks: ['explain', 'derive', 'build', 'break'], legacyKey: 'hp-roadmap-done', storage });
  assert.deepEqual(again.ticked('math--vectors'), ['explain', 'derive', 'break']);
  assert.equal(again.doneCount(), 0);
});

test('progress: ticking and unticking checks', () => {
  const storage = memory();
  const p = openProgress({ key: 'k', checks: ['a', 'b'], storage });
  p.toggle('x--y', 'b', true);
  p.toggle('x--y', 'a', true);
  assert.deepEqual(p.ticked('x--y'), ['a', 'b'], 'kept in check order');
  assert.ok(p.isDone('x--y'));
  p.toggle('x--y', 'a', false);
  p.toggle('x--y', 'b', false);
  assert.equal(JSON.parse(storage.data.k)['x--y'], undefined, 'an empty topic is removed');
});

// ---- progress backup ----
import { buildBackup, mergeBackup, summary } from '../src/assets/js/lib/backup.js';

const store = (init = {}) => {
  const data = { ...init };
  return { data, keys: () => Object.keys(data), get: (k) => data[k] ?? null, set: (k, v) => { data[k] = v; } };
};

test('backup: collects every course, skips other keys and empty courses', () => {
  const s = store({
    'hp-course-ml': JSON.stringify({ 'math--vectors': ['explain'] }),
    'hp-course-sd': JSON.stringify({}),
    'hp-theme': 'dark',
  });
  const b = buildBackup(s, new Date('2026-11-03T10:00:00Z'));
  assert.equal(b.app, 'hamropedia');
  assert.deepEqual(Object.keys(b.courses), ['ml']);
  assert.equal(b.exported, '2026-11-03T10:00:00.000Z');
  assert.deepEqual(summary(b), [{ course: 'ml', name: 'AI & ML Roadmap', topics: 1 }]);
});

test('backup: loading adds ticks and never removes newer ones', () => {
  const s = store({ 'hp-course-ml': JSON.stringify({ 'math--vectors': ['explain', 'derive'] }) });
  const loaded = mergeBackup(s, {
    app: 'hamropedia', kind: 'progress', version: 1,
    courses: { ml: { 'math--vectors': ['build'], 'math--matrices': ['explain'] }, sd: { 'data--indexing': ['draw'] } },
  });
  assert.deepEqual(JSON.parse(s.data['hp-course-ml']), { 'math--vectors': ['explain', 'derive', 'build'], 'math--matrices': ['explain'] });
  assert.deepEqual(JSON.parse(s.data['hp-course-sd']), { 'data--indexing': ['draw'] });
  assert.deepEqual(loaded.map((x) => [x.course, x.topics]), [['ml', 2], ['sd', 1]]);
});

test('backup: refuses files that are not progress files, and ignores bad entries', () => {
  const s = store();
  assert.throws(() => mergeBackup(s, { hello: 1 }), /not a Hamropedia progress file/);
  assert.throws(() => mergeBackup(s, null), /not a Hamropedia progress file/);
  assert.throws(() => mergeBackup(s, { app: 'hamropedia', kind: 'progress', version: 9, courses: {} }), /newer version/);
  const loaded = mergeBackup(s, {
    app: 'hamropedia', kind: 'progress', version: 1,
    courses: { ml: { 'no-separator': ['x'], 'a--b': 'not a list', 'c--d': [1, 2], 'e--f': ['explain'] }, 'Bad Name!': { 'a--b': ['x'] } },
  });
  assert.deepEqual(JSON.parse(s.data['hp-course-ml']), { 'e--f': ['explain'] });
  assert.equal(s.data['hp-course-Bad Name!'], undefined);
  assert.deepEqual(loaded.map((x) => x.topics), [1]);
});

// ---- SQL ----
import { howToStudy as sqlHowToStudy } from '../src/pages/sql.js';
import { saveQuery, loadQueries, deleteQuery, mergeQueries } from '../src/assets/js/lib/queries.js';

const sqlCourse = read('sql.json');
const sqlTopics = sqlCourse.phases.flatMap((p) => p.topics.map((t) => ({ p, t })));

test('SQL: lessons have worked examples with rows (or an error), problems have a hidden solution', () => {
  assert.ok(sqlCourse.phases.length >= 9);
  assert.ok(sqlTopics.length >= 61);
  const db = read('sql-practice-db.json');
  assert.ok(db.sql.includes('CREATE TABLE'), 'the practice database SQL is there');
  for (const { t } of sqlTopics) {
    for (const c of sqlCourse.checks) assert.ok(t.answers[c.key]?.answer, `${t.id}: ${c.key} answer`);
    const queries = t.kind === 'lesson' ? t.examples : [t.solution, ...(t.alternatives ?? [])];
    assert.ok(queries.length, `${t.id}: at least one query`);
    for (const q of queries) assert.ok(q.sql && (q.result || q.error), `${t.id}: "${q.title}" has rows or an error`);
  }
});

test('SQL: URLs are unique and saved; atomic-hub page names are replaced', () => {
  const urls = new Set(sqlTopics.map(({ p, t }) => `/sql/${p.slug}/${t.slug}/`));
  assert.equal(urls.size, sqlTopics.length);
  for (const { t } of sqlTopics) assert.equal(t.slug, slugs.sql.topics[t.id]);
  const sqlIds = new Set(sqlTopics.map(({ t }) => t.id));
  assert.deepEqual(Object.keys(slugs.sql.topics).filter((id) => !sqlIds.has(id)), [], 'a published SQL lesson has gone missing');
  const text = sqlHowToStudy.join(' ');
  assert.ok(!text.includes('Revise mode'), '"Revise mode" replaced');
  assert.ok(text.includes('/sql/practice-database/') && text.includes('/sql/revise/'));
});

const qstore = () => { const data = {}; return { data, get: (k) => data[k] ?? null, set: (k, v) => { data[k] = v; } }; };

test('saved queries: newest first, the same query in the same box is kept once, delete works', () => {
  const s = qstore();
  const a = saveQuery({ topic: 'joins--x', key: 'practice', place: 'P', sql: 'SELECT 1;' }, s, new Date('2026-11-03T10:00:00Z'));
  saveQuery({ topic: 'joins--x', key: 'practice', place: 'P', sql: 'SELECT 2;' }, s, new Date('2026-11-03T10:01:00Z'));
  saveQuery({ topic: 'joins--x', key: 'practice', place: 'P', sql: 'SELECT 1;  ' }, s, new Date('2026-11-03T10:02:00Z'));
  assert.deepEqual(loadQueries(s).map((q) => q.sql.trim()), ['SELECT 1;', 'SELECT 2;']);
  deleteQuery(loadQueries(s)[0].id, s);
  assert.deepEqual(loadQueries(s).map((q) => q.sql), ['SELECT 2;']);
  assert.ok(a.id);
});

test('saved queries: merging a backup adds only new ones and keeps the newest first', () => {
  const s = qstore();
  saveQuery({ topic: 't--a', key: 'k', place: 'P', sql: 'SELECT 1;' }, s, new Date('2026-11-01T00:00:00Z'));
  const added = mergeQueries([
    { topic: 't--a', key: 'k', place: 'P', sql: 'SELECT 1;', at: '2026-10-01T00:00:00Z' },
    { topic: 't--a', key: 'k', place: 'P', sql: 'SELECT 3;', at: '2026-11-02T00:00:00Z' },
    { nonsense: true },
  ], s);
  assert.equal(added, 1);
  assert.deepEqual(loadQueries(s).map((q) => q.sql), ['SELECT 3;', 'SELECT 1;']);
});

// ---- DSA ----
import { setSolved, rate, reviewsToday, drillSession, drillAnswer, choicesFor, isCorrect, mergeDsa, loadDsa, addDays } from '../src/assets/js/lib/dsa.js';

const dsaCourse = read('dsa.json');
const dsaAll = dsaCourse.phases.flatMap((p) => p.sections.flatMap((s) => s.topics));

test('DSA: 18 topics, 150 problems, every problem has a card and every topic its lesson', () => {
  assert.ok(dsaAll.length >= 18);
  const problems = dsaAll.flatMap((t) => t.problems);
  assert.ok(problems.length >= 150);
  assert.equal(new Set(problems.map((p) => p.id)).size, problems.length, 'problem ids are unique');
  for (const t of dsaAll) {
    assert.ok(t.guide.template && t.guide.easy.rows.length && t.guide.medium.rows.length && t.guide.diagram.code, `${t.id}: guide`);
    assert.equal(t.slug, slugs.dsa.topics[t.id]);
  }
  const dsaIds = new Set(dsaAll.map((t) => t.id));
  assert.deepEqual(Object.keys(slugs.dsa.topics).filter((id) => !dsaIds.has(id)), [], 'a published DSA topic has gone missing');
  for (const p of problems) assert.ok(p.card.summary && p.card.technique && p.card.trick && p.url.startsWith('https://'), `${p.id}: card`);
});

test('DSA reviews: tomorrow first, then 3, 7, 14, 30 days; struggled keeps the gap; couldn\'t starts again', () => {
  const day = '2026-11-03';
  let s = setSolved({ solved: {}, reviews: {} }, 'two-sum', true, day);
  assert.equal(s.reviews['two-sum'].due, '2026-11-04');
  let d = '2026-11-04';
  for (const gap of [3, 7, 14, 30, 30]) {
    s = rate(s, 'two-sum', 'easy', d);
    assert.equal(s.reviews['two-sum'].due, addDays(d, gap));
    d = s.reviews['two-sum'].due;
  }
  s = rate(s, 'two-sum', 'hard', d);
  assert.equal(s.reviews['two-sum'].due, addDays(d, 30), 'struggled: same gap');
  s = rate(s, 'two-sum', 'forgot', d);
  assert.equal(s.reviews['two-sum'].due, addDays(d, 1), "couldn't: back tomorrow");
  // unticking keeps the history; at most three reviews a day, longest overdue first
  s = setSolved(s, 'two-sum', false, d);
  assert.ok(s.reviews['two-sum'] && !s.solved['two-sum']);
  let many = { solved: {}, reviews: {} };
  for (const [id, due] of [['a', '2026-11-01'], ['b', '2026-10-20'], ['c', '2026-11-03'], ['e', '2026-10-25']]) {
    many = setSolved(many, id, true, '2026-10-01');
    many.reviews[id].due = due;
  }
  const r = reviewsToday(many, ['a', 'b', 'c', 'e'], '2026-11-03');
  assert.deepEqual(r.due.map((x) => x.id), ['b', 'e', 'a']);
  assert.equal(r.dueTotal, 4);
});

test('DSA drill: due cards first, then new ones; right moves a box up, wrong back to box 1', () => {
  const order = ['p1', 'p2', 'p3', 'p4'];
  let st = drillAnswer({}, 'p2', true, '2026-11-01');
  assert.deepEqual(st.p2, { box: 1, due: '2026-11-02', reviews: 1, correct: 1 });
  st = drillAnswer(st, 'p2', true, '2026-11-02');
  assert.equal(st.p2.due, '2026-11-05', 'box 2: three days');
  st = drillAnswer(st, 'p2', false, '2026-11-05');
  assert.equal(st.p2.box, 1);
  assert.deepEqual(drillSession(st, order, '2026-11-06', { fresh: 2 }), ['p2', 'p1', 'p3']);
  const prob = { id: 'p1', topic: 'arrays-hashing', alsoAccept: ['two-pointers'] };
  const choices = choicesFor(prob, { 'arrays-hashing': ['two-pointers', 'sliding-window'] }, ['arrays-hashing', 'two-pointers', 'sliding-window', 'stack', 'trees', 'tries']);
  assert.equal(choices.length, 4);
  assert.ok(choices.includes('arrays-hashing') && !choices.includes('two-pointers'), 'never two correct options');
  assert.ok(isCorrect(prob, 'two-pointers'));
});

test('DSA backup: solved problems are added and the review with more history wins', () => {
  const data = {};
  const s = { get: (k) => data[k] ?? null, set: (k, v) => { data[k] = v; } };
  s.set('hp-dsa', JSON.stringify({ solved: { a: '2026-10-01' }, reviews: { a: { step: 2, due: '2026-11-10', reviews: 2 } } }));
  const added = mergeDsa({ solved: { a: '2026-09-01', b: '2026-10-05', bad: 'x' }, reviews: { a: { step: 1, due: '2026-11-01', reviews: 1 }, b: { step: 0, due: '2026-10-06', reviews: 0 } }, drill: { b: { box: 2, due: '2026-11-04', reviews: 2 } } }, s);
  assert.equal(added, 1);
  const st = loadDsa(s);
  assert.deepEqual(st.solved, { a: '2026-09-01', b: '2026-10-05' });
  assert.equal(st.reviews.a.reviews, 2, 'kept the review with more history');
  assert.equal(JSON.parse(data['hp-dsa-drill']).b.box, 2);
});
