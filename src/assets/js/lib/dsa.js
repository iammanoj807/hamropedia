// DSA progress, kept in this browser: which NeetCode problems are solved, when
// each comes back for review, and the "Which pattern?" drill. The rules are
// atomic-hub's (utils/dsaReview.ts and utils/patternDrill.ts):
//
// - A problem ticked solved comes back the next day. Solved again on your own,
//   the gap grows: 1, 3, 7, 14, then 30 days, and every 30 days after that.
//   "Struggled" keeps the same gap; "Couldn't" starts again tomorrow.
//   At most three reviews a day, longest overdue first.
// - The drill: read a problem, pick its pattern. Right moves the card up a box
//   (1, 3, 7, 14, 30 days); wrong sends it back to box 1, tomorrow.

export const DSA_KEY = 'hp-dsa';
export const DRILL_KEY = 'hp-dsa-drill';
export const GAPS = [1, 3, 7, 14, 30];
export const DAILY_REVIEWS = 3;

/** Today as YYYY-MM-DD, in the reader's own time zone. */
export const todayLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (date, days) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
export const daysBetween = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

const defaultStorage = () => ({
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* not saved */ } },
});
const read = (storage, key, fallback) => {
  try { const v = JSON.parse(storage.get(key) || 'null'); return v && typeof v === 'object' ? v : fallback; } catch { return fallback; }
};

// ---- solved problems and their reviews -------------------------------------------

/** { solved: { problemId: 'YYYY-MM-DD' }, reviews: { problemId: { step, due, reviews, last?, reviewedOn? } } } */
export function loadDsa(storage = defaultStorage()) {
  const s = read(storage, DSA_KEY, {});
  return { solved: s.solved && typeof s.solved === 'object' ? s.solved : {}, reviews: s.reviews && typeof s.reviews === 'object' ? s.reviews : {} };
}
export const saveDsa = (state, storage = defaultStorage()) => storage.set(DSA_KEY, JSON.stringify(state));

/** Tick or untick a problem. A first tick schedules its first review for tomorrow; unticking keeps the review history. */
export function setSolved(state, id, on, today) {
  const solved = { ...state.solved };
  const reviews = { ...state.reviews };
  if (on) {
    solved[id] = solved[id] || today;
    if (!reviews[id]) reviews[id] = { step: 0, due: addDays(today, GAPS[0]), reviews: 0 };
  } else {
    delete solved[id];
  }
  return { solved, reviews };
}

const nextStep = (step, rating) => (rating === 'easy' ? Math.min(step + 1, GAPS.length - 1) : rating === 'hard' ? step : 0);
/** Days until the next review after this rating. */
export const gapAfter = (review, rating) => GAPS[nextStep(review.step, rating)];

/** Record a review: 'easy' (solved it), 'hard' (struggled) or 'forgot' (couldn't). */
export function rate(state, id, rating, today) {
  const old = state.reviews[id] ?? { step: 0, due: today, reviews: 0 };
  const step = nextStep(old.step, rating);
  return { ...state, reviews: { ...state.reviews, [id]: { step, due: addDays(today, GAPS[step]), reviews: old.reviews + 1, last: rating, reviewedOn: today } } };
}

/**
 * Today's reviews: solved problems due by today, longest overdue first, then the
 * lowest rung, then course order; at most DAILY_REVIEWS minus those done today.
 * `order` is every problem id in course order.
 */
export function reviewsToday(state, order, today) {
  const items = order.filter((id) => state.solved[id]).map((id) => ({ id, review: state.reviews[id] ?? { step: 0, due: today, reviews: 0 } }));
  const doneToday = items.filter((x) => x.review.reviewedOn === today).length;
  const due = items
    .filter((x) => x.review.due <= today)
    .sort((a, b) => a.review.due.localeCompare(b.review.due) || a.review.step - b.review.step);
  const upcoming = items.map((x) => x.review.due).filter((d) => d > today).sort();
  return {
    due: due.slice(0, Math.max(0, DAILY_REVIEWS - doneToday)),
    dueTotal: due.length,
    doneToday,
    next: upcoming.length ? { date: upcoming[0], count: upcoming.filter((d) => d === upcoming[0]).length } : null,
    monthly: items.filter((x) => x.review.step === GAPS.length - 1).length,
  };
}

// ---- the "Which pattern?" drill ----------------------------------------------------

export const loadDrill = (storage = defaultStorage()) => read(storage, DRILL_KEY, {});
export const saveDrill = (state, storage = defaultStorage()) => storage.set(DRILL_KEY, JSON.stringify(state));

/** Today's session: due cards first (oldest, then lowest box), then up to `fresh` new ones, at most `max`. */
export function drillSession(state, order, today, { max = 15, fresh = 5 } = {}) {
  const known = new Set(order);
  const due = Object.entries(state)
    .filter(([id, c]) => known.has(id) && c.due <= today)
    .sort(([, a], [, b]) => a.due.localeCompare(b.due) || a.box - b.box)
    .map(([id]) => id)
    .slice(0, max);
  const unseen = order.filter((id) => !state[id]).slice(0, Math.max(0, Math.min(fresh, max - due.length)));
  return [...due, ...unseen];
}

export function drillAnswer(state, id, correct, today) {
  const old = state[id];
  const box = correct ? Math.min((old?.box ?? 0) + 1, GAPS.length) : 1;
  return { ...state, [id]: { box, due: addDays(today, correct ? GAPS[box - 1] : 1), reviews: (old?.reviews ?? 0) + 1, correct: (old?.correct ?? 0) + (correct ? 1 : 0) } };
}

const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const hash = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 2147483647, 7);

/**
 * Four answer options (topic ids): the right topic, its look-alikes first (the
 * confusions worth practising), then others. Never two correct options.
 * problem: { id, topic, alsoAccept? }; lookAlikes: topic id -> topic ids; topics: every topic id.
 */
export function choicesFor(problem, lookAlikes, topics, count = 4) {
  const random = seeded(hash(problem.id));
  const correct = (t) => t === problem.topic || (problem.alsoAccept ?? []).includes(t);
  const similar = (lookAlikes[problem.topic] ?? []).filter((t) => !correct(t));
  const others = topics.filter((t) => !correct(t) && !similar.includes(t)).sort(() => random() - 0.5);
  return [problem.topic, ...[...similar, ...others].slice(0, count - 1)].sort(() => random() - 0.5);
}
export const isCorrect = (problem, topic) => topic === problem.topic || (problem.alsoAccept ?? []).includes(topic);

// ---- backup -------------------------------------------------------------------------

/** Merge DSA progress from a backup: solved problems are added, and each review keeps whichever has more history. */
export function mergeDsa(incoming, storage = defaultStorage()) {
  if (!incoming || typeof incoming !== 'object') return 0;
  const state = loadDsa(storage);
  let added = 0;
  for (const [id, date] of Object.entries(incoming.solved ?? {})) {
    if (typeof id !== 'string' || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!state.solved[id]) added++;
    state.solved[id] = state.solved[id] && state.solved[id] < date ? state.solved[id] : date;
  }
  for (const [id, r] of Object.entries(incoming.reviews ?? {})) {
    if (!r || typeof r.due !== 'string' || typeof r.step !== 'number' || typeof r.reviews !== 'number') continue;
    const mine = state.reviews[id];
    if (!mine || r.reviews > mine.reviews || (r.reviews === mine.reviews && (r.reviewedOn || '') > (mine.reviewedOn || ''))) state.reviews[id] = r;
  }
  saveDsa(state, storage);
  const drill = loadDrill(storage);
  for (const [id, c] of Object.entries(incoming.drill ?? {})) {
    if (!c || typeof c.box !== 'number' || typeof c.due !== 'string') continue;
    if (!drill[id] || (c.reviews ?? 0) > (drill[id].reviews ?? 0)) drill[id] = c;
  }
  saveDrill(drill, storage);
  return added;
}
