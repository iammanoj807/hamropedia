// One course lesson (AI & ML roadmap, System Design, ...), laid out in the same
// four steps as atomic-hub: understand it, go further, practise, prove it.
//
// Everything a reader needs is in the HTML: answers sit in <details> ("Show
// answer"), the animation's steps are also written out as text, and the
// diagram's source is kept for when Mermaid can't load. JavaScript
// (assets/js/lesson.js) adds the animation player, draws the diagram, explains
// glossary words and saves the ticks in this browser.
//
// What differs between courses (the lesson itself in step 1, what step 4 asks
// before the ticks) comes from the course: ctx.understand() and ctx.interview().
import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { codeBlock } from '../lib/markdown.js';
import { paragraphs, plain } from '../lib/glossary.js';
import { layout } from '../templates/layout.js';
import { breadcrumbs, breadcrumbSchema, shareBar } from '../templates/components.js';
import { topicResources, clip, courseByline } from './course-parts.js';

export const list = (items, mark, tag = 'ul', cls = '') =>
  `<${tag}${cls ? ` class="${cls}"` : ''}>${items.map((s) => `<li>${mark(s)}</li>`).join('')}</${tag}>`;

const codeLang = (lang) => lang || 'python';
export const answerBody = (a, mark) => paragraphs(a.answer, mark) + (a.code ? codeBlock(a.code, codeLang(a.codeLanguage)) : '');
export const topicCode = (t) => (t.code ? codeBlock(t.code, codeLang(t.codeLanguage)) : '');

/** The animation player's box. The steps are also written out, for search engines and screen readers. */
export function animationBox(ctx, t, accent) {
  const anim = ctx.animations[t.id];
  if (!anim) return '';
  return `<h3>Watch it happen</h3>
<div class="anim" data-anim="${ctx.animBase}${t.id}.json" style="--ph:${accent}">
  <div class="anim-head"><span class="anim-label">Animation</span><span class="anim-title">${esc(anim.title)}</span></div>
  <div class="anim-stage"></div>
  <details class="anim-text"><summary>Read the animation as text</summary><ol>${anim.variants[0].frames.map((f) => `<li>${esc(f.caption)}</li>`).join('')}</ol></details>
</div>`;
}

/** A Mermaid diagram with its caption. Drawn by JavaScript; the source shows if that fails. */
export function diagramBox(t, mark, heading = 'Picture it') {
  return `${heading ? `<h3>${heading}</h3>\n` : ''}<figure class="diagram">
  <div class="diagram-stage" data-mermaid><pre class="diagram-src">${esc(t.diagram.code)}</pre></div>
  <figcaption>${mark(t.diagram.caption)}</figcaption>
</figure>`;
}

/** Questions with their answers hidden until opened. */
export const questions = (items, mark) =>
  `<div class="qa-list">\n${items.map((f) => `<details class="reveal"><summary>${mark(f.q)}</summary><div class="reveal-body">${paragraphs(f.a, mark)}</div></details>`).join('\n')}\n</div>`;

/**
 * @param {object} ctx  the course: { key, course, animations, glossary, topicById, base, name,
 *   crumbs, animBase, image, steps (a list, or a function of the topic), understand(t, mark, phase),
 *   interview(t, mark), tags?(t),
 *   furtherNote, schemaCourse, level(phase, t) }
 * @param {object} phase
 * @param {number} index  the topic's position in its phase
 * @param {{prev?:object, next?:object}} around  neighbouring topics, as { phase, topic }
 */
export function renderLesson(ctx, phase, index, around, version) {
  const t = phase.topics[index];
  const url = `${ctx.base}${phase.slug}/${t.slug}/`;
  const phaseUrl = `${ctx.base}${phase.slug}/`;
  const key = `${phase.slug}--${t.slug}`;
  const num = `${phase.number}.${index + 1}`;
  const { mark, used } = ctx.glossary.marker();
  const crumbs = [...ctx.crumbs, { name: `Phase ${phase.number}: ${phase.title}`, path: phaseUrl }, { name: t.name, path: url }];
  const checks = ctx.course.checks;
  const steps = typeof ctx.steps === 'function' ? ctx.steps(t) : ctx.steps;

  // --- Step 1: the lesson itself (course-specific)
  const newWords = ctx.glossary.newWords(t);
  const wordsBox = newWords.length
    ? `<div class="new-words"><p>New words in this topic <span>(tap one to see what it means)</span></p><ul>${newWords.map((w) => `<li><button type="button" class="term term-chip" data-term="${esc(w.id)}">${esc(w.term)}</button></li>`).join('')}</ul></div>`
    : '';
  const understand = ctx.understand(t, mark, phase, wordsBox);

  // --- Step 2: go further
  const further = `<p>${ctx.furtherNote}</p>\n${topicResources(t.resources)}`;

  // --- Step 3: practise (a course can lay it out itself, as SQL does with its run boxes)
  const practise = ctx.practise ? ctx.practise(t, mark, phase) : `<p>Try each exercise yourself first: on paper, out loud or in code. Then open the answer and compare it with yours.</p>
<ol class="exercises">
${checks
  .map(
    (c) => `<li class="exercise">
  <p class="ex-head"><span class="ex-kind">${esc(c.label)}</span><span class="ex-meaning">${esc(c.meaning)}</span></p>
  <div class="ex-q">${paragraphs(t.practice[c.key], mark)}</div>
  <details class="reveal"><summary>Show answer</summary><div class="reveal-body">${answerBody(t.answers[c.key], mark)}</div></details>
</li>`,
  )
  .join('\n')}
</ol>`;

  // --- Step 4: interview questions (course-specific), then the ticks
  const prove = `${ctx.interview(t, mark)}
<h3>Tick each check when you can do it without notes</h3>
<div class="prove" data-topic-key="${key}">
  <p>${esc(ctx.course.confidentRule)}</p>
  <ul class="prove-list">
    ${checks.map((c) => `<li><label class="tick"><input type="checkbox" data-check="${c.key}"><span class="sr-only">${esc(c.label)}</span></label><span><b>${esc(c.label)}</b> ${esc(c.meaning)}</span></li>`).join('\n    ')}
  </ul>
  <p class="prove-status" data-prove-status aria-live="polite">0 of ${checks.length} checks ticked.</p>
  <p class="prove-save muted">Saved in this browser. <a href="${ctx.base}#your-progress">Back it up or move it to another device</a>.</p>
</div>`;

  const sections = [understand, further, practise, prove]
    .map((html, i) => {
      const s = steps[i];
      return `<section class="lesson-step" id="${s.id}" aria-labelledby="${s.id}-h">
  <h2 id="${s.id}-h"><span class="step-n">Step ${i + 1}</span> ${s.label}${s.note ? ` <span class="step-note">(${s.note})</span>` : ''}</h2>
  ${html}
</section>`;
    })
    .join('\n');

  // Glossary words used on this page, for the tap-to-explain box.
  const words = {};
  for (const id of new Set([...used, ...newWords.map((w) => w.id)])) {
    const w = ctx.glossary.byId.get(id);
    if (!w) continue;
    const teach = w.taughtIn && w.taughtIn !== t.id ? ctx.topicById.get(w.taughtIn) : null;
    words[id] = { term: w.term, definition: w.definition, ...(teach ? { learn: { name: teach.topic.name, url: `${ctx.base}${teach.phase.slug}/${teach.topic.slug}/` } } : {}) };
  }

  const pagerLink = (item, dir) =>
    item
      ? `<a class="pager-${dir}" href="${ctx.base}${item.phase.slug}/${item.topic.slug}/"><span>${dir === 'prev' ? '← Previous' : 'Next →'}</span>${esc(item.topic.name)}</a>`
      : dir === 'prev'
        ? `<a class="pager-prev" href="${ctx.base}"><span>← Back</span>${esc(ctx.name)}</a>`
        : `<a class="pager-next" href="${ctx.base}"><span>Finished →</span>Back to ${esc(ctx.name)}</a>`;

  const body = `<section class="page-head lesson-head" style="--ph:${phase.accent}">
  <div class="wrap">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow">Phase ${phase.number} · ${esc(phase.title)} · Topic ${num}</p>
    <h1>${esc(t.name)}</h1>
    ${ctx.tags ? ctx.tags(t) : ''}
    <p class="lead">${plain(t.definition)}</p>
    ${courseByline(t.updated)}
    <p class="lesson-progress"><span class="check-dots" data-check-dots="${key}" aria-hidden="true">${checks.map(() => '<i></i>').join('')}</span><span data-lesson-progress>Not started</span></p>
  </div>
</section>
<div class="wrap lesson-layout" data-course="${ctx.key}" data-checks="${checks.map((c) => c.key).join(',')}">
  <aside class="lesson-rail">
    <nav aria-label="Steps in this lesson">
      <p class="rail-h">This lesson</p>
      <ol class="rail-steps">${steps.map((s, i) => `<li><a href="#${s.id}"><span>${i + 1}</span>${s.short || s.label}</a></li>`).join('')}</ol>
    </nav>
    <details class="rail-phase">
      <summary>Phase ${phase.number}: ${esc(phase.short)}</summary>
      <ol>${phase.topics.map((x, i) => `<li><a href="${ctx.base}${phase.slug}/${x.slug}/"${x.id === t.id ? ' aria-current="page"' : ''} data-topic-link="${phase.slug}--${x.slug}"><span>${phase.number}.${i + 1}</span>${esc(x.name)}</a></li>`).join('')}</ol>
    </details>
  </aside>
  <article class="lesson prose">
    ${sections}
    <nav class="pager" aria-label="Previous and next lesson">
      ${pagerLink(around.prev, 'prev')}
      ${pagerLink(around.next, 'next')}
    </nav>
    ${shareBar(`${site.url}${url}`, `${t.name}: a free lesson from ${ctx.shareFrom}`)}
  </article>
</div>
<div class="term-pop" role="dialog" aria-modal="false" hidden><p class="term-pop-h"></p><p class="term-pop-d"></p><a class="term-pop-link" hidden></a><button type="button" class="term-pop-x" aria-label="Close">×</button></div>
<script type="application/json" id="glossary-data">${JSON.stringify(words).replace(/</g, '\\u003c')}</script>`;

  const title = `${t.name} | ${site.name}`;
  // Google shows about 60 characters of a title; a very long topic name is cut at a word.
  const shortTitle = title.length <= 60 ? title : t.name.length <= 65 ? t.name : clip(t.name, 64);
  const definition = t.definition.replace(/`/g, '');
  let description = clip(definition);
  if (description.length < 90) description = clip(`${description} A free ${ctx.lessonNoun} with exercises and answers.`);
  return layout({
    title: shortTitle,
    ogTitle: `${t.name}: free ${ctx.lessonNoun}`,
    description,
    path: url,
    image: ctx.image,
    type: 'article',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/lesson.js', ...(ctx.scripts || [])],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: t.name,
        description: definition,
        url: `${site.url}${url}`,
        learningResourceType: 'Lesson',
        educationalLevel: ctx.level(phase, t),
        inLanguage: 'en',
        isAccessibleForFree: true,
        isPartOf: { '@type': 'Course', name: ctx.schemaCourse, url: `${site.url}${ctx.base}`, provider: { '@type': 'Organization', name: site.name, url: site.url } },
        author: { '@type': 'Person', name: site.author.name, url: `${site.url}/about-us/` },
        ...(t.updated ? { dateModified: t.updated } : {}),
      },
      breadcrumbSchema(crumbs),
    ],
  });
}
