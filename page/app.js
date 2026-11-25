// app.js — the front door. It types no number: each one is read by the kernels above (RECEIPTS, STANDARD, FLAGSHIP)
// from the flagship page that proves it. data/flagships.json is that reading at a named commit; when the page opens
// it reads the live pages again, in the visitor's own tab, and shows what it finds. The crystal's lit faces are the
// receipts on this page: cyan sealed, gold still sealing, red failed and kept.
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bind = (k, html) => { for (const el of document.querySelectorAll(`[data-bind="${k}"]`)) el.innerHTML = html; };
const getText = async (p) => { try { const r = await fetch(p); return r.ok ? await r.text() : null; } catch { return null; } };
const getJSON = async (p) => { const t = await getText(p); try { return t === null ? null : JSON.parse(t); } catch { return null; } };
const SEALING = '<span class="tag gd">sealing now</span>';
const S = { builds: [], reuse: null, gate: null, read: null, live: null, crystal: null, faces: [] };
const B = (repo) => S.builds.find((b) => b.repo === repo) || null;
const src = (b, what) => `<a class="src" href="${b.live}">receipt: ${esc(what)} ↗</a>`;
const LAYERS = [['D0', 'Substrate', 'the 1B model, and the few facts it gets right cold'], ['D1', 'Bond-check', 'verifies every step; dissolves what it cannot prove'], ['D2', 'Trajectory', 'splits a stuck step until the model cannot get it wrong'], ['D3', 'Crystal', 'grows verified answers in parallel, reusing proven work'], ['D4', 'Fuzzer', 'attacks its own verifier so no false bond can form'], ['D5', 'Distillation', 'learns from its own verified traces to get better cold'], ['D6', 'You', 'nothing irreversible, and no new weights, without your grant']];

function render() {
  const v = B('the-verifier-set'), c = B('the-crystal'), d = B('the-distillation');
  const u = v && v.extra.find((x) => x.key === 'unanswerable'), f = c && c.extra.find((x) => x.key === 'forged');
  const none = (lab) => `<div class="stat reveal"><div class="n"><span class="wait">—</span></div><div class="lab">${lab} ${SEALING}</div></div>`;
  $('receipts').innerHTML = (u ? `<div class="stat reveal"><div class="n"><span class="was">${esc(u.value)}</span><span class="arrow">→</span><span class="now" data-count="${esc(u.after)}">${esc(u.after)}</span></div><div class="lab">Of <b>${u.of} questions with no answer</b>, the raw model gave ${esc(u.value)} confident numbers. Checked, it gave none.</div>${src(v, 'the verifier set')}</div>` : none('Confident numbers given to questions with no answer.'))
    + (v && v.headline ? `<div class="stat reveal"><div class="n"><span class="was">${esc(v.headline.was)}</span><span class="arrow">→</span><span class="now" data-count="${esc(v.headline.now)}">${esc(v.headline.now)}</span></div><div class="lab">Right, of <b>${v.headline.of} sealed problems</b> it had never seen. Same model, same weights. The only change is a checker.</div>${src(v, 'the verifier set')}</div>` : none('Sealed problems right, unchecked then checked.'))
    + (f ? `<div class="stat reveal"><div class="n"><span class="now" data-count="${esc(f.value)}">${esc(f.value)}</span><span class="was" style="font-size:.42em"> /${f.of.toLocaleString('en')}</span></div><div class="lab"><b>Forged replies</b> that got past the check, of ${f.of.toLocaleString('en')} thrown at it.</div>${src(c, 'the crystal')}</div>` : none('Forged replies that got past the check.'));
  $('readLine').innerHTML = S.live === null ? `Read from each build's own page on ${esc(S.read)}, at a named commit. Reading them again, live…` : S.live.tried === 0 ? `Read from each build's own page on ${esc(S.read)}, at a named commit.` : `<span class="${S.live.differ ? 'fail' : 'pass'}">Read again just now, in this tab, from ${S.live.got} of ${S.live.tried} live pages: ${S.live.differ ? `${S.live.differ} differ from the reading of ${esc(S.read)}, and the live reading is shown` : 'every number agrees'}.</span>`;
  $('builds').innerHTML = S.builds.map((b, i) => { const h = b.headline, wait = !h && b.claims.sealing > 0;
    return `<a class="act reveal" href="${b.live}"><span class="num">0${i + 1} — ${esc(b.name.toUpperCase())}${wait ? ` ${SEALING}` : ''}</span><h3>${esc(b.verb)}</h3><p>${esc(b.line)}${h ? ` <b style="color:var(--ink)">${esc(h.was)} → ${esc(h.now)}</b> of ${h.of} sealed problems.` : ''}${b.claims.n ? ` <span class="dim">${b.claims.pass} of ${b.claims.n} claims passed${b.claims.fail ? `, ${b.claims.fail} failed and kept` : ''}${b.claims.sealing ? `, ${b.claims.sealing} sealing` : ''}.</span>` : ''}</p><span class="go">Open the live proof →</span></a>`; }).join('');
  const reuse = S.reuse ? Math.round(100 * S.reuse.taken / (S.reuse.taken + S.reuse.worked)) : null;
  const tagOf = (id) => (id === 'D3' && reuse !== null ? `<span class="tag cy">${reuse}% of tokens reused</span>` : id === 'D5' ? (d && d.headline ? `<span class="tag cy">${esc(d.headline.was)} → ${esc(d.headline.now)} cold</span>` : SEALING) : '');
  $('stackRows').innerHTML = LAYERS.map(([id, nm, line]) => `<div class="srow ${id === 'D5' && !(d && d.headline) ? 'gold' : ''}"><div class="d">${id}</div><div class="nm"><b>${nm}</b><span>${line}</span>${tagOf(id)}</div></div>`).join('');
  const win = (n, l, href) => `<div class="win reveal"><div class="wn">${n}</div><div class="wl">${l}${href ? ` <a class="src" href="${href}">receipt ↗</a>` : ''}</div></div>`;
  const pass = S.builds.reduce((a, b) => a + b.claims.pass, 0), fail = S.builds.reduce((a, b) => a + b.claims.fail, 0), sealing = S.builds.reduce((a, b) => a + b.claims.sealing, 0);
  $('wins').innerHTML = win(reuse !== null ? `${reuse}%` : '—', 'of tokens taken over from proven work, not worked out again', d ? `${d.live}data/parity.json` : '')
    + win(f ? `${esc(f.value)}<span class="of">/${f.of.toLocaleString('en')}</span>` : '—', 'forged replies that got past the check', c ? c.live : '')
    + win(`${pass}<span class="of">/${pass + fail}</span>`, `sealed claims passed across the builds; ${fail} failed and ${fail === 1 ? 'is' : 'are'} kept${sealing ? `; ${sealing} more are sealing now` : ''}`, '')
    + win(S.gate ? `${S.gate.killed}<span class="of">/${S.gate.total}</span>` : '—', 'planted bugs caught in this page\'s own kernels', 'data/gates.json');
  $('wall').innerHTML = S.builds.map((b, i) => { const bad = b.standard.rules.filter((r) => !r.pass);
    return `<div class="srow ${b.standard.pass ? '' : 'red'}"><div class="d">0${i + 1}</div><div class="nm"><b>${esc(b.name)}</b><span>${b.standard.rules.map((r) => `<span class="${r.pass ? 'pass' : 'fail'}" title="${esc(r.why)}">${r.id}${r.pass ? '✓' : '✗'}</span>`).join(' ')} · ${b.standard.viewWords.toLocaleString('en')} words before a click</span>${b.standard.pass ? '<span class="tag cy">meets it</span>' : `<span class="tag rd">fails ${bad.length} of 7 · kept</span>`}</div></div>`; }).join('');
  const failed = S.builds.flatMap((b) => b.claims.failed.map((x) => `${esc(b.name)}'s ${esc(x.id)} (${esc(x.name.toLowerCase())})`));
  bind('h.failed', failed.length ? `${failed.join('; ')} failed its bar and is still on its page, in red.` : 'No sealed claim has failed so far; when one does it stays on its page, in red.');
  bind('h.gate', S.gate ? `Its kernels' mutation gate: ${S.gate.killed} of ${S.gate.total} planted bugs caught.` : '');
  S.faces = faces();
  const toRebuild = S.builds.filter((b) => !b.standard.pass).length;
  S.rest = `${S.faces.filter((x) => x.state === 1).length} receipts sealed · ${S.faces.filter((x) => x.state === 2).length} sealing now · ${failed.length} failed and kept${toRebuild ? ` · ${toRebuild} ${toRebuild === 1 ? 'page' : 'pages'} still to rebuild` : ''} · point at a face`;
  $('facet').innerHTML = S.rest;
  if (S.crystal) S.crystal.setFaces(S.faces.map((x) => x.state));
  HOUSE.reveal(document);                                                 // what was just drawn rises in like the rest
}

// one face for every receipt on the page, in the order the page shows them
function faces() {
  const out = [], v = B('the-verifier-set'), c = B('the-crystal'), d = B('the-distillation');
  const add = (state, text, to) => out.push({ state, text, to });
  const u = v && v.extra.find((x) => x.key === 'unanswerable'), f = c && c.extra.find((x) => x.key === 'forged');
  add(u ? 1 : 2, u ? `<b>${esc(u.value)} → ${esc(u.after)}</b> · confident numbers to questions with no answer` : 'sealing now', 'result');
  add(v && v.headline ? 1 : 2, v && v.headline ? `<b>${esc(v.headline.was)} → ${esc(v.headline.now)}</b> of ${v.headline.of} sealed problems · The Verifier Set` : 'sealing now', 'result');
  add(f ? 1 : 2, f ? `<b>${esc(f.value)} of ${f.of.toLocaleString('en')}</b> forged replies got past the check · The Crystal` : 'sealing now', 'result');
  for (const b of S.builds) add(b.headline ? 1 : b.claims.sealing > 0 ? 2 : 1, `<b>${esc(b.name)}</b> · ${b.headline ? `${esc(b.headline.was)} → ${esc(b.headline.now)} of ${b.headline.of}` : b.claims.sealing > 0 ? 'sealing now' : 'live'}`, 'builds-s');
  for (const [id, nm] of LAYERS) add(id === 'D5' && !(d && d.headline) ? 2 : 1, `<b>${id} · ${nm}</b>${id === 'D5' && !(d && d.headline) ? ' · sealing now' : ''}`, 'engine');
  for (const b of S.builds) for (const x of b.claims.failed) add(3, `<b>${esc(b.name)} · ${esc(x.id)}</b> failed its bar, and is kept · ${esc(x.name)}`, 'proof');
  for (const b of S.builds) add(b.standard.pass ? 1 : 3, `<b>${esc(b.name)}</b> · the house standard: ${b.standard.pass ? 'meets it' : `fails ${b.standard.rules.filter((r) => !r.pass).length} of 7, kept until rebuilt`}`, 'standard');
  while (out.length < 32) add(0, '', null);
  return out.slice(0, 32);
}

// the living part: read every build's live page again, here, with the same kernels
async function reread() {
  const live = { tried: 0, got: 0, differ: 0 };
  $('recheck').disabled = true;
  try {
    for (const b of S.builds) {
      live.tried++;
      const html = await getText(`../${b.repo}/`);
      if (html === null || !/<body[\s>]/i.test(html)) continue;
      const now = FLAGSHIP.read(b.repo, html);
      live.got++;
      if (!FLAGSHIP.same(now, b)) live.differ++;
      Object.assign(b, now);
    }
    const p = await getJSON('../the-distillation/data/parity.json');
    if (p && p.grown) S.reuse = { taken: p.grown.tokens_taken_over, worked: p.grown.tokens_worked_out };
    S.live = live.got === 0 ? { tried: 0, got: 0, differ: 0 } : live;
    render();
    if (S.crystal && live.got) S.crystal.setEnergy(1.25);
  } finally { $('recheck').disabled = false; }
}
function tryPage() {
  const html = $('paste').value;
  if (!html.trim()) { $('pasteOut').innerHTML = 'Paste a page first.'; return; }
  const r = STANDARD.check(html);
  $('pasteOut').innerHTML = `${r.pass ? '<span class="pass">It meets the house standard.</span>' : `<span class="fail">It fails ${r.rules.filter((x) => !x.pass).length} of 7.</span>`}<br>${r.rules.map((x) => `<span class="${x.pass ? 'pass' : 'fail'}">${x.id} ${esc(x.name)}</span>: ${esc(x.why)}`).join('<br>')}`;
}

const ready = (async () => {
  const f = await getJSON('data/flagships.json');
  if (f) Object.assign(S, { builds: f.builds, reuse: f.reuse, read: f.read });
  S.gate = await getJSON('data/gates.json');
  render();
  $('recheck').addEventListener('click', reread);
  $('tryPage').addEventListener('click', tryPage);
  S.crystal = CRYSTAL.mount($('crystal'), { energy: 0.95 });
  if (S.crystal) {
    S.crystal.setFaces(S.faces.map((x) => x.state));
    S.crystal.onHover((i) => { $('facet').innerHTML = i >= 0 && S.faces[i] && S.faces[i].text ? S.faces[i].text : S.rest; });
    S.crystal.onPick((i) => { const el = S.faces[i] && S.faces[i].to ? $(S.faces[i].to) : null; if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' }); });
    HOUSE.bindScroll(S.crystal, 0.95);
  }
  if (typeof document.querySelectorAll === 'function') for (const el of document.querySelectorAll('[data-count]')) HOUSE.count(el, el.getAttribute('data-count'));
  HOUSE.reveal(document); HOUSE.light(document);
  if (typeof location !== 'undefined' && /^https?:$/.test(location.protocol)) reread();   // live, as soon as the page is open
  if (typeof navigator !== 'undefined' && navigator.serviceWorker && typeof location !== 'undefined' && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
window.__house = { ready, S, render, reread, tryPage, faces };
