import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { layout, ICONS } from '../templates/layout.js';
import { pageHead, breadcrumbSchema } from '../templates/components.js';

function simplePage({ path, title, seoTitle, description, lead, eyebrow, html, version, schema = [] }) {
  const crumbs = [{ name: 'Home', path: '/' }, { name: title, path }];
  return layout({
    title: seoTitle || `${title} | ${site.name}`,
    description,
    path,
    version,
    body: `${pageHead({ crumbs, eyebrow, title: esc(title), lead })}<section class="wrap-narrow prose static">${html}</section>`,
    schema: [...schema, breadcrumbSchema(crumbs)],
  });
}

export function renderAbout(version) {
  return simplePage({
    version,
    path: '/about-us/',
    title: 'About Hamropedia',
    eyebrow: 'About',
    description: 'Hamropedia is a free site by software engineer Manoj Kumar Thapa: Nepali tools, a free AI roadmap, study-abroad guides and sourced Nepal news.',
    lead: 'Useful things for Nepali people, made carefully: tools that work, guides that match the official sites, and news with its sources showing.',
    html: `<div class="about-hero">
  <img src="${site.author.photoLarge}" alt="${esc(site.author.name)}" width="480" height="591" decoding="async">
  <div>
    <p class="author-name">${esc(site.author.name)}</p>
    <p class="muted">${esc(site.author.role)} · ${esc(site.author.location)} · from Nepal</p>
    <p><a href="${site.social.linkedin}" target="_blank" rel="noopener">LinkedIn</a> · <a href="${site.social.youtube}" target="_blank" rel="noopener">YouTube</a> · <a href="${site.social.facebook}" target="_blank" rel="noopener">Facebook</a> · <a href="/contact-us/">Contact</a></p>
  </div>
</div>
<p>Hamropedia (<span lang="ne">हाम्रो</span>, “our”, + encyclopedia) started in ${site.established} as a small blog for Nepali students. It is now a hand-built site with three jobs:</p>
<ul>
<li><strong>Free tools</strong> that people actually search for every day: <a href="/tools/english-to-nepali/">English to Nepali typing</a>, a <a href="/tools/nepali-keyboard/">Nepali keyboard</a>, a <a href="/tools/nepali-date-converter/">Nepali date converter</a> and an <a href="/tools/age-calculator/">age calculator</a>.</li>
<li><strong>Learning</strong>: a free <a href="/ai-roadmap/">AI &amp; machine learning roadmap</a> with ${'370+'} hand-picked resources, and coding guides for beginners.</li>
<li><strong>Guides and news</strong>: <a href="/category/study-abroad/">study-abroad guides</a> (NOC, WES, UK visas) and <a href="/news/">Nepal news explainers</a>, each linked to its sources.</li>
</ul>
<h2>Who writes it</h2>
<p>I’m <strong>${esc(site.author.name)}</strong>, a ${esc(site.author.role.toLowerCase())} from Nepal, now living in ${esc(site.author.location)}. I build software for a living, and Hamropedia is where I share what I have learned with other Nepali students, learners and readers.</p>
<h2>How articles are checked</h2>
<ul>
<li>Rules, fees and dates are checked against the official source (gov.uk, wes.org, Nepal government portals) and linked in the article.</li>
<li>News is based on named reports, linked inline. Proposals are labelled as proposals, not as law.</li>
<li>Every page shows its published and updated dates. When something changes, the article is updated, not quietly left wrong.</li>
<li>In ${new Date().getUTCFullYear()} the old site was rebuilt from scratch. Posts that had become outdated or could not be verified were removed or rewritten.</li>
</ul>
<p>Found a mistake, or want a topic covered? <a href="/contact-us/">Get in touch</a>.</p>`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About Hamropedia',
        url: `${site.url}/about-us/`,
        mainEntity: { '@type': 'Person', name: site.author.name, jobTitle: site.author.role, image: `${site.url}${site.author.photoSchema}`, address: { '@type': 'PostalAddress', addressLocality: 'Birmingham', addressCountry: 'GB' }, sameAs: Object.values(site.social) },
      },
    ],
  });
}

export function renderContact(version) {
  return simplePage({
    version,
    path: '/contact-us/',
    title: 'Contact',
    eyebrow: 'Contact',
    description: 'Contact Hamropedia: report a mistake, suggest a Nepali tool or article, or say hello. Email and social links.',
    lead: 'Report a mistake, suggest a tool or an article, or just say hello. I read every message.',
    html: `<div class="contact-grid">
  <a class="contact-card" href="mailto:${site.email}?subject=Hamropedia">
    <b>Email</b><span>${site.email}</span>
  </a>
  <a class="contact-card" href="${site.social.linkedin}" target="_blank" rel="noopener">${ICONS.linkedin}<b>LinkedIn</b><span>Manoj Kumar Thapa</span></a>
  <a class="contact-card" href="${site.social.facebook}" target="_blank" rel="noopener">${ICONS.facebook}<b>Facebook</b><span>manojthapa807</span></a>
  <a class="contact-card" href="${site.social.youtube}" target="_blank" rel="noopener">${ICONS.youtube}<b>YouTube</b><span>@thapam807</span></a>
</div>
<h2>Reporting a mistake</h2>
<p>Please include the page link and, if you can, the official source that shows the correct information. Corrections are made as quickly as possible and the article’s “updated” date changes.</p>
<p class="muted">Based in ${esc(site.author.location)}.</p>`,
    schema: [{ '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact Hamropedia', url: `${site.url}/contact-us/` }],
  });
}

export function renderPrivacy(version) {
  return simplePage({
    version,
    path: '/privacy-policy/',
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    description: 'Hamropedia privacy policy: no accounts, no trackers, no advertising cookies. Tools run in your browser and your text is never uploaded.',
    lead: 'Short version: no accounts, no tracking, no advertising cookies, and nothing you type into the tools leaves your device.',
    html: `<p class="muted">Last updated: 1 November 2026</p>
<h2>What this site collects</h2>
<p><strong>Nothing about you, directly.</strong> Hamropedia has no user accounts, no comment forms, no newsletter sign-up, no analytics scripts and no advertising.</p>
<h2>The tools</h2>
<p>The English to Nepali typing tool, the Nepali keyboard, the date converter and the age calculator run entirely in your browser using JavaScript. The text and dates you enter are not sent to any server.</p>
<h2>What is stored in your browser</h2>
<p>The site uses your browser’s local storage, which stays on your device and is never sent to us, for:</p>
<ul>
<li>your theme and colour choice;</li>
<li>topics you tick as done on the AI roadmap;</li>
<li>the last text you typed in a tool, so it is still there if you reload.</li>
</ul>
<p>You can clear all of this at any time by clearing this site’s data in your browser settings.</p>
<h2>Third parties</h2>
<ul>
<li><strong>Hosting:</strong> the site is hosted on GitHub Pages. GitHub may log technical information such as IP addresses to run and secure the service; see the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">GitHub Privacy Statement</a>.</li>
<li><strong>Fonts:</strong> fonts are loaded from Google Fonts, which receives your IP address when the font files are downloaded; see <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google’s privacy policy</a>.</li>
<li><strong>Links and share buttons</strong> are plain links. Nothing from Facebook, LinkedIn, WhatsApp or X loads until you click one.</li>
</ul>
<h2>Contact</h2>
<p>Questions about privacy: <a href="mailto:${site.email}">${site.email}</a>.</p>`,
  });
}

export function renderTerms(version) {
  return simplePage({
    version,
    path: '/terms-of-use-hamropedia/',
    title: 'Terms of Use',
    eyebrow: 'Legal',
    description: 'Terms of use for Hamropedia.com: information is provided in good faith, always confirm official requirements with the official source.',
    lead: 'Plain-English terms for using Hamropedia.',
    html: `<p class="muted">Last updated: 1 November 2026</p>
<h2>Information, not official advice</h2>
<p>Articles are written carefully and checked against official sources, but rules, fees and processes change. Hamropedia is not a government body, university, law firm or registered immigration adviser. Before you apply for a visa, NOC, credential evaluation or anything with legal or financial consequences, confirm the current requirements on the official website, which every guide links to.</p>
<h2>The tools</h2>
<p>The converters are provided free and “as is”. They are tested, but you should check important text and dates yourself, especially for legal documents. Dates from 2084 BS onward are provisional.</p>
<h2>Content</h2>
<p>Articles and site design are © ${site.name}. You are welcome to quote short parts with a link back to the original page. Linked resources on the AI roadmap belong to their creators.</p>
<h2>External links</h2>
<p>Hamropedia links to other websites for sources and learning resources. We are not responsible for their content or availability.</p>
<h2>Contact</h2>
<p><a href="mailto:${site.email}">${site.email}</a></p>`,
  });
}

export function render404(version) {
  return layout({
    title: `Page not found | ${site.name}`,
    description: 'This page could not be found. Try the Nepali tools, the AI roadmap or the latest articles on Hamropedia.',
    path: '/404.html',
    noindex: true,
    version,
    body: `<section class="wrap-narrow not-found">
  <p class="eyebrow">404</p>
  <h1>This page wandered off into the hills.</h1>
  <p class="lead">It may have moved when the site was rebuilt. These are the most popular places to go next:</p>
  <ul class="nf-links">
    <li><a href="/tools/english-to-nepali/">English to Nepali typing</a></li>
    <li><a href="/tools/nepali-date-converter/">Nepali date converter</a></li>
    <li><a href="/tools/nepali-keyboard/">Nepali keyboard</a></li>
    <li><a href="/tools/age-calculator/">Age calculator</a></li>
    <li><a href="/ai-roadmap/">AI &amp; ML roadmap</a></li>
    <li><a href="/blog/">All articles</a></li>
    <li><a href="/news/">News</a></li>
  </ul>
  <a class="btn" href="/">Go to the home page</a>
</section>`,
  });
}

/** A static "moved" page. GitHub Pages cannot send 301s, so this uses a canonical + instant refresh. */
export function renderRedirect(r) {
  const to = r.to.startsWith('http') ? r.to : site.url + r.to;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Moved: ${esc(r.title)} | ${site.name}</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${to}">
<meta http-equiv="refresh" content="0; url=${r.to}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:36rem;margin:15vh auto;padding:0 16px;color:#0f172a;background:#fff}a{color:#2453c4}</style>
<script>location.replace(${JSON.stringify(r.to)});</script>
</head>
<body>
<p>This article was retired because its information was out of date. Taking you to the updated page: <a href="${r.to}">${to}</a></p>
</body>
</html>`;
}
