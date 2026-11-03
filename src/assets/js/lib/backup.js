// Progress backup: every course's ticks in one small file, so a reader can keep
// them safe or carry on on another device, without an account. Nothing is sent
// anywhere: the file is made and read in the browser.
//
// The file: { app: "hamropedia", kind: "progress", version: 1, exported, courses: { ml: {...}, sd: {...} }, sqlQueries? }
// where each course maps "<phase-slug>--<topic-slug>" to the ticked checks, and
// sqlQueries is the list of saved SQL queries (lib/queries.js), and dsa holds the
// solved NeetCode problems, their review dates and the pattern drill (lib/dsa.js).
import { loadQueries, mergeQueries } from './queries.js';
import { loadDsa, loadDrill, mergeDsa } from './dsa.js';

const PREFIX = 'hp-course-';
const NAMES = { ml: 'AI & ML Roadmap', sd: 'System Design', sql: 'SQL', dsa: 'DSA' };
const courseName = (key) => NAMES[key] || key;

/** Every course's progress found in storage (storage: { keys(), get(k) }). */
export function buildBackup(storage, now = new Date()) {
  const courses = {};
  for (const key of storage.keys()) {
    if (!key.startsWith(PREFIX)) continue;
    try {
      const value = JSON.parse(storage.get(key) || '{}');
      if (value && typeof value === 'object' && Object.keys(value).length) courses[key.slice(PREFIX.length)] = value;
    } catch { /* skip a damaged entry */ }
  }
  const backup = { app: 'hamropedia', kind: 'progress', version: 1, exported: now.toISOString(), courses };
  const queries = loadQueries(storage);
  if (queries.length) backup.sqlQueries = queries;
  const dsa = loadDsa(storage);
  const drill = loadDrill(storage);
  if (Object.keys(dsa.solved).length || Object.keys(drill).length) backup.dsa = { ...dsa, drill };
  return backup;
}

/** Is a topic's entry a list of check names? */
const validTicks = (v) => Array.isArray(v) && v.every((c) => typeof c === 'string' && c.length < 40);

/**
 * Merge a backup into storage: ticks are added, never removed, so loading an
 * older file can't undo newer progress. Returns what was loaded, per course.
 * Throws an Error with a reader-friendly message if the file isn't a backup.
 */
export function mergeBackup(storage, data) {
  if (!data || data.app !== 'hamropedia' || data.kind !== 'progress' || typeof data.courses !== 'object') {
    throw new Error('This file is not a Hamropedia progress file.');
  }
  if (data.version > 1) throw new Error('This progress file is from a newer version of the site. Reload the page and try again.');
  const loaded = [];
  for (const [course, topics] of Object.entries(data.courses)) {
    if (!/^[a-z0-9-]{1,20}$/.test(course) || !topics || typeof topics !== 'object') continue;
    let current = {};
    try { current = JSON.parse(storage.get(PREFIX + course) || '{}') || {}; } catch { current = {}; }
    let count = 0;
    for (const [topic, ticks] of Object.entries(topics)) {
      if (!/^[a-z0-9-]+--[a-z0-9-]+$/.test(topic) || !validTicks(ticks) || !ticks.length) continue;
      const merged = [...new Set([...(Array.isArray(current[topic]) ? current[topic] : []), ...ticks])];
      current[topic] = merged;
      count++;
    }
    if (count) {
      storage.set(PREFIX + course, JSON.stringify(current));
      loaded.push({ course, name: courseName(course), topics: count });
    }
  }
  if (data.sqlQueries) {
    const added = mergeQueries(data.sqlQueries, storage);
    if (added) loaded.push({ course: 'sql-queries', name: 'saved SQL queries', queries: added });
  }
  if (data.dsa) {
    const solved = mergeDsa(data.dsa, storage);
    if (solved || Object.keys(data.dsa.drill ?? {}).length) loaded.push({ course: 'dsa', name: 'DSA', solved });
  }
  return loaded;
}

/** Topics with at least one tick, per course, for "what's in this browser". */
export function summary(backup) {
  const list = Object.entries(backup.courses).map(([course, topics]) => ({ course, name: courseName(course), topics: Object.keys(topics).length }));
  if (backup.sqlQueries?.length) list.push({ course: 'sql-queries', name: 'saved SQL queries', queries: backup.sqlQueries.length });
  if (backup.dsa) list.push({ course: 'dsa', name: 'DSA', solved: Object.keys(backup.dsa.solved).length });
  return list;
}

/** "3 topics in SQL and 5 saved SQL queries". */
export const describe = (list) =>
  list
    .map((x) =>
      x.queries !== undefined ? `${x.queries} saved SQL ${x.queries === 1 ? 'query' : 'queries'}`
        : x.solved !== undefined ? `${x.solved} solved DSA ${x.solved === 1 ? 'problem' : 'problems'} (with review dates)`
          : `${x.topics} ${x.topics === 1 ? 'topic' : 'topics'} in ${x.name}`)
    .join(' and ');
