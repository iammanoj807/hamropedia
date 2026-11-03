// Course index and phase pages (AI & ML roadmap, System Design, ...) and the
// Learn page: show how far the reader has got, and back the ticks up to a file.
// Ticks are made on each lesson page and kept in this browser only. Each
// [data-course] section says which course its progress bars belong to; a page
// without one is the AI roadmap.
import { openProgress, pageProgress, paintTopics } from './lib/progress.js';
import { buildBackup, mergeBackup, summary, describe } from './lib/backup.js';

function paintAll() {
  const scopes = document.querySelectorAll('[data-course]');
  for (const root of scopes.length ? scopes : [document]) {
    const { progress, checks } = pageProgress(root === document ? null : root);
    root.querySelectorAll('[data-phase-progress]').forEach((el) => {
      const total = Number(el.dataset.total) || 1;
      const n = progress.doneCount(el.dataset.phaseProgress);
      el.firstElementChild.style.width = `${Math.min(100, (n / total) * 100)}%`;
      el.title = `${n} of ${total} lessons done`;
    });
    root.querySelectorAll('[data-phase-count]').forEach((el) => {
      el.textContent = `${progress.doneCount(el.dataset.phaseCount)} of ${el.dataset.total} done`;
    });
    const all = root.querySelector('[data-rm-done]');
    if (all) all.textContent = String(progress.doneCount());
    paintTopics(progress, checks, root);
  }
}
paintAll();

// ---- back up / load progress -------------------------------------------------
const box = document.querySelector('[data-backup]');
if (box) {
  const storage = {
    keys: () => { try { return Object.keys(localStorage); } catch { return []; } },
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => {
      try { localStorage.setItem(k, v); } catch { throw new Error('This browser is not letting the site save anything (private browsing, or storage turned off).'); }
    },
  };
  // Old single ticks on the AI roadmap become full ticks before anything is backed up.
  openProgress({ key: 'hp-course-ml', checks: ['explain', 'derive', 'build', 'break'], legacyKey: 'hp-roadmap-done' });

  const msg = box.querySelector('[data-backup-msg]');
  const status = box.querySelector('[data-backup-status]');
  const input = box.querySelector('[data-backup-file]');
  const say = (text, bad = false) => { msg.textContent = text; msg.classList.toggle('bad', bad); };
  const showStatus = () => {
    const s = summary(buildBackup(storage));
    status.textContent = s.length ? `In this browser now: ${describe(s)}.` : 'Nothing is ticked or saved in this browser yet.';
  };
  showStatus();

  box.querySelector('[data-backup-download]').addEventListener('click', () => {
    const backup = buildBackup(storage);
    if (!Object.keys(backup.courses).length && !backup.sqlQueries && !backup.dsa) { say('There is nothing to download yet. Tick a check in any lesson first.', true); return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 1)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `hamropedia-progress-${backup.exported.slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    say(`Downloaded ${describe(summary(backup))}. Keep the file somewhere safe, or load it on your other device.`);
  });

  box.querySelector('[data-backup-pick]').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('That file is too big to be a Hamropedia progress file.');
      let data;
      try { data = JSON.parse(await file.text()); } catch { throw new Error('This file is not a Hamropedia progress file.'); }
      const loaded = mergeBackup(storage, data);
      if (!loaded.length) { say('Nothing new in that file: everything in it is already in this browser.', true); return; }
      say(`Loaded ${describe(loaded)}. Everything already in this browser was kept.`);
      paintAll();
      showStatus();
      window.dispatchEvent(new CustomEvent('hamropedia:progress-loaded')); // other parts of the page (DSA) repaint
    } catch (e) {
      say(e.message, true);
    }
  });
}
