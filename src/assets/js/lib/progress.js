// Course progress, kept in this browser only (no account, nothing sent anywhere).
// Each topic, keyed "<phase-slug>--<topic-slug>", has the checks the reader has
// ticked (for the AI roadmap: explain, derive, build, break). A topic is done
// when every check is ticked.

/** localStorage that never throws (private mode, blocked storage). */
export const safeStorage = () => ({
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* not saved */ } },
  remove(k) { try { localStorage.removeItem(k); } catch { /* nothing to do */ } },
});

/**
 * @param {{ key: string, checks: string[], legacyKey?: string, storage?: ReturnType<typeof safeStorage> }} options
 *   legacyKey: an older list of finished topic keys. Each is carried over with
 *   every check ticked (it meant "done"), then the old list is removed.
 */
export function openProgress({ key, checks, legacyKey, storage = safeStorage() }) {
  let state = {};
  try { state = JSON.parse(storage.get(key) || '{}') || {}; } catch { state = {}; }
  const save = () => storage.set(key, JSON.stringify(state));

  if (legacyKey) {
    let legacy = [];
    try { legacy = JSON.parse(storage.get(legacyKey) || '[]'); } catch { legacy = []; }
    if (Array.isArray(legacy) && legacy.length) {
      for (const topic of legacy) if (typeof topic === 'string' && !state[topic]) state[topic] = [...checks];
      save();
    }
    storage.remove(legacyKey);
  }

  const ticked = (topic) => (Array.isArray(state[topic]) ? state[topic].filter((c) => checks.includes(c)) : []);
  const isDone = (topic) => checks.every((c) => ticked(topic).includes(c));

  return {
    ticked,
    isDone,
    toggle(topic, check, on) {
      const set = new Set(ticked(topic));
      if (on) set.add(check); else set.delete(check);
      if (set.size) state[topic] = checks.filter((c) => set.has(c)); else delete state[topic];
      save();
    },
    /** Finished topics, optionally only those in one phase. */
    doneCount(phaseSlug) {
      return Object.keys(state).filter((t) => (!phaseSlug || t.startsWith(`${phaseSlug}--`)) && isDone(t)).length;
    },
  };
}

/**
 * A course's progress, from the page: the element with data-course="ml" (or "sd", ...)
 * and data-checks="explain,derive,..." says which course and which checks.
 * The AI & ML roadmap's ticks replaced its older single tick per topic ("hp-roadmap-done").
 */
export function pageProgress(el = document.querySelector('[data-course]')) {
  const course = el?.dataset.course || 'ml';
  const checks = (el?.dataset.checks || 'explain,derive,build,break').split(',');
  return {
    course,
    checks,
    progress: openProgress({ key: `hp-course-${course}`, checks, legacyKey: course === 'ml' ? 'hp-roadmap-done' : undefined }),
  };
}

/** Colour each [data-check-dots] and [data-topic-link] (inside `root`) for its topic's ticks. */
export function paintTopics(progress, checks, root = document) {
  root.querySelectorAll('[data-check-dots]').forEach((el) => {
    const n = progress.ticked(el.dataset.checkDots).length;
    [...el.children].forEach((dot, i) => dot.classList.toggle('on', i < n));
    el.title = `${n} of ${checks.length} checks ticked`;
  });
  root.querySelectorAll('[data-topic-link]').forEach((el) => {
    const n = progress.ticked(el.dataset.topicLink).length;
    el.classList.toggle('done', n === checks.length);
    el.classList.toggle('started', n > 0 && n < checks.length);
  });
}
