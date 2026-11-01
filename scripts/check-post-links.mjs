// Checks every external link in the articles (src/content/posts/*.md).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src/content/posts');
const urls = new Map();
for (const f of fs.readdirSync(dir)) for (const [, u] of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
  if (!urls.has(u)) urls.set(u, new Set());
  urls.get(u).add(f);
}
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const check = async (u) => {
  try {
    const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html' }, signal: AbortSignal.timeout(20000) });
    return [u, r.status, r.url !== u ? r.url : ''];
  } catch (e) { return [u, 0, String(e.cause?.code || e.name)]; }
};
const list = [...urls.keys()];
const out = [];
for (let i = 0; i < list.length; i += 10) out.push(...await Promise.all(list.slice(i, i + 10).map(check)));
const bad = out.filter(([, s]) => s === 0 || s >= 400);
console.log(`${list.length} links, ${bad.length} not OK`);
for (const [u, s, x] of bad) console.log(s, u, x, '<-', [...urls.get(u)].join(', '));
