import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';
import plaintext from 'highlight.js/lib/languages/plaintext';
import { esc, slugify } from './util.js';

hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('text', plaintext);

/**
 * Render post Markdown to HTML.
 * @param {string} md
 * @param {{ imageSize?: (src: string) => {width:number,height:number}|null, siteHost: string }} ctx
 * @returns {{ html: string, toc: {id:string, text:string, level:number}[] }}
 */
export function renderMarkdown(md, ctx) {
  const toc = [];
  const used = new Set();
  const marked = new Marked({ gfm: true });

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const text = inner.replace(/<[^>]+>/g, '');
        let id = slugify(text) || 'section';
        while (used.has(id)) id += '-x';
        used.add(id);
        if (depth === 2 || depth === 3) toc.push({ id, text, level: depth });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${depth}>\n`;
      },
      code({ text, lang }) {
        const language = (lang || '').trim().split(/\s+/)[0];
        const known = language && hljs.getLanguage(language);
        const body = known ? hljs.highlight(text, { language }).value : esc(text);
        const label = language ? `<span class="code-lang">${esc(language)}</span>` : '';
        return `<div class="code-block">${label}<button class="copy-code" type="button" aria-label="Copy code">Copy</button><pre><code class="hljs${known ? ` language-${language}` : ''}">${body}</code></pre></div>\n`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) && !href.includes(ctx.siteHost);
        const t = title ? ` title="${esc(title)}"` : '';
        const rel = external ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${esc(href)}"${t}${rel}>${inner}</a>`;
      },
      image({ href, title, text }) {
        const size = ctx.imageSize ? ctx.imageSize(href) : null;
        const dims = size ? ` width="${size.width}" height="${size.height}"` : '';
        const img = `<img src="${esc(href)}" alt="${esc(text)}"${dims} loading="lazy" decoding="async">`;
        return title ? `<figure>${img}<figcaption>${esc(title)}</figcaption></figure>` : img;
      },
    },
  });

  let html = marked.parse(md);
  // wrap tables so they scroll on small screens instead of the page
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  // Callouts: a blockquote starting with **Note:**, **Update:**, **Tip:** ... or a
  // key-facts box starting with **At a glance** (Nepali: **एक नजरमा**).
  html = html.replace(
    /<blockquote>\s*<p><strong>(Note|Update|Tip|Warning|Important|अपडेट)([^<]*)<\/strong>/g,
    (m, kind, rest) => `<blockquote class="callout callout-${kind === 'अपडेट' ? 'update' : kind.toLowerCase()}"><p><strong>${kind}${rest}</strong>`,
  );
  html = html.replace(
    /<blockquote>\s*<p><strong>(At a glance|एक नजरमा)<\/strong><\/p>/g,
    (m, label) => `<blockquote class="callout callout-glance"><p class="glance-h"><strong>${label}</strong></p>`,
  );
  return { html, toc };
}
