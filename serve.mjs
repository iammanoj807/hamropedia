// Tiny static server for previewing dist/ the way GitHub Pages serves it.
// Usage: npm run serve   (PORT=4321 by default)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT) || 4321;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(DIST, url);
    if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.endsWith('/')) { res.writeHead(301, { location: url + '/' }).end(); return; }
      file = path.join(file, 'index.html');
    }
    // dist/ may be mid-rebuild: never crash on a missing file, just answer.
    const send = (status, f, type) => {
      const stream = fs.createReadStream(f);
      stream.on('error', () => { if (!res.headersSent) res.writeHead(503); res.end('Rebuilding, refresh in a moment.'); });
      stream.once('open', () => { res.writeHead(status, { 'content-type': type }); stream.pipe(res); });
    };
    if (!fs.existsSync(file)) {
      send(404, path.join(DIST, '404.html'), TYPES['.html']);
      return;
    }
    send(200, file, TYPES[path.extname(file)] || 'application/octet-stream');
  })
  .listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}`));
