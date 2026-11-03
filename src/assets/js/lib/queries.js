// Saved SQL queries: every query a reader changes and runs, kept in this browser
// with the topic and the box it was run in. Newest first, at most MAX.

export const QUERIES_KEY = 'hp-sql-queries';
const MAX = 500;

const defaultStorage = () => ({
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* not saved */ } },
});

/** A saved query looks right: short strings in the fields that matter. */
export const validQuery = (q) =>
  q && typeof q === 'object' && typeof q.sql === 'string' && q.sql.length <= 20000 && typeof q.topic === 'string' && typeof q.key === 'string' && typeof q.at === 'string';

export function loadQueries(storage = defaultStorage()) {
  try {
    const list = JSON.parse(storage.get(QUERIES_KEY) || '[]');
    return Array.isArray(list) ? list.filter(validQuery) : [];
  } catch {
    return [];
  }
}

const store = (list, storage) => storage.set(QUERIES_KEY, JSON.stringify(list.slice(0, MAX)));
const same = (a, b) => a.topic === b.topic && a.key === b.key && a.sql.trim() === b.sql.trim();

/** Save a run. Running the same query again in the same box only moves it to the top. */
export function saveQuery(q, storage = defaultStorage(), now = new Date()) {
  const entry = { ...q, at: now.toISOString() };
  entry.id = q.id || `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const list = loadQueries(storage).filter((x) => !same(x, entry));
  store([entry, ...list], storage);
  return entry;
}

export function deleteQuery(id, storage = defaultStorage()) {
  store(loadQueries(storage).filter((q) => q.id !== id), storage);
}

/** Add queries from a backup; ones already saved (same box, same SQL) are skipped. Returns how many were added. */
export function mergeQueries(incoming, storage = defaultStorage()) {
  const list = loadQueries(storage);
  let added = 0;
  for (const q of Array.isArray(incoming) ? incoming : []) {
    if (!validQuery(q) || list.some((x) => same(x, q))) continue;
    list.push({ ...q, id: q.id || `${Date.parse(q.at).toString(36)}-${added}` });
    added++;
  }
  list.sort((a, b) => b.at.localeCompare(a.at));
  store(list, storage);
  return added;
}
