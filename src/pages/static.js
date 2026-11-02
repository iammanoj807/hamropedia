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
    html: `<figure class="about-photo"><img src="/images/manojkumarthapa.webp" alt="Manoj Kumar Thapa" width="440" height="519" decoding="async"><figcaption>${esc(site.author.name)}<span>${esc(site.author.role)}, ${esc(site.author.location)}</span></figcaption></figure>
<p>Hamropedia (<span lang="ne">हाम्रो</span>, “our”, + encyclopedia) started in ${site.established} as a small blog for Nepali students. It is now a hand-built site with three jobs:</p>
<ul>
<li><strong>Free tools</strong> that people actually search for every day: <a href="/tools/english-to-nepali/">English to Nepali typing</a>, a <a href="/tools/nepali-keyboard/">Nepali keyboard</a>, a <a href="/tools/nepali-date-converter/">Nepali date converter</a> and an <a href="/tools/age-calculator/">age calculator</a>.</li>
<li><strong>Learning</strong>: a free <a href="/ai-roadmap/">AI &amp; machine learning roadmap</a> with ${'370+'} hand-picked resources, and coding guides for beginners.</li>
<li><strong>Guides and news</strong>: <a href="/category/study-abroad/">study-abroad guides</a> (NOC, WES, UK visas) and <a href="/news/">Nepal news explainers</a>, each linked to its sources.</li>
</ul>
<h2>Who writes it</h2>
<p>I’m <strong>${esc(site.author.name)}</strong>, a ${esc(site.author.role.toLowerCase())} from Nepal, now living in ${esc(site.author.location)}. I build software for a living, and Hamropedia is where I share what I have learned with other Nepali students, learners and readers.</p>
<p>You can see my work on <a href="${site.social.github}" target="_blank" rel="noopener">GitHub</a> and my <a href="${site.social.portfolio}" target="_blank" rel="noopener">portfolio</a>, or connect on <a href="${site.social.linkedin}" target="_blank" rel="noopener">LinkedIn</a>.</p>
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
        mainEntity: { '@type': 'Person', name: site.author.name, jobTitle: site.author.role, url: site.social.portfolio, address: { '@type': 'PostalAddress', addressLocality: 'Birmingham', addressCountry: 'GB' }, sameAs: Object.values(site.social) },
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
  <a class="contact-card" href="${site.social.github}" target="_blank" rel="noopener">${ICONS.github}<b>GitHub</b><span>iammanoj807</span></a>
  <a class="contact-card" href="${site.social.portfolio}" target="_blank" rel="noopener">${ICONS.globe}<b>Portfolio</b><span>iammanoj807.github.io/profile</span></a>
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
    description: 'Hamropedia privacy policy: what information is collected, how cookies and browser storage are used, advertising through Google AdSense, and your choices.',
    lead: 'What this site collects, how cookies are used, how advertising works, and the choices you have.',
    html: `<p class="muted">Last updated: 2 November 2026</p>
<h2>Who we are</h2>
<p>Hamropedia (hamropedia.com) is run by ${esc(site.author.name)}, ${esc(site.author.location)}. If you have any question about this policy, email <a href="mailto:${site.email}">${site.email}</a>.</p>

<h2>Information we collect</h2>
<ul>
<li><strong>No accounts.</strong> You can read everything without signing up, and we don’t ask for your name or email.</li>
<li><strong>If you email us,</strong> we receive the information you choose to send and use it only to reply.</li>
<li><strong>The tools</strong> (typing, Nepali keyboard, date converter, age calculator) run in your browser. The text and dates you enter are not sent to us.</li>
<li><strong>Hosting:</strong> the site is hosted on GitHub Pages. GitHub may log technical information such as your IP address to run and secure the service; see the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">GitHub Privacy Statement</a>.</li>
<li><strong>Fonts:</strong> fonts are loaded from Google Fonts, which receives your IP address when the font files download; see <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google’s privacy policy</a>.</li>
</ul>

<h2 id="cookies">Cookies and browser storage</h2>
<p>Cookies and browser storage are small pieces of data saved on your device. Hamropedia uses your browser’s local storage for:</p>
<ul>
<li>your <strong>cookie choice</strong>, so we don’t ask again on every page;</li>
<li><strong>dark mode</strong>, if you switch it on;</li>
<li><strong>AI roadmap progress</strong> (topics you tick) and the <strong>last text you typed in a tool</strong>, so they are still there when you come back.</li>
</ul>
<p>These stay on your device and are not sent to us. If you accept advertising cookies, Google and its partners may also set cookies, as described below.</p>

<h2>Advertising (Google AdSense)</h2>
<p>We plan to show ads through <strong>Google AdSense</strong> to help keep Hamropedia free. When ads are shown:</p>
<ul>
<li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.</li>
<li>Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.</li>
<li>You may opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a>. You can also opt out of some third-party vendors’ use of cookies for personalised advertising at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">aboutads.info</a>.</li>
<li>Learn more about <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">how Google uses information from sites that use its services</a>.</li>
</ul>
<p>If you choose <strong>Reject</strong> in the cookie message, we will not allow personalised advertising cookies. Ads you see may then be non-personalised, based on the page you are reading rather than on your browsing.</p>

<h2>Your choices</h2>
<ul>
<li><strong>Change your cookie choice</strong> at any time: <button type="button" class="text-btn" data-open-consent>Cookie settings</button> (also in the footer of every page).</li>
<li><strong>Clear stored data</strong> by clearing this site’s data in your browser settings.</li>
<li><strong>Opt out of personalised ads</strong> using the Google and aboutads.info links above.</li>
</ul>

<h2>Your rights</h2>
<p>If you are in the UK or the European Economic Area, you have rights over your personal data, including the right to ask what we hold, to have it corrected or deleted, and to object to its use. Contact us at the email above. You can also complain to your data protection authority; in the UK this is the <a href="https://ico.org.uk/" target="_blank" rel="noopener">Information Commissioner’s Office</a>.</p>

<h2>Children</h2>
<p>Hamropedia is not directed at children under 13, and we do not knowingly collect personal information from them.</p>

<h2>Links to other websites</h2>
<p>Articles link to official sources and other websites. We are not responsible for their content or their privacy practices.</p>

<h2>Changes to this policy</h2>
<p>We may update this policy, for example when advertising starts. The date at the top shows the latest version.</p>`,
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
