// DSA pages: tick problems solved, see when each comes back, review today's
// problems on the hub, and practise spotting patterns in the drill.
// Everything is kept in this browser (lib/dsa.js has the rules).
import {
  loadDsa, saveDsa, setSolved, rate, gapAfter, reviewsToday, todayLocal, daysBetween,
  loadDrill, saveDrill, drillSession, drillAnswer, choicesFor, isCorrect, GAPS,
} from './lib/dsa.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const data = (id) => { try { return JSON.parse(document.getElementById(id)?.textContent || 'null'); } catch { return null; } };
const today = todayLocal();
const map = data('dsa-map') || {};
const order = Object.values(map).flat();
let state = loadDsa();

const niceDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const inDays = (n) => (n <= 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`);
const back = (n) => (n === 1 ? 'back tomorrow' : `back in ${n} days`);

// ---- progress everywhere ----------------------------------------------------------
function paint() {
  const solved = (id) => (map[id] || []).filter((p) => state.solved[p]).length;
  document.querySelectorAll('[data-dsa-count]').forEach((el) => { el.textContent = `${solved(el.dataset.dsaCount)} of ${el.dataset.total} solved`; });
  document.querySelectorAll('[data-dsa-progress]').forEach((el) => {
    const total = Number(el.dataset.total) || 1;
    el.firstElementChild.style.width = `${Math.min(100, (solved(el.dataset.dsaProgress) / total) * 100)}%`;
  });
  document.querySelectorAll('[data-dsa-topic-link]').forEach((el) => {
    const n = solved(el.dataset.dsaTopicLink);
    el.classList.toggle('done', n > 0 && n === Number(el.dataset.total));
    el.classList.toggle('started', n > 0 && n < Number(el.dataset.total));
  });
  const all = document.querySelector('[data-dsa-solved]');
  if (all) all.textContent = String(order.filter((p) => state.solved[p]).length);
  const due = document.querySelector('[data-dsa-due]');
  if (due) due.textContent = String(reviewsToday(state, order, today).due.length);

  // each problem on a topic page
  document.querySelectorAll('[data-problem]').forEach((box) => {
    const id = box.dataset.problem;
    box.checked = Boolean(state.solved[id]);
    box.closest('.dsa-problem')?.classList.toggle('solved', box.checked);
    const note = document.querySelector(`[data-review-for="${CSS.escape(id)}"]`);
    if (!note) return;
    const r = state.reviews[id];
    if (state.solved[id] && r) {
      const n = daysBetween(today, r.due);
      note.innerHTML = n <= 0
        ? `Solved · <b>due for review ${n < 0 ? `(${-n} ${-n === 1 ? 'day' : 'days'} late)` : 'today'}</b>: solve it again from a blank editor, then rate it on the <a href="/dsa/#review-today">DSA page</a>.`
        : `Solved · next review ${niceDate(r.due)} (${inDays(n)})${r.reviews ? ` · reviewed ${r.reviews} ${r.reviews === 1 ? 'time' : 'times'}` : ''}.`;
    } else {
      note.textContent = '';
    }
  });
}

document.addEventListener('change', (e) => {
  const box = e.target.closest('[data-problem]');
  if (!box) return;
  state = setSolved(state, box.dataset.problem, box.checked, today);
  saveDsa(state);
  paint();
  paintReviews();
});

// ---- review today (hub) --------------------------------------------------------------
const problems = data('dsa-problems') || [];
const byId = new Map(problems.map((p) => [p.id, p]));

function paintReviews() {
  const host = document.querySelector('[data-review-today] .review-list');
  if (!host) return;
  const r = reviewsToday(state, order, today);
  const solvedCount = order.filter((p) => state.solved[p]).length;
  if (!solvedCount) {
    host.innerHTML = '<p class="muted">Nothing to review yet. Tick a problem as solved in any topic, and it comes back here tomorrow to solve again.</p>';
    return;
  }
  const items = r.due
    .map(({ id, review }) => {
      const p = byId.get(id);
      if (!p) return '';
      const late = daysBetween(review.due, today);
      return `<li class="review-item">
  <p class="review-meta"><a href="${esc(p.topicUrl)}#problem-${esc(p.id)}">${esc(p.topicTitle)}</a>${late > 0 ? ` · <span class="late">${late} ${late === 1 ? 'day' : 'days'} late</span>` : ''}</p>
  <h3><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a></h3>
  <p>${esc(p.summary)}</p>
  <p class="muted">Solve it again from a blank editor on LeetCode, then say how it went.</p>
  <details class="reveal"><summary>Show answer</summary><div class="reveal-body"><p><b>Technique:</b> ${esc(p.technique)}</p><p><b>The clue:</b> ${esc(p.clue)}</p><p><b>The trick:</b> ${esc(p.trick)}</p></div></details>
  <div class="rate">
    <button type="button" class="btn" data-rate="easy" data-id="${esc(id)}">Solved it <span>${back(gapAfter(review, 'easy'))}</span></button>
    <button type="button" class="btn-ghost" data-rate="hard" data-id="${esc(id)}">Struggled <span>${back(gapAfter(review, 'hard'))}</span></button>
    <button type="button" class="btn-ghost" data-rate="forgot" data-id="${esc(id)}">Couldn't <span>back tomorrow</span></button>
  </div>
</li>`;
    })
    .join('');
  const more = r.dueTotal - r.due.length;
  const after = [
    r.next ? `Next: ${r.next.count} ${r.next.count === 1 ? 'problem' : 'problems'} on ${niceDate(r.next.date)}.` : '',
    r.monthly ? `${r.monthly} ${r.monthly === 1 ? 'problem is' : 'problems are'} down to once a month.` : '',
  ].filter(Boolean).join(' ');
  host.innerHTML = items
    ? `<ol class="review-items">${items}</ol>${more > 0 ? `<p class="muted">${more} more ${more === 1 ? 'is' : 'are'} due; at most three a day, so ${more === 1 ? 'it waits' : 'they wait'} their turn.</p>` : ''}`
    : `<p class="review-done">${r.doneToday ? `Done for today: ${r.doneToday} reviewed.` : 'Nothing due today.'} ${esc(after)}</p>`;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-rate]');
  if (!b) return;
  state = rate(state, b.dataset.id, b.dataset.rate, today);
  saveDsa(state);
  paint();
  paintReviews();
});

// ---- the "Which pattern?" drill -----------------------------------------------------
const drillHost = document.querySelector('[data-drill]');
const patterns = data('dsa-patterns');
if (drillHost && patterns && problems.length) {
  const titles = new Map(patterns.topics.map((t) => [t.id, t]));
  const topicIds = patterns.topics.map((t) => t.id);
  let drill = loadDrill();
  let session = drillSession(drill, order, today);
  let at = 0;
  let right = 0;
  let answered = null;

  const boxes = () => {
    const counts = GAPS.map(() => 0);
    for (const c of Object.values(drill)) if (c.box >= 1 && c.box <= GAPS.length) counts[c.box - 1]++;
    const seen = Object.keys(drill).length;
    return seen ? `<p class="muted drill-boxes">Cards seen: ${seen} of ${order.length}. By box: ${counts.map((n, i) => `${i + 1}: ${n}`).join(' · ')}.</p>` : '';
  };

  const render = () => {
    if (at >= session.length) {
      drillHost.innerHTML = `<p class="review-done">${session.length ? `Done for today: ${right} of ${session.length} right.` : 'Nothing due today.'} Come back tomorrow for the cards that are due, plus five new ones.</p>
${boxes()}
<button type="button" class="btn-ghost" data-drill-more>Practise five more now</button>`;
      return;
    }
    const p = byId.get(session[at]);
    const prob = { id: p.id, topic: p.topic, alsoAccept: p.alsoAccept };
    const options = choicesFor(prob, patterns.lookAlikes, topicIds);
    const result = answered
      ? `<div class="drill-result ${answered.ok ? 'ok' : 'bad'}">
  <p><b>${answered.ok ? 'Right.' : `Not quite: it's ${esc(titles.get(p.topic)?.title || p.topic)}.`}</b></p>
  <p><b>Technique:</b> ${esc(p.technique)}</p><p><b>The clue:</b> ${esc(p.clue)}</p><p><b>The trick:</b> ${esc(p.trick)}</p>
  <p><a href="${esc(p.topicUrl)}#problem-${esc(p.id)}">Learn the pattern</a> · <a href="${esc(p.url)}" target="_blank" rel="noopener">Solve it on LeetCode</a></p>
  <button type="button" class="btn" data-drill-next>${at + 1 < session.length ? 'Next card' : 'Finish'}</button>
</div>`
      : '';
    drillHost.innerHTML = `<p class="drill-count">Card ${at + 1} of ${session.length}${drill[p.id] ? ` · box ${drill[p.id].box}` : ' · new'}</p>
<p class="drill-q">${esc(p.summary)}</p>
<p class="muted">${esc(p.title)} · which pattern?</p>
<div class="drill-options">${options.map((t) => `<button type="button" class="btn-ghost${answered ? (isCorrect(prob, t) ? ' correct' : t === answered.choice ? ' wrong' : '') : ''}" data-choose="${esc(t)}"${answered ? ' disabled' : ''}>${esc(titles.get(t)?.title || t)}</button>`).join('')}</div>
${result}
${boxes()}`;
  };

  drillHost.addEventListener('click', (e) => {
    const choose = e.target.closest('[data-choose]');
    if (choose && !answered) {
      const p = byId.get(session[at]);
      const ok = isCorrect({ id: p.id, topic: p.topic, alsoAccept: p.alsoAccept }, choose.dataset.choose);
      if (ok) right++;
      drill = drillAnswer(drill, p.id, ok, today);
      saveDrill(drill);
      answered = { ok, choice: choose.dataset.choose };
      render();
      drillHost.querySelector('[data-drill-next]')?.focus();
      return;
    }
    if (e.target.closest('[data-drill-next]')) { at++; answered = null; render(); return; }
    if (e.target.closest('[data-drill-more]')) {
      // Five more: cards not due yet, the least known first.
      const extra = order.filter((id) => !session.includes(id)).sort((a, b) => (drill[a]?.box ?? 0) - (drill[b]?.box ?? 0)).slice(0, 5);
      session = [...session, ...extra];
      render();
    }
  });
  render();
}

paint();
paintReviews();
// A progress file was loaded on this page: read it and repaint.
window.addEventListener('hamropedia:progress-loaded', () => { state = loadDsa(); paint(); paintReviews(); });
