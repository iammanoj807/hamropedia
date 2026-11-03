// Pieces shared by the course pages (roadmap index, phases, lessons).
import fs from 'node:fs';
import { esc } from '../lib/util.js';

export const readCourse = (name) => JSON.parse(fs.readFileSync(new URL(`../data/courses/${name}.json`, import.meta.url), 'utf8'));

export const KIND = {
  watch: ['Watch', 'k-watch'],
  play: ['Interactive', 'k-play'],
  read: ['Read', 'k-read'],
  code: ['Code', 'k-code'],
  paper: ['Paper', 'k-paper'],
  practice: ['Practice', 'k-code'],
};
export const KIND_ORDER = ['watch', 'play', 'read', 'practice', 'code', 'paper'];

export function link(r, label) {
  return r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${label}</a>` : `<span>${label}</span>`;
}

/** A topic's own resources, by kind, with the one marked "Worth it" highlighted. */
export function topicResources(resources) {
  const sorted = [...resources].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  return `<ul class="res-list">
${sorted
  .map(
    (r) => `<li class="res${r.recommended ? ' res-pick' : ''}">
  <span class="kind ${KIND[r.kind]?.[1] || ''}">${KIND[r.kind]?.[0] || esc(r.kind)}</span>
  <div>
    <p class="res-title">${link(r, esc(r.title))}</p>
    <p class="res-src">${esc(r.source)}${r.kind === 'paper' ? ' · optional' : ''}</p>
    ${r.recommended ? `<p class="res-why"><b>Worth it:</b> ${esc(r.recommended)}</p>` : ''}
  </div>
</li>`,
  )
  .join('\n')}
</ul>`;
}

/** A phase's backbone books and courses. */
export function backbone(list, heading, id) {
  if (!list?.length) return '';
  return `<section class="rm-backbone" aria-labelledby="${id}">
  <h2 id="${id}">${heading}</h2>
  <ul class="res-list res-list-wide">
    ${list
      .map(
        (r) => `<li class="res">
      <span class="kind k-book">${esc(r.kind)}</span>
      <div><p class="res-title">${link(r, esc(r.title))}${r.paid ? ' <span class="tag-paid">Paid</span>' : r.free ? ' <span class="tag-free">Free</span>' : ''}</p>
      <p class="res-why">${esc(r.why)}</p></div>
    </li>`,
      )
      .join('')}
  </ul>
</section>`;
}

/**
 * "Your progress": what is ticked in this browser, and buttons to download it as
 * a file or load a file (assets/js/roadmap.js). No account: the file never leaves the device.
 */
export function progressBackup(id = 'your-progress') {
  return `<section class="backup" id="${id}" aria-labelledby="${id}-h" data-backup>
  <h2 id="${id}-h">Your progress</h2>
  <p>Your ticks are saved in this browser only, with no account. To keep them safe, or to carry on on another device, download a progress file and load it there. The file is made on your device and never sent to us.</p>
  <p class="backup-status muted" data-backup-status></p>
  <div class="backup-actions">
    <button type="button" class="btn-ghost" data-backup-download>Download my progress</button>
    <button type="button" class="btn-ghost" data-backup-pick>Load a progress file</button>
    <input type="file" accept="application/json,.json" data-backup-file hidden>
  </div>
  <p class="backup-msg" data-backup-msg aria-live="polite"></p>
</section>`;
}

/** Cut text to at most `max` characters at a word boundary, for meta descriptions. */
export function clip(text, max = 155) {
  const s = String(text).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '…';
}
