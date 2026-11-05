// Hamropedia static site generator. `npm run build` writes the whole site to dist/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { site, categories, redirects } from './src/data/site.js';
import { renderMarkdown, extractFaqs } from './src/lib/markdown.js';
import { readingMinutes, isoDate, rfc822, esc } from './src/lib/util.js';
import { renderPost, renderBlogIndex, renderCategory, renderNews, renderNeHub } from './src/pages/posts.js';
import { renderRoadmapIndex, renderPhase, renderLessons, lessonAnimations, phases } from './src/pages/roadmap.js';
import { renderToolsHub, renderRomanized, renderPreeti, renderKeyboard, renderDate, renderAge, renderDvPhoto, renderPassportPhoto, TOOLS } from './src/pages/tools.js';
import { renderHome } from './src/pages/home.js';
import { renderLearn } from './src/pages/learn.js';
import { renderSdIndex, renderSdPhase, renderSdLessons, renderSdRevise, sdAnimations, sdPhases } from './src/pages/system-design.js';
import { renderSqlIndex, renderSqlDatabase, renderSqlPhase, renderSqlLessons, renderSqlRevise, sqlAnimations, sqlPracticeDb, sqlPhases } from './src/pages/sql.js';
import { renderDsaHub, renderDsaTopic, renderDsaPatterns, dsaAnimations, dsaTopics } from './src/pages/dsa.js';
import { renderAbout, renderContact, renderPrivacy, renderTerms, render404, renderRedirect } from './src/pages/static.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const POSTS_DIR = path.join(ROOT, 'src/content/posts');
const POSTS_NE_DIR = path.join(ROOT, 'src/content/posts-ne');
const t0 = Date.now();

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(PUBLIC, DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'src/assets'), path.join(DIST, 'assets'), { recursive: true });

const css = fs.readFileSync(path.join(ROOT, 'src/assets/css/site.css'), 'utf8');
const version = crypto.createHash('sha1').update(css).digest('hex').slice(0, 8);

// ---------------------------------------------------------------------------
// Posts

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('sharp not installed: images will be rendered without width/height');
}

const sizes = new Map();
function readDir(dir, lang) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { file: f, data, content, lang };
  });
}
const raw = [...readDir(POSTS_DIR, 'en'), ...readDir(POSTS_NE_DIR, 'ne')];

for (const { content } of raw) {
  for (const [, src] of content.matchAll(/!\[[^\]]*\]\((\/images\/[^)\s]+)/g)) {
    if (sizes.has(src) || !sharp) continue;
    const file = path.join(PUBLIC, decodeURI(src));
    if (!fs.existsSync(file)) throw new Error(`Missing image ${src}`);
    const m = await sharp(file).metadata();
    sizes.set(src, { width: m.width, height: m.height });
  }
}

const exists = (p) => fs.existsSync(path.join(PUBLIC, p));
const toPost = ({ file, data, content, lang }) => {
  for (const key of ['title', 'description', 'date', 'category']) {
    if (!data[key]) throw new Error(`${file}: missing "${key}" in front matter`);
  }
  if (!categories[data.category]) throw new Error(`${file}: unknown category "${data.category}"`);
  const slug = data.slug || file.replace(/\.md$/, '');
  const { html, toc } = renderMarkdown(content, { imageSize: (src) => sizes.get(src) || null, siteHost: 'hamropedia.com' });
  const og = `/images/og/${slug}.jpg`;
  return {
    ...data,
    lang,
    slug,
    url: lang === 'ne' ? `/ne/${slug}/` : `/${slug}/`,
    date: isoDate(data.date),
    updated: data.updated ? isoDate(data.updated) : null,
    type: data.type || 'guide',
    html,
    toc,
    readingMinutes: readingMinutes(content),
    faqs: extractFaqs(content),
    ogImage: exists(og) ? og : '/images/og-default.jpg',
  };
};
// Newest news first: posts are dated to when the news happened.
const byDate = (a, b) => b.date.localeCompare(a.date) || (b.updated || '').localeCompare(a.updated || '');
const posts = raw.filter((r) => r.lang === 'en' && !r.data.draft).map(toPost).sort(byDate);
const nePosts = raw.filter((r) => r.lang === 'ne' && !r.data.draft).map(toPost).sort(byDate);
const enBySlug = new Map(posts.map((p) => [p.slug, p]));
for (const n of nePosts) {
  const en = enBySlug.get(n.slug);
  if (!en) throw new Error(`Nepali post ${n.slug} has no English original with the same file name`);
  if (n.date !== en.date) throw new Error(`Nepali post ${n.slug}: date ${n.date} differs from English ${en.date}`);
  n.ogImage = en.ogImage;
  n.coverWord = n.coverWord || en.coverWord;
}
const neBySlug = new Map(nePosts.map((p) => [p.slug, p]));

// ---------------------------------------------------------------------------
// Pages

const pages = new Map(); // path -> html
const add = (p, html) => {
  if (pages.has(p)) throw new Error(`Duplicate page ${p}`);
  pages.set(p, html);
};

add('/', renderHome(posts, version));
add('/blog/', renderBlogIndex(posts, version));
add('/news/', renderNews(posts, version));
add('/ne/', renderNeHub(nePosts, version));
for (const slug of Object.keys(categories)) {
  const list = posts.filter((p) => p.category === slug);
  if (list.length) add(`/category/${slug}/`, renderCategory(slug, list, version));
}
for (const p of posts) add(p.url, renderPost(p, posts, version, neBySlug.get(p.slug)));
for (const p of nePosts) add(p.url, renderPost(p, nePosts, version, enBySlug.get(p.slug)));

add('/learn/', renderLearn(posts, version));
add('/ai-roadmap/', renderRoadmapIndex(version));
phases.forEach((p, i) => add(`/ai-roadmap/${p.slug}/`, renderPhase(p, i, version)));
const lessons = renderLessons(version);
for (const [p, html] of lessons) add(p, html);
// Each lesson's animation, fetched by the player only when it comes into view.
add('/system-design/', renderSdIndex(version));
sdPhases.forEach((p, i) => add(`/system-design/${p.slug}/`, renderSdPhase(p, i, version)));
const sdLessons = renderSdLessons(version);
for (const [p, html] of sdLessons) add(p, html);
add('/system-design/revise/', renderSdRevise(version));
add('/sql/', renderSqlIndex(version));
add('/sql/practice-database/', renderSqlDatabase(version));
sqlPhases.forEach((p, i) => add(`/sql/${p.slug}/`, renderSqlPhase(p, i, version)));
const sqlLessons = renderSqlLessons(version);
for (const [p, html] of sqlLessons) add(p, html);
add('/sql/revise/', renderSqlRevise(version));
add('/dsa/', renderDsaHub(version));
add('/dsa/patterns/', renderDsaPatterns(version));
for (const t of dsaTopics) add(`/dsa/${t.slug}/`, renderDsaTopic(t, version));
for (const [file, json] of [...lessonAnimations(), ...sdAnimations(), ...sqlAnimations(), ...sqlPracticeDb(), ...dsaAnimations()]) {
  fs.mkdirSync(path.dirname(path.join(DIST, file)), { recursive: true });
  fs.writeFileSync(path.join(DIST, file), json);
}

add('/tools/', renderToolsHub(version));
add('/tools/english-to-nepali/', renderRomanized(version));
add('/tools/preeti-to-unicode/', renderPreeti(version));
add('/tools/nepali-keyboard/', renderKeyboard(version));
add('/tools/age-calculator/', renderAge(version));
add('/tools/nepali-date-converter/', renderDate(version));
add('/tools/dv-photo-tool/', renderDvPhoto(version));
add('/tools/passport-size-photo-maker/', renderPassportPhoto(version));

add('/about-us/', renderAbout(version));
add('/contact-us/', renderContact(version));
add('/privacy-policy/', renderPrivacy(version));
add('/terms-of-use-hamropedia/', renderTerms(version));

for (const [p, html] of pages) {
  const out = path.join(DIST, p, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}
fs.writeFileSync(path.join(DIST, '404.html'), render404(version));

for (const r of redirects) {
  if (pages.has(r.from)) throw new Error(`Redirect ${r.from} would overwrite a real page`);
  const out = path.join(DIST, r.from, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderRedirect(r));
}

// ---------------------------------------------------------------------------
// sitemap.xml, robots.txt, rss.xml

const today = isoDate(new Date());
const lastmod = new Map([...posts, ...nePosts].map((p) => [p.url, p.updated || p.date]));
const newest = [...posts, ...nePosts].map((p) => p.updated || p.date).sort().pop() || today;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pages.keys()]
  .filter((p) => !pages.get(p).includes('<meta name="robots" content="noindex')) // e.g. revision notes that repeat the lessons
  .map((p) => `  <url><loc>${site.url}${p}</loc><lastmod>${lastmod.get(p) || (['/', '/blog/', '/news/', '/ne/'].includes(p) || p.startsWith('/category/') ? newest : today)}</lastmod></url>`)
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
// The old WordPress (Yoast) sitemap lived at /sitemap_index.xml and may still be
// submitted in Search Console, so keep that address working as a sitemap index.
fs.writeFileSync(
  path.join(DIST, 'sitemap_index.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${site.url}/sitemap.xml</loc><lastmod>${newest}</lastmod></sitemap>\n</sitemapindex>\n`,
);

fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(site.name)}</title>
  <link>${site.url}/</link>
  <description>${esc(site.description)}</description>
  <language>en</language>
  <lastBuildDate>${rfc822(new Date())}</lastBuildDate>
  <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>
${[...posts]
  .sort((a, b) => b.date.localeCompare(a.date))
  .map(
    (p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${site.url}${p.url}</link>
    <guid isPermaLink="true">${site.url}${p.url}</guid>
    <pubDate>${rfc822(p.date)}</pubDate>
    <category>${esc(categories[p.category].name)}</category>
    <description>${esc(p.description)}</description>
  </item>`,
  )
  .join('\n')}
</channel>
</rss>
`;
fs.writeFileSync(path.join(DIST, 'rss.xml'), rss);

// GitHub Pages: don't run Jekyll on the output.
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// Minify the CSS and JavaScript we serve (smaller downloads; Semrush flags unminified files).
// The source files stay readable. If esbuild is not installed, the site is served unminified.
let minified = 0;
try {
  const { transformSync } = await import('esbuild');
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      const loader = e.name.endsWith('.css') ? 'css' : e.name.endsWith('.js') ? 'js' : null;
      if (!loader) continue;
      const out = transformSync(fs.readFileSync(p, 'utf8'), { loader, minify: true, format: loader === 'js' ? 'esm' : undefined, target: 'es2020', legalComments: 'none' });
      fs.writeFileSync(p, out.code);
      minified++;
    }
  })(path.join(DIST, 'assets'));
} catch (err) {
  if (err.code !== 'ERR_MODULE_NOT_FOUND') throw err;
  console.warn('esbuild not installed: CSS and JavaScript are served unminified');
}

console.log(
  `Built ${pages.size} pages + ${redirects.length} redirects + 404 from ${posts.length} posts (${nePosts.length} in Nepali), ${phases.length} roadmap phases with ${lessons.length} lessons, ${sdLessons.length} system design lessons, ${sqlLessons.length} SQL lessons, ${dsaTopics.length} DSA topics, ${TOOLS.length} tools, ${minified} CSS/JS files minified in ${Date.now() - t0} ms`,
);
