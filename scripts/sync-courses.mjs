// Copies the study courses from atomic-hub (where they are written) into
// src/data/courses/, as plain JSON that the site build reads.
//
//   npm run sync-courses                      # atomic-hub next to this repo
//   ATOMIC_HUB=/path/to/atomic-hub npm run sync-courses
//
// Run it locally after changing a course in atomic-hub, then commit the JSON.
// The build (and GitHub Actions) never needs atomic-hub: only these files.
//
// Only course content is copied: lessons, answers, animations and glossaries.
// Nothing from atomic-hub's sign-in, Firebase, .env or personal pages.
//
// URLs never change once published: every phase and topic id gets a slug the
// first time it is seen, kept in src/data/courses/slugs.json and reused after,
// so renaming a topic in atomic-hub keeps its address on hamropedia.com.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { slugify } from '../src/lib/util.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/data/courses');
const AH = path.resolve(process.env.ATOMIC_HUB || path.join(ROOT, '../../atomic-hub'));
const SRC = path.join(AH, 'src');
const ESBUILD = path.join(AH, 'node_modules/.bin/esbuild');

const fail = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};
if (!fs.existsSync(path.join(SRC, 'data/foundations.ts'))) fail(`atomic-hub not found at ${AH} (set ATOMIC_HUB)`);
if (!fs.existsSync(ESBUILD)) fail(`esbuild missing in atomic-hub: run npm install in ${AH}`);

// ---------------------------------------------------------------------------
// 1. Bundle the course modules with atomic-hub's own esbuild and load them.

const mod = (p) => JSON.stringify(path.join(SRC, p));
const entry = `
import * as ml from ${mod('data/foundations')};
import { foundationAnswers } from ${mod('data/foundationsAnswers/index')};
import { foundationAnimations } from ${mod('data/foundationsAnimations/index')};
import { foundationsGlossaryTerms } from ${mod('data/foundationsGlossary')};
import * as sd from ${mod('data/systemDesign')};
import { systemDesignAnswers } from ${mod('data/systemDesignAnswers/index')};
import { systemDesignAnimations, systemDesignNoAnimation } from ${mod('data/systemDesignAnimations/index')};
import { glossaryTerms as systemDesignGlossaryTerms } from ${mod('data/systemDesignGlossary')};
import * as sqlc from ${mod('data/sql')};
import { sqlAnswers } from ${mod('data/sqlAnswers/index')};
import { sqlAnimations, sqlNoAnimation } from ${mod('data/sqlAnimations/index')};
import { sqlGlossaryTerms } from ${mod('data/sqlGlossary')};
import * as sqlDb from ${mod('data/sqlPracticeDb')};
import { dsaCurriculum } from ${mod('data/dsaCurriculum')};
import { getTopicContent } from ${mod('data/dsaContent')};
import { dsaPatternGuides } from ${mod('data/dsaPatterns')};
import { dsaProblemCards } from ${mod('data/dsaProblemCards')};
import { patternFinders, recognitionQuestions, lookAlikeTopics } from ${mod('data/dsaRecognition')};
import { mergedMistakes } from ${mod('data/dsaMistakeOverlaps')};
import { dsaAnimations } from ${mod('data/dsaAnimations/index')};

// DSA content behind functions: call them for every topic, here, so nothing is lost.
const dsaTopicIds = dsaCurriculum.flatMap((p) => p.sections.flatMap((s) => s.topics.map((t) => t.id)));
const dsaContent = Object.fromEntries(dsaTopicIds.map((id) => {
  const content = getTopicContent(id);
  const guide = dsaPatternGuides[id];
  return [id, { content, guide, mistakes: guide ? mergedMistakes(id, guide.mistakes, content?.commonMistakes ?? []) : [] }];
}));

const run = (registry) => Object.fromEntries(Object.entries(registry).map(([id, make]) => [id, make()]));

export default {
  ml: {
    phases: ml.foundationPhases,
    checkKeys: ml.CHECK_KEYS,
    checkLabels: ml.CHECK_LABELS,
    checkMeanings: ml.CHECK_MEANINGS,
    checkExamples: ml.CHECK_EXAMPLES,
    confidentRule: ml.CONFIDENT_RULE,
    loop: ml.topicLoop,
    rules: ml.foundationRules,
    answers: foundationAnswers,
    animations: run(foundationAnimations),
    glossary: foundationsGlossaryTerms,
  },
  sd: {
    phases: sd.systemDesignPhases,
    checkKeys: sd.SD_CHECK_KEYS,
    checkLabels: sd.SD_CHECK_LABELS,
    checkMeanings: sd.SD_CHECK_MEANINGS,
    confidentRule: sd.SD_CONFIDENT_RULE,
    priorityLabels: sd.SD_PRIORITY_LABELS,
    howToStudy: sd.sdHowToStudy,
    answers: systemDesignAnswers,
    animations: run(systemDesignAnimations),
    noAnimation: systemDesignNoAnimation,
    glossary: systemDesignGlossaryTerms,
  },
  sql: {
    phases: sqlc.sqlPhases,
    checkKeys: sqlc.SQL_CHECK_KEYS,
    checkLabels: sqlc.SQL_CHECK_LABELS,
    checkMeanings: sqlc.SQL_CHECK_MEANINGS,
    confidentRule: sqlc.SQL_CONFIDENT_RULE,
    priorityLabels: sqlc.SQL_PRIORITY_LABELS,
    difficultyLabels: sqlc.SQL_DIFFICULTY_LABELS,
    howToStudy: sqlc.sqlHowToStudy,
    cheatSheet: sqlc.sqlCheatSheet,
    practice: { tables: sqlDb.practiceTables, sql: sqlDb.practiceDbSql, diagram: sqlDb.practiceDbDiagram },
    answers: sqlAnswers,
    animations: run(sqlAnimations),
    noAnimation: sqlNoAnimation,
    glossary: sqlGlossaryTerms,
  },
  dsa: {
    curriculum: dsaCurriculum,
    topics: dsaContent,
    cards: dsaProblemCards,
    finders: patternFinders,
    questions: recognitionQuestions,
    lookAlikes: lookAlikeTopics,
    animations: run(dsaAnimations),
  },
};
`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hamropedia-sync-'));
const entryFile = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'courses.mjs');
fs.writeFileSync(entryFile, entry);
const built = spawnSync(ESBUILD, [entryFile, '--bundle', '--platform=node', '--format=esm', `--outfile=${bundle}`, '--log-level=error'], {
  cwd: AH,
  encoding: 'utf8',
});
if (built.status !== 0) fail(`esbuild failed:\n${built.stderr}`);
const source = (await import(pathToFileURL(bundle).href)).default;
fs.rmSync(tmp, { recursive: true, force: true });

// ---------------------------------------------------------------------------
// 2. Helpers

/** JSON with no functions (they would be lost silently) and short numbers. */
const toJson = (value, label) =>
  JSON.stringify(value, (key, v) => {
    if (typeof v === 'function') fail(`${label}: "${key}" is a function, so its content would be lost`);
    if (typeof v === 'number' && !Number.isInteger(v)) return Math.round(v * 100) / 100;
    return v;
  });

const write = (file, json) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, json + '\n');
  return `${path.relative(ROOT, file)} (${Math.round(json.length / 1024)} KB)`;
};

const slugsFile = path.join(OUT, 'slugs.json');
const slugs = fs.existsSync(slugsFile) ? JSON.parse(fs.readFileSync(slugsFile, 'utf8')) : {};

/** A slug for this id: the saved one, or a new one that no sibling uses yet. */
function slugFor(map, id, name, taken) {
  if (map[id]) return map[id];
  let s = slugify(name) || id;
  let n = 2;
  while (taken.has(s)) s = `${slugify(name)}-${n++}`;
  map[id] = s;
  return s;
}

// ---------------------------------------------------------------------------
// 3. ML & AI roadmap (atomic-hub: ML Foundations)

function syncMl(ml) {
  const map = (slugs.ml ??= { phases: {}, topics: {} });
  // The roadmap went live before this sync existed; its phase slugs came from
  // the phase titles, so seed them that way on the very first run.
  ml.phases.forEach((p) => slugFor(map.phases, p.id, p.title, new Set(Object.values(map.phases))));

  const keys = ml.checkKeys;
  const phases = ml.phases.map((p) => {
    const phaseSlug = map.phases[p.id];
    const taken = new Set(p.topics.map((t) => map.topics[t.id]).filter(Boolean));
    return {
      id: p.id,
      slug: phaseSlug,
      number: p.number,
      short: p.short,
      title: p.title,
      goal: p.goal,
      bigPicture: p.bigPicture,
      main: p.main,
      deeper: p.deeper,
      builds: p.builds,
      ready: p.ready,
      topics: p.topics.map((t) => {
        const slug = slugFor(map.topics, t.id, t.name, taken);
        taken.add(slug);
        const answers = ml.answers[t.id];
        for (const k of keys) {
          if (!t.practice?.[k]) fail(`ML ${t.id}: no "${k}" exercise`);
          if (!answers?.[k]?.answer) fail(`ML ${t.id}: no answer for the "${k}" exercise`);
        }
        if (!ml.animations[t.id]) fail(`ML ${t.id}: no animation`);
        return { ...t, slug, answers };
      }),
    };
  });

  const topics = phases.flatMap((p) => p.topics);
  const ids = new Set(topics.map((t) => t.id));
  const strayAnimations = Object.keys(ml.animations).filter((id) => !ids.has(id));
  if (strayAnimations.length) fail(`ML animations for unknown topics: ${strayAnimations.join(', ')}`);

  const course = {
    checks: keys.map((k) => ({ key: k, label: ml.checkLabels[k], meaning: ml.checkMeanings[k], example: ml.checkExamples[k] })),
    confidentRule: ml.confidentRule,
    loop: ml.loop,
    rules: ml.rules,
    phases,
    glossary: ml.glossary,
  };
  const frames = Object.values(ml.animations).reduce((n, a) => n + a.variants.reduce((m, v) => m + v.frames.length, 0), 0);
  return {
    files: [
      write(path.join(OUT, 'ml.json'), toJson(course, 'ML course')),
      write(path.join(OUT, 'ml-animations.json'), toJson(ml.animations, 'ML animations')),
    ],
    summary: `ML & AI: ${phases.length} phases, ${topics.length} topics, ${topics.length * keys.length} exercises with answers, ${Object.keys(ml.animations).length} animations (${frames} frames), ${ml.glossary.length} glossary words`,
  };
}

// ---------------------------------------------------------------------------
// 4. System Design

function syncSd(sd) {
  const map = (slugs.sd ??= { phases: {}, topics: {} });
  // Short phase names make short URLs: /system-design/core-concepts/caching/.
  sd.phases.forEach((p) => slugFor(map.phases, p.id, p.short, new Set(Object.values(map.phases))));
  const keys = sd.checkKeys;
  const phases = sd.phases.map((p) => {
    const taken = new Set(p.topics.map((t) => map.topics[t.id]).filter(Boolean));
    return {
      id: p.id,
      slug: map.phases[p.id],
      number: p.number,
      short: p.short,
      title: p.title,
      goal: p.goal,
      bigPicture: p.bigPicture,
      topics: p.topics.map((t) => {
        const slug = slugFor(map.topics, t.id, t.name, taken);
        taken.add(slug);
        const answers = sd.answers[t.id];
        for (const k of keys) {
          if (!t.practice?.[k]) fail(`System Design ${t.id}: no "${k}" exercise`);
          if (!answers?.[k]?.answer) fail(`System Design ${t.id}: no answer for the "${k}" exercise`);
        }
        if (!sd.animations[t.id] && !sd.noAnimation[t.id]) fail(`System Design ${t.id}: no animation (and not listed as having none)`);
        return { ...t, slug, answers };
      }),
    };
  });
  const topics = phases.flatMap((p) => p.topics);
  const ids = new Set(topics.map((t) => t.id));
  const stray = Object.keys(sd.animations).filter((id) => !ids.has(id));
  if (stray.length) fail(`System Design animations for unknown topics: ${stray.join(', ')}`);

  const course = {
    checks: keys.map((k) => ({ key: k, label: sd.checkLabels[k], meaning: sd.checkMeanings[k] })),
    confidentRule: sd.confidentRule,
    priorityLabels: sd.priorityLabels,
    howToStudy: sd.howToStudy,
    phases,
    glossary: sd.glossary,
  };
  const frames = Object.values(sd.animations).reduce((n, a) => n + a.variants.reduce((m, v) => m + v.frames.length, 0), 0);
  return {
    files: [
      write(path.join(OUT, 'sd.json'), toJson(course, 'System Design course')),
      write(path.join(OUT, 'sd-animations.json'), toJson(sd.animations, 'System Design animations')),
    ],
    summary: `System Design: ${phases.length} phases, ${topics.length} topics (${topics.filter((t) => t.kind === 'design').length} full designs), ${topics.length * keys.length} exercises with answers, ${Object.keys(sd.animations).length} animations (${frames} frames), ${sd.glossary.length} glossary words`,
  };
}

// ---------------------------------------------------------------------------
// 5. SQL

function syncSql(sql) {
  const map = (slugs.sql ??= { phases: {}, topics: {} });
  sql.phases.forEach((p) => slugFor(map.phases, p.id, p.short, new Set(Object.values(map.phases))));
  const keys = sql.checkKeys;
  const phases = sql.phases.map((p) => {
    const taken = new Set(p.topics.map((t) => map.topics[t.id]).filter(Boolean));
    return {
      id: p.id,
      slug: map.phases[p.id],
      number: p.number,
      short: p.short,
      title: p.title,
      goal: p.goal,
      bigPicture: p.bigPicture,
      topics: p.topics.map((t) => {
        const slug = slugFor(map.topics, t.id, t.name, taken);
        taken.add(slug);
        const answers = sql.answers[t.id];
        for (const k of keys) {
          if (!t.practice?.[k]) fail(`SQL ${t.id}: no "${k}" exercise`);
          if (!answers?.[k]?.answer) fail(`SQL ${t.id}: no answer for the "${k}" exercise`);
        }
        if (t.kind === 'problem' && !t.solution?.result) fail(`SQL ${t.id}: no solution rows`);
        if (!sql.animations[t.id] && !sql.noAnimation[t.id]) fail(`SQL ${t.id}: no animation (and not listed as having none)`);
        return { ...t, slug, answers };
      }),
    };
  });
  const topics = phases.flatMap((p) => p.topics);
  const ids = new Set(topics.map((t) => t.id));
  const stray = Object.keys(sql.animations).filter((id) => !ids.has(id));
  if (stray.length) fail(`SQL animations for unknown topics: ${stray.join(', ')}`);
  if (!sql.practice.sql || sql.practice.tables.length < 1) fail('SQL: the practice database is missing');

  const course = {
    checks: keys.map((k) => ({ key: k, label: sql.checkLabels[k], meaning: sql.checkMeanings[k] })),
    confidentRule: sql.confidentRule,
    priorityLabels: sql.priorityLabels,
    difficultyLabels: sql.difficultyLabels,
    howToStudy: sql.howToStudy,
    cheatSheet: sql.cheatSheet,
    practice: { tables: sql.practice.tables, diagram: sql.practice.diagram },
    phases,
    glossary: sql.glossary,
  };
  const examples = topics.reduce((n, t) => n + (t.examples?.length || 0) + (t.solution ? 1 + (t.alternatives?.length || 0) : 0), 0);
  return {
    files: [
      write(path.join(OUT, 'sql.json'), toJson(course, 'SQL course')),
      write(path.join(OUT, 'sql-animations.json'), toJson(sql.animations, 'SQL animations')),
      // The practice database, as the SQL that builds it: the runner loads it on the first Run.
      write(path.join(OUT, 'sql-practice-db.json'), JSON.stringify({ sql: sql.practice.sql })),
    ],
    summary: `SQL: ${phases.length} phases, ${topics.length} topics (${topics.filter((t) => t.kind === 'problem').length} interview problems), ${examples} worked queries with their rows, ${topics.length * keys.length} exercises with answers, ${Object.keys(sql.animations).length} animations, ${sql.practice.tables.length} practice tables, ${sql.glossary.length} glossary words`,
  };
}

// ---------------------------------------------------------------------------
// 6. DSA (the NeetCode 150, taught one pattern per topic)

function syncDsa(dsa) {
  const map = (slugs.dsa ??= { topics: {} });
  const taken = new Set(Object.values(map.topics));
  let n = 0;
  const phases = dsa.curriculum.map((p) => ({
    id: p.id,
    title: p.title,
    sections: p.sections.map((s) => ({
      id: s.id,
      title: s.title,
      topics: s.topics.map((t) => {
        const slug = slugFor(map.topics, t.id, t.id, taken);
        taken.add(slug);
        const { content, guide, mistakes } = dsa.topics[t.id] ?? {};
        if (!content) fail(`DSA ${t.id}: no lesson content`);
        if (!guide) fail(`DSA ${t.id}: no pattern guide`);
        if (!dsa.animations[t.id]) fail(`DSA ${t.id}: no animation`);
        // Each problem's difficulty, from the lesson's own lists (matched by title, as atomic-hub does).
        const difficulty = new Map();
        const leetcode = new Map();
        for (const level of ['easy', 'medium', 'hard']) {
          for (const item of content.practiceProblems?.[level] ?? []) {
            difficulty.set(item.title, level);
            if (item.leetcodeNum) leetcode.set(item.title, item.leetcodeNum);
          }
        }
        const problems = t.problems.map((pr) => {
          const card = dsa.cards[pr.id];
          if (!card) fail(`DSA ${pr.id}: no problem card`);
          n++;
          return { ...pr, difficulty: difficulty.get(pr.title) || null, leetcodeNum: leetcode.get(pr.title) || null, card };
        });
        return { id: t.id, slug, number: t.number, title: t.title, description: t.description, problems, content, guide, mistakes };
      }),
    })),
  }));
  const topics = phases.flatMap((p) => p.sections.flatMap((s) => s.topics));
  const ids = new Set(topics.map((t) => t.id));
  const stray = Object.keys(dsa.animations).filter((id) => !ids.has(id));
  if (stray.length) fail(`DSA animations for unknown topics: ${stray.join(', ')}`);

  const course = { phases, finders: dsa.finders, questions: dsa.questions, lookAlikes: dsa.lookAlikes };
  return {
    files: [
      write(path.join(OUT, 'dsa.json'), toJson(course, 'DSA course')),
      write(path.join(OUT, 'dsa-animations.json'), toJson(dsa.animations, 'DSA animations')),
    ],
    summary: `DSA: ${topics.length} topics, ${n} problems with question-and-answer cards, ${Object.keys(dsa.animations).length} animations, ${dsa.finders.length} pattern finders`,
  };
}

// ---------------------------------------------------------------------------

const results = [syncMl(source.ml), syncSd(source.sd), syncSql(source.sql), syncDsa(source.dsa)];
fs.writeFileSync(slugsFile, JSON.stringify(slugs, null, 2) + '\n');
for (const r of results) {
  console.log(`✔ ${r.summary}`);
  for (const f of r.files) console.log(`    ${f}`);
}
console.log(`    ${path.relative(ROOT, slugsFile)}`);
