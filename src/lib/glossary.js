// Tap-to-explain words for the course lessons, marked at build time.
// The matching rules are atomic-hub's glossaryEngine: longest spelling first,
// whole words only, case-sensitive, and only a word's first mention on a page.
import { esc } from './util.js';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {{id:string, term:string, definition:string, taughtIn?:string, matches:string[]}[]} terms
 * @param {{id:string}[]} topicsInOrder  every topic, in reading order
 * @param {(topic:any) => string[]} proseOf  a topic's prose, in reading order
 */
export function createGlossary(terms, topicsInOrder, proseOf) {
  const byId = new Map(terms.map((t) => [t.id, t]));
  const idBySpelling = new Map();
  for (const t of terms) for (const s of t.matches) if (!idBySpelling.has(s)) idBySpelling.set(s, t.id);
  const pattern = new RegExp(
    `(?<![A-Za-z0-9_])(?:${[...idBySpelling.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})(?![A-Za-z0-9_])`,
    'g',
  );

  /** Split text into plain pieces and glossary words, in order. */
  const segment = (text) => {
    const out = [];
    let last = 0;
    for (const m of String(text).matchAll(pattern)) {
      if (m.index > last) out.push({ text: text.slice(last, m.index) });
      out.push({ text: m[0], termId: idBySpelling.get(m[0]) });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
  };

  const termsInTopic = (topic) => {
    const ids = [];
    for (const text of proseOf(topic)) for (const s of segment(text)) if (s.termId && !ids.includes(s.termId)) ids.push(s.termId);
    return ids;
  };

  const firstTopic = new Map();
  for (const topic of topicsInOrder) for (const id of termsInTopic(topic)) if (!firstTopic.has(id)) firstTopic.set(id, topic.id);

  /** Words that appear for the first time in this topic, except the word it teaches. */
  const newWords = (topic) =>
    termsInTopic(topic)
      .filter((id) => firstTopic.get(id) === topic.id && byId.get(id)?.taughtIn !== topic.id)
      .map((id) => byId.get(id));

  /**
   * A marker for one page: mark(text) returns escaped HTML with the first
   * mention of each word as a button; `used` lists every word it marked.
   * `inline code` in backticks is shown in a code font and never marked.
   */
  const marker = () => {
    const used = new Set();
    const words = (text) =>
      segment(text)
        .map((s) => {
          if (!s.termId || used.has(s.termId)) return esc(s.text);
          used.add(s.termId);
          return `<button type="button" class="term" data-term="${esc(s.termId)}">${esc(s.text)}</button>`;
        })
        .join('');
    const mark = (text) =>
      String(text ?? '')
        .split(/`([^`]+)`/)
        .map((part, i) => (i % 2 ? `<code>${esc(part)}</code>` : words(part)))
        .join('');
    return { mark, used };
  };

  return { byId, segment, newWords, marker };
}

/** Plain text with `inline code`, escaped, and no glossary words. */
export const plain = (text) =>
  String(text ?? '')
    .split(/`([^`]+)`/)
    .map((part, i) => (i % 2 ? `<code>${esc(part)}</code>` : esc(part)))
    .join('');

/** Paragraphs from text where a blank line starts a new paragraph. */
export const paragraphs = (text, mark = plain) =>
  String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.split('\n').map(mark).join('<br>')}</p>`)
    .join('');
