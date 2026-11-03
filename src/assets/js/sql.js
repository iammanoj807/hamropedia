// SQL lessons and the practice database page: run boxes, "Try it", and saved
// queries. Queries run on a real SQLite engine (sql.js) in the browser, loaded
// from jsDelivr the first time someone presses Run, on a fresh copy of the
// practice database every time, so nothing a reader runs can break a lesson.
// Every query a reader changes and runs is saved in this browser.
import { loadQueries, saveQuery, deleteQuery } from './lib/queries.js';

const SQLJS = 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/';
const MAX_ROWS = 500;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- the engine ---------------------------------------------------------------
let engine = null;
function loadEngine() {
  engine ??= Promise.all([
    new Promise((resolve, reject) => {
      if (window.initSqlJs) { resolve(); return; }
      const s = document.createElement('script');
      s.src = `${SQLJS}sql-wasm.js`;
      s.onload = resolve;
      s.onerror = () => reject(new Error('The SQL engine could not be downloaded. Check your connection and press Run again.'));
      document.head.append(s);
    }).then(() => window.initSqlJs({ locateFile: (f) => SQLJS + f })),
    fetch('/assets/sql/practice-db.json').then((r) => { if (!r.ok) throw new Error('The practice database could not be loaded.'); return r.json(); }),
  ]).catch((e) => { engine = null; throw e; }); // let the next Run try again
  return engine;
}

/** Run one or more statements on a new copy of the practice database; the last result set wins. */
async function run(query) {
  const [SQL, practice] = await loadEngine();
  const db = new SQL.Database();
  try {
    db.run(practice.sql);
    let last = null;
    for (const st of db.iterateStatements(query)) {
      const columns = st.getColumnNames();
      const rows = [];
      while (st.step()) rows.push(st.get());
      st.free();
      if (columns.length) last = { columns, rows };
    }
    return last ? { ...last, changed: 0 } : { columns: [], rows: [], changed: db.getRowsModified() };
  } finally {
    db.close();
  }
}

const cell = (v) => (v === null ? '<td class="null">NULL</td>' : v instanceof Uint8Array ? '<td class="null">(binary)</td>' : `<td${typeof v === 'number' ? ' class="num"' : ''}>${esc(v)}</td>`);
function resultHtml(r, ms) {
  if (!r.columns.length) {
    return `<p class="result-done">Done${r.changed ? `: ${r.changed} ${r.changed === 1 ? 'row' : 'rows'} changed` : ''}. Each run uses a fresh copy of the practice database, so nothing is kept. Add a <code>SELECT</code> after it to see the change.</p>`;
  }
  const n = r.rows.length;
  const shown = r.rows.slice(0, MAX_ROWS);
  return `<div class="result">
  <p class="result-h">${n === 0 ? 'No rows' : `${n} ${n === 1 ? 'row' : 'rows'}`}${n > MAX_ROWS ? ` (showing the first ${MAX_ROWS})` : ''} <span class="muted">· ${ms} ms</span></p>
  <div class="table-wrap"><table class="rows"><thead><tr>${r.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${shown.map((row) => `<tr>${row.map(cell).join('')}</tr>`).join('')}</tbody></table></div>
</div>`;
}

// ---- run boxes ------------------------------------------------------------------
const RESTORE = new Set(['your-turn', 'practice', 'database']); // these boxes reopen with the last query run in them

function boxHtml({ sql, key, topic, topicName, place, label }) {
  return `<div class="sql-run" data-key="${esc(key)}" data-topic="${esc(topic)}" data-topic-name="${esc(topicName)}" data-place="${esc(place)}">
  ${label ? `<p class="run-label">${esc(label)}</p>` : ''}
  <textarea class="run-sql" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="${esc(label || place)}" rows="${Math.min(14, Math.max(4, sql.split('\n').length + 1))}">${esc(sql)}</textarea>
  <div class="run-actions">
    <button type="button" class="btn run-go" data-run>Run</button>
    <button type="button" class="btn-ghost" data-reset>Reset</button>
    <span class="run-hint">Ctrl/⌘ + Enter runs it. Select part of the query to run only that part.</span>
  </div>
  <div class="run-out" aria-live="polite"></div>
  <details class="run-history" hidden><summary>Your queries in this box</summary><ul></ul></details>
</div>`;
}

const ago = (iso) => {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const firstLine = (sql) => sql.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('--')) || sql.trim().split('\n')[0];

function paintHistory(box) {
  const list = loadQueries().filter((q) => q.topic === box.dataset.topic && q.key === box.dataset.key).slice(0, 10);
  const h = box.querySelector('.run-history');
  h.hidden = !list.length;
  h.querySelector('summary').textContent = `Your queries in this box (${list.length})`;
  h.querySelector('ul').innerHTML = list
    .map((q) => `<li><button type="button" class="hist-load" data-load="${esc(q.id)}" title="Put this query back in the box"><code>${esc(firstLine(q.sql))}</code></button><span class="muted">${ago(q.at)}</span><button type="button" class="hist-del" data-del="${esc(q.id)}" aria-label="Delete this saved query">×</button></li>`)
    .join('');
}

function setup(box) {
  if (box.dataset.ready) return;
  box.dataset.ready = '1';
  const ta = box.querySelector('textarea');
  box.dataset.initial = ta.value;
  if (RESTORE.has(box.dataset.key)) {
    const last = loadQueries().find((q) => q.topic === box.dataset.topic && q.key === box.dataset.key);
    if (last) ta.value = last.sql;
  }
  const go = box.querySelector('[data-run]');
  const label = () => { go.textContent = ta.selectionStart !== ta.selectionEnd ? 'Run selection' : 'Run'; };
  ta.addEventListener('select', label);
  ta.addEventListener('keyup', label);
  ta.addEventListener('mouseup', label);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runBox(box); }
  });
  paintHistory(box);
}

async function runBox(box) {
  const ta = box.querySelector('textarea');
  const out = box.querySelector('.run-out');
  const selected = ta.selectionStart !== ta.selectionEnd ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : '';
  const query = (selected || ta.value).trim();
  if (!query || /^(--[^\n]*\s*)*$/.test(query)) { out.innerHTML = '<p class="result-err">Write a query first.</p>'; return; }
  const go = box.querySelector('[data-run]');
  go.disabled = true;
  if (!engine) out.innerHTML = '<p class="muted">Loading the SQL engine (once, about 650 KB)…</p>';
  const t0 = performance.now();
  try {
    const r = await run(query);
    out.innerHTML = resultHtml(r, Math.max(1, Math.round(performance.now() - t0)));
  } catch (e) {
    out.innerHTML = `<p class="result-err"><b>Error:</b> ${esc(e.message || e)}</p>`;
  } finally {
    go.disabled = false;
  }
  // Save it, unless it is the box's starting query, untouched.
  if (ta.value.trim() !== box.dataset.initial.trim()) {
    saveQuery({ topic: box.dataset.topic, topicName: box.dataset.topicName, key: box.dataset.key, place: box.dataset.place, url: location.pathname, sql: ta.value });
    document.querySelectorAll('.sql-run').forEach((b) => { if (b.dataset.topic === box.dataset.topic && b.dataset.key === box.dataset.key) paintHistory(b); });
    paintSaved();
  }
}

document.querySelectorAll('.sql-run').forEach(setup);

document.addEventListener('click', (e) => {
  const t = e.target;
  const box = t.closest('.sql-run');
  if (t.closest('[data-run]') && box) { runBox(box); return; }
  if (t.closest('[data-reset]') && box) {
    box.querySelector('textarea').value = box.dataset.initial;
    box.querySelector('.run-out').innerHTML = '';
    box.querySelector('[data-run]').textContent = 'Run';
    return;
  }
  const load = t.closest('[data-load]');
  if (load) {
    const q = loadQueries().find((x) => x.id === load.dataset.load);
    const target = box || document.querySelector('.sql-run[data-key="database"]');
    if (q && target) { target.querySelector('textarea').value = q.sql; target.querySelector('textarea').focus(); if (!box) target.scrollIntoView({ block: 'center' }); }
    return;
  }
  const del = t.closest('[data-del]');
  if (del) {
    deleteQuery(del.dataset.del);
    document.querySelectorAll('.sql-run').forEach(paintHistory);
    paintSaved();
    return;
  }
  // "Try it": a run box under the example, with its query ready to change and run.
  const tryBtn = t.closest('.try-it');
  if (tryBtn) {
    const holder = tryBtn.closest('.sql-example');
    let opened = holder.querySelector(':scope > .sql-run');
    if (!opened) {
      holder.insertAdjacentHTML('beforeend', boxHtml({ sql: tryBtn.dataset.sql, key: tryBtn.dataset.try, topic: tryBtn.dataset.topic, topicName: tryBtn.dataset.topicName, place: tryBtn.dataset.place, label: 'Change it and run it' }));
      opened = holder.querySelector(':scope > .sql-run');
      setup(opened);
      tryBtn.textContent = 'Running it below';
      runBox(opened);
    }
    opened.querySelector('textarea').focus({ preventScroll: true });
    opened.scrollIntoView({ block: 'nearest' });
  }
});

// ---- "My saved queries" (practice database page) ---------------------------------
function paintSaved() {
  const host = document.querySelector('[data-saved-queries] .saved-list');
  if (!host) return;
  const all = loadQueries();
  if (!all.length) { host.innerHTML = '<p class="muted">No saved queries yet. Change a query in any SQL lesson and run it, and it appears here.</p>'; return; }
  const groups = new Map();
  for (const q of all) {
    if (!groups.has(q.topic)) groups.set(q.topic, { name: q.topicName || q.topic, url: q.url, items: [] });
    groups.get(q.topic).items.push(q);
  }
  host.innerHTML = [...groups.values()]
    .map((g) => `<details class="saved-group" open><summary>${esc(g.name)} <span class="muted">(${g.items.length})</span></summary>
  ${g.url ? `<p><a href="${esc(g.url)}">Open the lesson →</a></p>` : ''}
  <ul>${g.items.map((q) => `<li><p class="saved-place">${esc(q.place)} <span class="muted">· ${ago(q.at)}</span></p><pre><code>${esc(q.sql)}</code></pre><p><button type="button" class="btn-ghost" data-load="${esc(q.id)}">Put it in the box above</button> <button type="button" class="hist-del" data-del="${esc(q.id)}" aria-label="Delete this saved query">×</button></p></li>`).join('')}</ul>
</details>`)
    .join('');
}
paintSaved();
