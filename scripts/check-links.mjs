// Checks every resource URL in src/data/roadmap.json and prints the ones that fail.
// Usage: node scripts/check-links.mjs [--json out.json]
import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync(new URL('../src/data/roadmap.json', import.meta.url)));
const urls = new Set();
for (const p of data) {
  for (const r of [...p.main, ...p.deeper]) if (r.url) urls.add(r.url);
  for (const t of p.topics) for (const r of t.resources) if (r.url) urls.add(r.url);
}
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      if (res.status < 400) return { url, status: res.status, final: res.url };
      if (method === 'GET') return { url, status: res.status, final: res.url };
    } catch (e) {
      if (method === 'GET') return { url, status: 0, error: String(e.cause?.code || e.name) };
    }
  }
}
const list = [...urls];
const results = [];
for (let i = 0; i < list.length; i += 12) {
  results.push(...(await Promise.all(list.slice(i, i + 12).map(check))));
}
const bad = results.filter((r) => r.status === 0 || r.status >= 400);
console.log(`${list.length} urls checked, ${bad.length} failing`);
for (const b of bad) console.log(b.status, b.error || '', b.url);
const out = process.argv.indexOf('--json');
if (out > 0) fs.writeFileSync(process.argv[out + 1], JSON.stringify(results, null, 1));
