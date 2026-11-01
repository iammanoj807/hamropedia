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
  '/category/coding/', '/category/study-abroad/',
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
  }
}

for (const u of OLD_WORDPRESS_URLS) if (!resolve(u)) problems.push(`old WordPress URL no longer resolves: ${u}`);

if (problems.length) {
  console.error(`✖ ${problems.length} problem(s):\n` + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`✔ ${htmlFiles.length} HTML files checked: internal links, images, old URLs, titles, descriptions, canonicals all OK`);
