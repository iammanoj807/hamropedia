// For every Nepali article, check that each number in the English original also
// appears in the Nepali text (after converting Devanagari digits). Wrong or
// missing numbers are the main risk when translating news.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NE = path.join(ROOT, 'src/content/posts-ne');
const EN = path.join(ROOT, 'src/content/posts');
const DEV = '०१२३४५६७८९';
const latin = (s) => s.replace(/[०-९]/g, (d) => String(DEV.indexOf(d)));
const numbers = (s) => new Set([...latin(s).replace(/(\d),(\d{3})/g, '$1$2').matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]));

let problems = 0;
for (const f of fs.readdirSync(NE).filter((x) => x.endsWith('.md'))) {
  const en = matter(fs.readFileSync(path.join(EN, f), 'utf8'));
  const ne = matter(fs.readFileSync(path.join(NE, f), 'utf8'));
  const want = numbers(en.content);
  const have = numbers(ne.content);
  const missing = [...want].filter((n) => !have.has(n));
  const extra = [...have].filter((n) => !want.has(n));
  if (missing.length) { problems++; console.log(`✖ ${f}\n   missing in Nepali: ${missing.join(', ')}`); }
  if (extra.length) console.log(`  ${f}\n   only in Nepali (check these): ${extra.join(', ')}`);
}
if (problems) process.exit(1);
console.log('✔ every number in the English articles appears in the Nepali versions');
