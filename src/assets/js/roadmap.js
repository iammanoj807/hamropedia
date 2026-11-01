// Roadmap progress: ticked topics are kept in this browser only (localStorage).
const KEY = 'hp-roadmap-done';

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); }
}
function save(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* private mode */ }
}

const done = load();

function render() {
  document.querySelectorAll('[data-phase-progress]').forEach((el) => {
    const slug = el.dataset.phaseProgress;
    const total = Number(el.dataset.total) || 1;
    const n = [...done].filter((id) => id.startsWith(`${slug}--`)).length;
    el.firstElementChild.style.width = `${Math.min(100, (n / total) * 100)}%`;
    el.title = `${n} of ${total} topics done`;
  });
  document.querySelectorAll('[data-phase-count]').forEach((el) => {
    const slug = el.dataset.phaseCount;
    const total = document.querySelectorAll(`[data-phase="${slug}"]`).length;
    const n = [...done].filter((id) => id.startsWith(`${slug}--`)).length;
    el.textContent = `${n} of ${total} done`;
  });
  const all = document.querySelector('[data-rm-done]');
  if (all) all.textContent = String(done.size);
}

document.querySelectorAll('input[data-topic]').forEach((box) => {
  box.checked = done.has(box.dataset.topic);
  box.closest('.topic')?.classList.toggle('done', box.checked);
  box.addEventListener('change', () => {
    if (box.checked) done.add(box.dataset.topic); else done.delete(box.dataset.topic);
    box.closest('.topic')?.classList.toggle('done', box.checked);
    save(done);
    render();
  });
});

render();
