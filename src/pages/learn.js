import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { layout, ICONS } from '../templates/layout.js';
import { postCard, pageHead, breadcrumbSchema } from '../templates/components.js';
import { phases, totals } from './roadmap.js';

/** The dark AI-roadmap band, shared by the home page and Learn & Build. */
export function roadmapBand() {
  return `<section class="roadmap-band">
  <div class="wrap band-grid">
    <div>
      <p class="eyebrow">Free · no sign-up</p>
      <h2>Learn AI &amp; machine learning from zero</h2>
      <p>${totals.phases} phases, ${totals.topics} topics and ${totals.resources} hand-picked free resources: the best videos, interactive explainers, books and courses for each topic, in the order that makes sense.</p>
      <a class="btn btn-lg" href="/ai-roadmap/">Open the roadmap ${ICONS.arrow}</a>
    </div>
    <ol class="band-phases">
      ${phases.map((p) => `<li style="--ph:${p.accent}"><a href="/ai-roadmap/${p.slug}/"><span>${p.number}</span>${esc(p.title)}</a></li>`).join('')}
    </ol>
  </div>
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
    lead: 'Free, step-by-step paths to learn coding and AI, and project ideas you can build and show. Start anywhere: every resource here is free.',
  })}
<section class="wrap" aria-labelledby="rm-h">
  <div class="section-head"><h2 id="rm-h">AI &amp; ML Roadmap</h2><a href="/ai-roadmap/">Open the full roadmap</a></div>
  <p class="section-lead">Learn AI and machine learning from zero, in order: ${totals.phases} phases, ${totals.topics} topics and ${totals.resources} hand-picked free resources. Tick topics off as you go.</p>
  <ol class="phase-grid">
    ${phases.map((p) => `<li class="phase-card" style="--ph:${p.accent}">
      <a href="/ai-roadmap/${p.slug}/">
        <span class="phase-num">Phase ${p.number}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.goal)}</p>
        <span class="phase-stats">${p.topics.length} topics</span>
        <span class="phase-progress" data-phase-progress="${p.slug}" data-total="${p.topics.length}"><span></span></span>
      </a>
    </li>`).join('')}
  </ol>
</section>
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
    description: `Learn coding and AI for free: a ${totals.phases}-phase AI & machine learning roadmap with ${totals.resources}+ free resources, beginner coding guides, and project ideas to build.`,
    path: '/learn/',
    image: '/images/og/ai-roadmap.jpg',
    body,
    version,
    section: '/learn/',
    scripts: ['/assets/js/roadmap.js'],
    schema: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Learn & Build', url: `${site.url}/learn/` },
      breadcrumbSchema(crumbs),
    ],
  });
}
