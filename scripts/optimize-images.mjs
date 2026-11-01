// Resize + convert screenshots to WebP. Usage:
//   node scripts/optimize-images.mjs <outDir> <file1> [file2 ...]   (outputs <outDir>/<name>.webp)
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
const [outDir, ...files] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
for (const f of files) {
  const name = path.basename(f).replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+$/,'').toLowerCase();
  const out = path.join(outDir, `${name}.webp`);
  const info = await sharp(f).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  console.log(`${path.basename(f)} -> ${out} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}
