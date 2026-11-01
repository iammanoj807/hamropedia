// One-off: turn the AtomicHub ML Foundations export into public roadmap data.
// Usage: node scripts/build-roadmap-data.mjs <roadmap_raw.json> src/data/roadmap.json
// Keeps ONLY phases, topic names and resource links. No lessons, answers or practice.
import fs from 'node:fs';

const [, , input, output] = process.argv;
const phases = JSON.parse(fs.readFileSync(input, 'utf8'));

const exact = new Map([
  ['You have already started this. Finish it.', 'The best visual start to linear algebra. Watch the chapters in order.'],
  ['Your main written text for this phase. Chapters 2 to 7.', 'The main written text for this phase. Chapters 2 to 7.'],
  ['The classic course. Good for PhD-level depth.', 'The classic university course, for extra depth.'],
  ['Probability done properly, with a free book. Strong preparation for a PhD.', 'Probability done properly, with a free book.'],
  ['A deep reference for PhD-level understanding.', 'A deep reference for going further.'],
  ['Builds everything from scratch in Python. The best fit for how you learn. Code along, then rebuild without the video.', 'Builds everything from scratch in Python. Code along, then rebuild it without the video.'],
  ['Your main deep learning text. Very clear figures, with practice notebooks.', 'The main deep learning text for this phase. Very clear figures, with practice notebooks.'],
  ['PhD-level depth, written very carefully.', 'Advanced depth, written very carefully.'],
  ['The university course. Good depth for a PhD.', 'The full university course, for depth.'],
  ['You are already reading it. Keep going. It is the main text for this phase.', 'The main text for this phase.'],
]);

// Links that moved or died since AtomicHub was written.
const urlFix = new Map([
  ['https://www.labri.fr/perso/nrougier/from-python-to-numpy/', 'https://github.com/rougier/from-python-to-numpy'],
]);
const fixUrl = (u) => (u && urlFix.has(u) ? urlFix.get(u) : u);

const tidy = (s) => {
  if (!s) return s;
  if (exact.has(s)) return exact.get(s);
  return s
    .replace(/Exactly this lesson, in moving pictures\./g, 'This topic, in moving pictures.')
    .replace(/a visual version of this whole lesson/gi, 'A visual version of this whole topic')
    .replace(/this lesson/g, 'this topic')
    .replace(/the lessons/g, 'the topics')
    .replace(/of a lesson/g, 'of a topic')
    .replace(/the 17% answer/g, 'the classic medical-test puzzle')
    .replace(/exactly what you need for the build exercise/g, 'exactly what you need to build your own');
};

const out = phases.map((p) => ({
  number: p.number,
  short: p.short,
  title: p.title,
  slug: p.slug,
  accent: p.accent,
  goal: tidy(p.goal),
  bigPicture: tidy(p.bigPicture),
  main: p.main.map((r) => ({ ...r, url: fixUrl(r.url), why: tidy(r.why) })),
  deeper: p.deeper.map((r) => ({ ...r, url: fixUrl(r.url), why: tidy(r.why) })),
  topics: p.topics.map((t) => ({
    name: t.name,
    resources: t.resources.map((r) => ({ ...r, url: fixUrl(r.url), recommended: tidy(r.recommended) })),
  })),
}));

fs.writeFileSync(output, JSON.stringify(out, null, 1) + '\n');
const n = out.reduce((a, p) => a + p.topics.length, 0);
const r = out.reduce((a, p) => a + p.main.length + p.deeper.length + p.topics.reduce((b, t) => b + t.resources.length, 0), 0);
console.log(`${out.length} phases, ${n} topics, ${r} resources -> ${output}`);
