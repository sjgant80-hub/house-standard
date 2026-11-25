// app.js — the page. The kernels above it are this build's gated code, inlined byte for byte; the house kit draws.
// Every number it writes is worked out here from data/run.json by src/claims.mjs. With no run, it says "sealing now".
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getJSON = async (p) => { try { const r = await fetch(p); return r.ok ? await r.json() : null; } catch { return null; } };
const SEALING = '<span class="tag gd">sealing now</span>';
const S = { run: null, verdicts: [], crystal: null };

function render() {
  S.verdicts = CLAIMS.verdicts(S.run);
  const rc = CLAIMS.receipts(S.run);
  $('receipts').innerHTML = rc.length ? rc.map((r) => `<div class="stat reveal"><div class="n"><span class="was">${esc(r.was)}</span><span class="arrow">→</span><span class="now">${esc(r.now)}</span></div><div class="lab">${esc(r.label)}</div><a class="src" href="data/run.json">receipt: the recorded run ↗</a></div>`).join('') : `<div class="stat reveal"><div class="n"><span class="wait">—</span></div><div class="lab">The first sealed run. ${SEALING}</div></div>`;
  $('claimStack').innerHTML = S.verdicts.map((v) => `<div class="srow ${v.pass === false ? 'red' : v.pass === null ? 'gold' : ''}"><div class="d">${v.id}</div><div class="nm"><b>${esc(v.name)}</b><span>${esc(v.result)}</span>${v.pass === true ? '<span class="tag cy">pass</span>' : v.pass === false ? '<span class="tag rd">fail · kept</span>' : SEALING}</div></div>`).join('');
  const n = (p) => S.verdicts.filter((v) => v.pass === p).length;
  $('facet').innerHTML = S.run ? `${n(true)} claims passed · ${n(false)} failed and kept · point at a face` : 'Sealing now · the gold faces are its claims';
  if (S.crystal) S.crystal.setFaces(Array.from({ length: 32 }, (_, i) => (S.verdicts[i] ? (S.verdicts[i].pass === true ? 1 : S.verdicts[i].pass === false ? 3 : 2) : 0)));
}
function rejudge() {
  const again = CLAIMS.verdicts(S.run);
  $('rejudgeOut').innerHTML = S.run ? `<span class="pass">Judged again here.</span> ${again.map((v) => `${v.id} ${v.pass === true ? 'pass' : v.pass === false ? 'FAIL' : 'pending'}`).join(', ')}` : 'There is no recorded run yet: every claim is pending.';
}
const ready = (async () => {
  const published = await getJSON('data/published.json');
  S.run = published && published.run ? await getJSON('data/run.json') : null;   // asked for only when it is on file
  render();
  $('rejudge').addEventListener('click', rejudge);
  S.crystal = CRYSTAL.mount($('crystal'), { energy: 0.9 });
  if (S.crystal) { render(); S.crystal.onHover((i) => { const v = S.verdicts[i]; if (v) $('facet').innerHTML = `<b>${v.id} ${esc(v.name)}</b> · ${v.pass === true ? 'pass' : v.pass === false ? 'FAIL, kept' : 'sealing now'} · ${esc(v.result)}`; }); HOUSE.bindScroll(S.crystal, 0.9); }
  HOUSE.reveal(document); HOUSE.light(document);
})();
window.__build = { ready, S, render, rejudge };
