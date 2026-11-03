// Revision notes: "Must know only" hides the other topics (and any phase left empty).
const box = document.querySelector('[data-must-only]');
const KEY = box?.dataset.mustKey || 'hp-sd-must-only';
function apply() {
  const only = box.checked;
  document.querySelectorAll('.rev-topic').forEach((el) => { el.hidden = only && el.dataset.priority !== 'must'; });
  document.querySelectorAll('.rev-phase').forEach((el) => { el.hidden = !el.querySelector('.rev-topic:not([hidden])'); });
  try { localStorage.setItem(KEY, only ? '1' : ''); } catch { /* not saved */ }
}
if (box) {
  try { box.checked = localStorage.getItem(KEY) === '1'; } catch { /* default off */ }
  box.addEventListener('change', apply);
  apply();
}
