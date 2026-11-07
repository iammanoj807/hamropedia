// Post-build checks. Fails (exit 1) if anything is broken.
//  - every internal href/src in dist/*.html points to a file that exists
//  - every URL from the old WordPress site still resolves (page or redirect)
//  - no references to the old wp-content uploads remain
//  - every page has exactly one <h1>, a title, a description and a canonical
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const problems = [];

const OLD_WORDPRESS_URLS = [
  '/', '/about-us/', '/contact-us/', '/blog/', '/privacy-policy/', '/terms-of-use-hamropedia/',
  '/category/coding/', '/category/study-abroad/', '/category/online-marketing/', '/sitemap_index.xml', '/ads.txt',
  '/python-decorators-explained-for-beginners/',
  '/top-skills-for-nepali-students-to-get-high-paying-jobs-in-canada-in-2025/',
  '/the-top-destination-for-nepali-students-studying-abroad-in-2025/',
  '/a-guide-to-the-top-5-programming-languages-to-learn-in-2025/',
  '/coding-for-beginners-the-complete-roadmap-for-nepali-students-in-2025/',
  '/devin-the-worlds-first-ai-software-engineer-who-never-sleeps/',
  '/important-details-about-wes-evaluation-for-nepali-students/',
  '/uk-immigration-2025-new-student-visa-rules-explained-simply/',
  '/how-to-apply-for-wes-evaluation-in-2025-a-complete-step-by-step-guide/',
  '/top-ukvi-interview-question-examples-and-answers/',
  '/how-to-apply-noc-online-easy-steps-for-nepali-students/',
  '/how-to-apply-for-wes-evaluation/',
  '/nepal-national-ai-policy-2082-explained/',
  '/ne/nepal-national-ai-policy-2082-explained/',
];

function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (!clean) return true;
  const f = path.join(DIST, clean);
  if (clean.endsWith('/')) return fs.existsSync(path.join(f, 'index.html'));
  return fs.existsSync(f);
}

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

for (const file of htmlFiles) {
  const rel = '/' + path.relative(DIST, file);
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('wp-content')) problems.push(`${rel}: still references wp-content`);
  for (const [, attr, url] of html.matchAll(/\s(href|src)="(\/[^"]*)"/g)) {
    if (url.startsWith('//')) continue;
    if (!resolve(url)) problems.push(`${rel}: broken ${attr} ${url}`);
  }
  const isRedirect = html.includes('http-equiv="refresh"');
  if (!isRedirect) {
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) problems.push(`${rel}: ${h1} <h1> elements`);
    if (!/<meta name="description" content="[^"]{50,}"/.test(html)) problems.push(`${rel}: missing/short description`);
    if (!rel.endsWith('404.html') && !/<link rel="canonical" href="https:\/\/hamropedia\.com\//.test(html)) problems.push(`${rel}: missing canonical`);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || '';
    if (title.length < 15) problems.push(`${rel}: short title`);
    // English articles: keep what Google shows within its limits (about 60 characters for the
    // title link, about 160 for the snippet). Set seoTitle and description in the post's front matter.
    if (/<html lang="en">/.test(html) && html.includes('<meta property="og:type" content="article">')) {
      const text = (t) => t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      const desc = text(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '');
      if (text(title).length > 70) problems.push(`${rel}: title is ${text(title).length} characters (keep seoTitle under 60)`);
      if (desc.length > 160) problems.push(`${rel}: description is ${desc.length} characters (keep it under 160)`);
    }
  }
}

for (const u of OLD_WORDPRESS_URLS) if (!resolve(u)) problems.push(`old WordPress URL no longer resolves: ${u}`);

// Language versions: every hreflang target must exist and link back; Nepali pages must say lang="ne".
const pageFor = (url) => {
  const p = url.replace('https://hamropedia.com', '');
  return path.join(DIST, p, p.endsWith('/') ? 'index.html' : '');
};
for (const file of htmlFiles) {
  const rel = '/' + path.relative(DIST, file).replace(/index\.html$/, '');
  const html = fs.readFileSync(file, 'utf8');
  if (rel.startsWith('/ne/') && !/<html lang="ne">/.test(html)) problems.push(`${rel}: Nepali page without lang="ne"`);
  for (const [, lang, href] of html.matchAll(/<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)">/g)) {
    if (lang === 'x-default') continue;
    const target = pageFor(href);
    if (!fs.existsSync(target)) { problems.push(`${rel}: hreflang ${lang} points to missing ${href}`); continue; }
    const back = fs.readFileSync(target, 'utf8');
    if (!back.includes(`href="https://hamropedia.com${rel}"`)) problems.push(`${rel}: ${href} does not link back (hreflang)`);
  }
}

if (problems.length) {
  console.error(`✖ ${problems.length} problem(s):\n` + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`✔ ${htmlFiles.length} HTML files checked: internal links, images, old URLs, titles, descriptions, canonicals all OK`);
