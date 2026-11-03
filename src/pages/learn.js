import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { layout, ICONS } from '../templates/layout.js';
import { postCard, pageHead, breadcrumbSchema } from '../templates/components.js';
import { progressBackup } from './course-parts.js';
import { phases, totals } from './roadmap.js';
import { sdPhases, sdTotals, CHECKS_ATTR as SD_ATTR } from './system-design.js';
import { sqlPhases, sqlTotals, CHECKS_ATTR as SQL_ATTR } from './sql.js';
import { dsaTopics, dsaTotals } from './dsa.js';

/** The dark AI-roadmap band, shared by the home page and Learn & Build. */
export function roadmapBand() {
  return `<section class="roadmap-band">
  <div class="wrap band-grid">
    <div>
      <p class="eyebrow">Free · no sign-up</p>
      <h2>Learn AI &amp; machine learning from zero</h2>
      <p>${totals.phases} phases and ${totals.topics} full lessons, in the order that makes sense. Every lesson has an animation, a diagram, worked code and exercises with answers, plus the best free videos and explainers if you want more.</p>
      <a class="btn btn-lg" href="/ai-roadmap/">Open the roadmap ${ICONS.arrow}</a>
    </div>
    <ol class="band-phases">
      ${phases.map((p) => `<li style="--ph:${p.accent}"><a href="/ai-roadmap/${p.slug}/"><span>${p.number}</span>${esc(p.title)}</a></li>`).join('')}
    </ol>
  </div>
</section>`;
}

/**
 * "Start here": what each course is for, how every lesson works, and an order
 * to take them in from zero. Adapted from atomic-hub's home-page map.
 */
function startHere() {
  const courses = [
    { name: 'AI & ML Roadmap', href: '/ai-roadmap/', size: `${totals.topics} lessons`, what: 'From your first NumPy array to building and shipping LLM apps. For AI and machine learning engineering.', checks: 'Explain · Derive · Build · Break' },
    { name: 'System Design', href: '/system-design/', size: `${sdTotals.topics} lessons`, what: 'How large systems are built: high-level design, low-level design (OOP, SOLID, patterns) and AI/ML design, ending with full interview questions.', checks: 'Explain · Draw · Apply · Trade-offs', extra: ['/system-design/revise/', 'Revision notes'] },
    { name: 'SQL', href: '/sql/', size: `${sqlTotals.topics} lessons`, what: 'Getting answers out of data, from SELECT to window functions and interview problems, with a query runner in your browser.', checks: 'Explain · Write · Predict · Edge cases', extra: ['/sql/practice-database/', 'The practice database'] },
    { name: 'DSA (NeetCode 150)', href: '/dsa/', size: `${dsaTotals.topics} patterns · ${dsaTotals.problems} problems`, what: 'The patterns behind coding interviews, one at a time, with the NeetCode problems as questions and reviews that make them stick.', checks: 'Tick problems solved; they come back for review', extra: ['/dsa/patterns/', 'Which pattern? drill'] },
  ];
  const map = `flowchart LR
  S(["Start"]) --> A["AI & ML Phase 0: your toolkit<br/>+ SQL Phases 0–3"]
  A --> B["AI & ML Phases 1–2: maths, classical ML<br/>+ System Design Phases 0–2<br/>+ DSA: arrays, hashing, two pointers"]
  B --> C["AI & ML Phases 3–5: deep learning, LLMs, AI engineering<br/>+ System Design Phases 3–4 and 9<br/>+ more DSA topics"]
  C --> D["AI & ML Phases 6–7<br/>when the rest feels solid"]
  B -.-> I["Interview soon?<br/>Must-know topics, revision notes,<br/>DSA reviews every day"]`;
  return `<section class="wrap start-here" id="start-here" aria-labelledby="start-h">
  <h2 id="start-h">Start here: how the four courses fit together</h2>
  <p class="section-lead">Four free courses that work the same way. Take one, or take them side by side in the order below. Everything is free, with no sign-up.</p>
  <ul class="course-map">
    ${courses.map((c) => `<li><a class="course-card" href="${c.href}"><span class="phase-num">${esc(c.size)}</span><h3>${esc(c.name)}</h3><p>${esc(c.what)}</p><span class="course-checks">${esc(c.checks)}</span></a>${c.extra ? `<a class="course-extra" href="${c.extra[0]}">${esc(c.extra[1])} →</a>` : ''}</li>`).join('')}
  </ul>
  <div class="start-grid">
    <div>
      <h3>How every lesson works</h3>
      <ol class="loop-steps">
        <li><b><span>1</span>Learn</b><p>A full lesson: an animation, the idea step by step, a diagram, a worked example. Tap any underlined word to see what it means.</p></li>
        <li><b><span>2</span>Practise</b><p>Four exercises with hidden answers: try each first, then compare. SQL runs in your browser; DSA has its problems and a pattern drill.</p></li>
        <li><b><span>3</span>Prove it</b><p>The next day, with notes closed, tick each check only if you can do it from memory. Re-test old topics every two weeks. Solved DSA problems come back by themselves.</p></li>
      </ol>
    </div>
    <div>
      <h3>A good order, if you're starting from zero</h3>
      <ol class="build-list">
        <li><a href="/ai-roadmap/your-toolkit/">AI &amp; ML Phase 0 (the toolkit)</a> and <a href="/sql/">SQL Phases 0–3</a>, side by side.</li>
        <li>AI &amp; ML Phases 1–2 (the maths, then classical ML), with <a href="/system-design/">System Design Phases 0–2</a> and <a href="/dsa/">DSA</a> arrays, hashing and two pointers.</li>
        <li>AI &amp; ML Phases 3–5 (deep learning, transformers, AI engineering), with System Design Phases 3–4 and 9, and more DSA.</li>
        <li>AI &amp; ML Phases 6–7 (systems at scale, generative models and RL) when the rest feels solid.</li>
        <li>From the first week: say one interview answer out loud each day. System Design and SQL lessons end with one.</li>
      </ol>
    </div>
  </div>
  <figure class="diagram" style="--ph:var(--accent)">
    <div class="diagram-stage" data-mermaid><pre class="diagram-src">${esc(map)}</pre></div>
    <figcaption>The order above as a map. Each box is a few weeks to a few months, at your own pace: there are no deadlines.</figcaption>
  </figure>
  <p class="muted">Your ticks, saved queries and review dates are kept in this browser. <a href="#your-progress">Back them up or move them to another device</a>.</p>
</section>`;
}

const PROJECTS = [
  ['Devanagari handwriting recogniser', 'Train a small neural network on a public dataset of handwritten Devanagari characters.'],
  ['News topic classifier', 'Collect headlines, label a few hundred, then train and evaluate a model that sorts them by topic.'],
  ['Romanized-to-Nepali model', 'Teach a model to turn "mero naam" into "मेरो नाम" from examples, and compare it with a rule-based tool.'],
  ['A question-answering assistant', 'Build a small RAG app that answers questions from official documents, with your own test set to measure it.'],
];

export function renderLearn(posts, version) {
  const guides = posts.filter((p) => p.type !== 'news' && (p.category === 'coding' || p.category === 'ai'));
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Learn & Build', path: '/learn/' }];
  const projectsLink = '/how-to-learn-ai-and-machine-learning-for-free/#projects-that-make-you-stand-out';

  const body = `${pageHead({
    crumbs,
    eyebrow: 'Learn &amp; Build',
    title: 'Learn the skills, then build something real',
    lead: 'Four free courses (AI & ML, System Design, SQL and DSA), beginner coding guides, and project ideas you can build and show. Start with the map below.',
  })}
${startHere()}
<section class="wrap section" aria-labelledby="rm-h" data-course="ml" data-checks="explain,derive,build,break">
  <div class="section-head"><h2 id="rm-h">AI &amp; ML Roadmap</h2><a href="/ai-roadmap/">Open the full roadmap</a></div>
  <p class="section-lead">Learn AI and machine learning from zero, in order: ${totals.phases} phases, ${totals.topics} lessons and ${totals.exercises} exercises with answers. Tick off each lesson's checks as you go.</p>
  <ol class="phase-grid">
    ${phases.map((p) => `<li class="phase-card" style="--ph:${p.accent}">
      <a href="/ai-roadmap/${p.slug}/">
        <span class="phase-num">Phase ${p.number}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.goal)}</p>
        <span class="phase-stats">${p.topics.length} lessons</span>
        <span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span>
      </a>
    </li>`).join('')}
  </ol>
</section>
<section class="wrap section" aria-labelledby="sd-h" ${SD_ATTR}>
  <div class="section-head"><h2 id="sd-h">System Design</h2><a href="/system-design/">Open the course</a></div>
  <p class="section-lead">For software engineering interviews and for building real systems: ${sdTotals.phases} phases and ${sdTotals.topics} lessons on high-level design, low-level design and AI/ML design, ending with ${sdTotals.designs} full design questions.</p>
  <ol class="phase-grid">
    ${sdPhases.map((p) => `<li class="phase-card" style="--ph:${p.accent}">
      <a href="/system-design/${p.slug}/">
        <span class="phase-num">Phase ${p.number}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.goal)}</p>
        <span class="phase-stats">${p.topics.length} lessons</span>
        <span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span>
      </a>
    </li>`).join('')}
  </ol>
</section>
<section class="wrap section" aria-labelledby="sql-h" ${SQL_ATTR}>
  <div class="section-head"><h2 id="sql-h">SQL</h2><a href="/sql/">Open the course</a></div>
  <p class="section-lead">From your first <code>SELECT</code> to window functions and ${sqlTotals.problems} classic interview problems: ${sqlTotals.topics} lessons on one practice database, with ${sqlTotals.queries} example queries you can run in your browser.</p>
  <ol class="phase-grid">
    ${sqlPhases.map((p) => `<li class="phase-card" style="--ph:${p.accent}">
      <a href="/sql/${p.slug}/">
        <span class="phase-num">Phase ${p.number}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.goal)}</p>
        <span class="phase-stats">${p.topics.length} ${p.topics.every((t) => t.kind === 'problem') ? 'problems' : 'lessons'}</span>
        <span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span>
      </a>
    </li>`).join('')}
  </ol>
</section>
<section class="wrap section" aria-labelledby="dsa-h">
  <div class="section-head"><h2 id="dsa-h">DSA (NeetCode 150)</h2><a href="/dsa/">Open the course</a></div>
  <p class="section-lead">For coding interviews: ${dsaTotals.topics} patterns and the ${dsaTotals.problems} NeetCode problems, each pattern taught with a template and traced examples. Problems you solve come back for review, so they stick.</p>
  <ol class="phase-grid dsa-grid">
    ${dsaTopics.map((t) => `<li class="phase-card" style="--ph:${t.accent}">
      <a href="/dsa/${t.slug}/">
        <span class="phase-num">Topic ${t.index + 1}</span>
        <h3>${esc(t.title)}</h3>
        <span class="phase-stats" data-dsa-count="${esc(t.id)}" data-total="${t.problems.length}">${t.problems.length} problems</span>
        <span class="phase-progress" data-dsa-progress="${esc(t.id)}" data-total="${t.problems.length}"><span></span></span>
      </a>
    </li>`).join('')}
  </ol>
  <script type="application/json" id="dsa-map">${JSON.stringify(Object.fromEntries(dsaTopics.map((t) => [t.id, t.problems.map((p) => p.id)])))}</script>
</section>
<div class="wrap section">${progressBackup()}</div>
<section class="wrap section">
  <div class="section-head"><h2>Guides to get you started</h2><a href="/blog/">All articles</a></div>
  <div class="grid grid-3">${guides.map((p) => postCard(p)).join('')}</div>
</section>
<section class="wrap section">
  <div class="section-head"><h2>Ideas to build</h2><a href="${projectsLink}">How to make them stand out</a></div>
  <ol class="build-grid">
    ${PROJECTS.map(([name, text], i) => `<li><span class="build-n">0${i + 1}</span><h3>${esc(name)}</h3><p>${esc(text)}</p></li>`).join('')}
  </ol>
</section>`;

  return layout({
    title: `Learn & Build: free coding and AI learning paths | ${site.name}`,
    ogTitle: 'Learn & Build: free coding and AI learning paths',
    description: `Learn AI, system design, SQL and DSA for free: ${totals.topics + sdTotals.topics + sqlTotals.topics} lessons, the NeetCode 150, coding guides and project ideas.`,
    path: '/learn/',
    image: '/images/og/ai-roadmap.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/roadmap.js', '/assets/js/dsa.js', '/assets/js/lesson.js'],
    schema: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Learn & Build', url: `${site.url}/learn/` },
      breadcrumbSchema(crumbs),
    ],
  });
}
