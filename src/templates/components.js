import { site, categories } from '../data/site.js';
import { esc, shortDate, isoDate, abs } from '../lib/util.js';
import { coverArtSvg } from '../lib/art.js';
import { formatBs, adToBs, toNepaliDigits } from '../assets/js/lib/bs-date.js';
import { ICONS } from './layout.js';

export function categoryChip(slug, linked = true, lang = 'en') {
  const c = categories[slug];
  if (!c) return '';
  const inner = `<span class="chip chip-${c.hue}">${esc(lang === 'ne' ? c.nameNe || c.name : c.name)}</span>`;
  return linked ? `<a class="chip-link" href="/category/${slug}/">${inner}</a>` : inner;
}

/** Cover art for a post (inline SVG, coloured by CSS). */
export function cover(post, extraClass = '') {
  const c = categories[post.category];
  const label = post.lang === 'ne' ? c.nameNe || c.name : c.name;
  return `<span class="cover cover-${post.category}${extraClass ? ' ' + extraClass : ''}">${coverArtSvg({ word: post.coverWord || post.title.split(' ')[0], oneLine: Boolean(post.coverOneLine), category: post.category, seed: post.slug, label })}</span>`;
}

/** "1 Nov 2026", or for Nepali pages "२०८३ कात्तिक १५". */
export function displayDate(d, lang = 'en') {
  if (lang !== 'ne') return shortDate(d);
  const [y, m, day] = isoDate(d).split('-').map(Number);
  try { return formatBs({ ...adToBs(y, m, day), weekday: undefined }); } catch { return toNepaliDigits(isoDate(d)); }
}

export function postCard(post, { size = 'md' } = {}) {
  const ne = post.lang === 'ne';
  return `<article class="card card-${size}"${ne ? ' lang="ne"' : ''}>
  <a class="card-media" href="${post.url}" tabindex="-1" aria-hidden="true">${cover(post)}</a>
  <div class="card-body">
    <div class="card-meta">${categoryChip(post.category, false, post.lang)}<span>${ne ? `${toNepaliDigits(post.readingMinutes)} मिनेट पढाइ` : `${post.readingMinutes} min read`}</span></div>
    <h3 class="card-title"><a href="${post.url}">${esc(post.title)}</a></h3>
    <p class="card-excerpt">${esc(post.description)}</p>
    <p class="card-date"><time datetime="${isoDate(post.date)}">${displayDate(post.date, post.lang)}</time></p>
  </div>
</article>`;
}

export function breadcrumbs(items) {
  // items: [{ name, path }], last is the current page
  const html = items
    .map((it, i) =>
      i === items.length - 1
        ? `<li aria-current="page">${esc(it.name)}</li>`
        : `<li><a href="${it.path}">${esc(it.name)}</a></li>`,
    )
    .join('');
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${html}</ol></nav>`;
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(site.url, it.path),
    })),
  };
}

export function shareBar(url, title, lang = 'en') {
  const ne = lang === 'ne';
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return `<div class="share" aria-label="Share this page">
  <span class="share-label">${ne ? 'सेयर गर्नुहोस्' : 'Share'}</span>
  <a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" aria-label="Share on Facebook">${ICONS.facebook}</a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener" aria-label="Share on LinkedIn">${ICONS.linkedin}</a>
  <a href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener" aria-label="Share on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.5-.3Z"/></svg></a>
  <a href="https://x.com/intent/post?url=${u}&text=${t}" target="_blank" rel="noopener" aria-label="Share on X"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5Z"/></svg></a>
  <button type="button" class="copy-link" data-url="${esc(url)}" aria-label="Copy link"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>${ne ? 'लिंक कपी' : 'Copy link'}</span></button>
</div>`;
}

export function pageHead({ eyebrow, title, lead, crumbs }) {
  return `<section class="page-head">
  <div class="wrap">
    ${crumbs ? breadcrumbs(crumbs) : ''}
    ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
    <h1>${title}</h1>
    ${lead ? `<p class="lead">${lead}</p>` : ''}
  </div>
</section>`;
}

export function faqBlock(faqs) {
  return `<section class="faq" aria-labelledby="faq-h">
  <h2 id="faq-h">Frequently asked questions</h2>
  ${faqs
    .map((f) => `<details><summary>${esc(f.q)}</summary><div class="faq-a">${f.a}</div></details>`)
    .join('\n')}
</section>`;
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
    })),
  };
}

export const arrow = ICONS.arrow;
