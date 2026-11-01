// Hamropedia static site generator. `npm run build` writes the whole site to dist/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { site, categories, redirects } from './src/data/site.js';
import { renderMarkdown } from './src/lib/markdown.js';
import { readingMinutes, isoDate, rfc822, esc } from './src/lib/util.js';
import { renderPost, renderBlogIndex, renderCategory, renderNews } from './src/pages/posts.js';
import { renderRoadmapIndex, renderPhase, phases } from './src/pages/roadmap.js';
import { renderToolsHub, renderRomanized, renderPreeti, renderDate, TOOLS } from './src/pages/tools.js';
import { renderHome } from './src/pages/home.js';
import { renderAbout, renderContact, renderPrivacy, renderTerms, render404, renderRedirect } from './src/pages/static.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const POSTS_DIR = path.join(ROOT, 'src/content/posts');
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

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
const sizes = new Map();
const raw = files.map((f) => {
  const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf8'));
  return { file: f, data, content };
});

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
const posts = raw
  .filter((r) => !r.data.draft)
  .map(({ file, data, content }) => {
    for (const key of ['title', 'description', 'date', 'category']) {
      if (!data[key]) throw new Error(`${file}: missing "${key}" in front matter`);
    }
    if (!categories[data.category]) throw new Error(`${file}: unknown category "${data.category}"`);
    const slug = data.slug || file.replace(/\.md$/, '');
    const { html, toc } = renderMarkdown(content, { imageSize: (src) => sizes.get(src) || null, siteHost: 'hamropedia.com' });
    const cover = `/images/covers/${slug}.webp`;
    const og = `/images/og/${slug}.jpg`;
    return {
      ...data,
      slug,
      url: `/${slug}/`,
      date: isoDate(data.date),
      updated: data.updated ? isoDate(data.updated) : null,
      type: data.type || 'guide',
      html,
      toc,
      readingMinutes: readingMinutes(content),
      coverCard: exists(cover) ? cover : `/images/covers/default-${data.category}.webp`,
      ogImage: exists(og) ? og : '/images/og-default.jpg',
    };
  })
  .sort((a, b) => (b.updated || b.date).localeCompare(a.updated || a.date) || b.date.localeCompare(a.date));

// ---------------------------------------------------------------------------
// Pages

const pages = new Map(); // path -> html
const add = (p, html) => {
  if (pages.has(p)) throw new Error(`Duplicate page ${p}`);
  pages.set(p, html);
};

add('/', renderHome(posts, version));
add('/blog/', renderBlogIndex(posts, version));
add('/news/', renderNews([...posts].sort((a, b) => b.date.localeCompare(a.date)), version));
for (const slug of Object.keys(categories)) {
  const list = posts.filter((p) => p.category === slug);
  if (list.length) add(`/category/${slug}/`, renderCategory(slug, list, version));
}
for (const p of posts) add(p.url, renderPost(p, posts, version));

add('/ai-roadmap/', renderRoadmapIndex(version));
phases.forEach((p, i) => add(`/ai-roadmap/${p.slug}/`, renderPhase(p, i, version)));

add('/tools/', renderToolsHub(version));
add('/tools/english-to-nepali/', renderRomanized(version));
add('/tools/preeti-to-unicode/', renderPreeti(version));
add('/tools/nepali-date-converter/', renderDate(version));

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
const lastmod = new Map(posts.map((p) => [p.url, p.updated || p.date]));
const newest = posts[0] ? posts[0].updated || posts[0].date : today;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pages.keys()]
  .map((p) => `  <url><loc>${site.url}${p}</loc><lastmod>${lastmod.get(p) || (['/', '/blog/', '/news/'].includes(p) || p.startsWith('/category/') ? newest : today)}</lastmod></url>`)
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

console.log(
  `Built ${pages.size} pages + ${redirects.length} redirects + 404 from ${posts.length} posts, ${phases.length} roadmap phases, ${TOOLS.length} tools in ${Date.now() - t0} ms`,
);
