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
const S = { builds: [], reuse: null, gate: null, read: null, live: null, crystal: null, faces: [], estate: null, loop: null, dev: null };
const B = (repo) => S.builds.find((b) => b.repo === repo) || null;
const src = (b, what) => `<a class="src" href="${b.live}">receipt: ${esc(what)} ↗</a>`;
const LAYERS = [['D0', 'Substrate', 'the 1B model, and the few facts it gets right cold'], ['D1', 'Bond-check', 'verifies every step; dissolves what it cannot prove'], ['D2', 'Trajectory', 'splits a stuck step until the model cannot get it wrong'], ['D3', 'Crystal', 'grows verified answers in parallel, reusing proven work'], ['D4', 'Fuzzer', 'attacks its own verifier so no false bond can form'], ['D5', 'Distillation', 'learns from its own verified traces to get better cold'], ['D6', 'You', 'nothing irreversible, and no new weights, without your grant']];

// ── self-improvement, shown: the loop as a ring, the round as it runs, and what has landed ──
const RING = [['harvest', 'Harvest'], ['build', 'Verify'], ['train', 'Distil'], ['cold-base', 'Test cold'], ['judged', 'Adopt or dissolve'], ['grant', 'A person\'s grant']];
function renderLoop() {
  const l = S.loop, d = B('the-distillation'), stage = l && l.stage === 'cold-distilled' ? 'cold-base' : l ? l.stage : null, at = RING.findIndex(([k]) => k === stage), running = l && at >= 0 && !l.done && !l.failed;
  const pt = (i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [300 + 118 * Math.cos(a), 150 + 118 * Math.sin(a)]; };
  const nodes = RING.map(([, name], i) => { const [x, y] = pt(i), on = running && i === at, past = (l && l.done) || (running && i < at); const tx = x + (x > 310 ? 16 : x < 290 ? -16 : 0), anchor = x > 310 ? 'start' : x < 290 ? 'end' : 'middle', ty = y + (anchor === 'middle' ? (y < 150 ? -16 : 26) : 4);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 9 : 6}" fill="${on ? '#ffcf6a' : past ? '#49e8c8' : '#02070c'}" stroke="${on ? '#ffcf6a' : past ? '#49e8c8' : '#6f8698'}" stroke-width="2"/><text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}" fill="${on ? '#ffcf6a' : past ? '#e9f2f6' : '#aebecb'}">${name}</text>`; }).join('');
  $('ring').innerHTML = `<svg viewBox="0 0 600 300" style="width:100%;max-width:640px;height:auto;display:block;margin:0 auto 8px" role="img" aria-label="The loop: harvest, verify, distil, test cold, adopt or dissolve, a person's grant, and round again.${running ? ` Now at: ${RING[at][1]}.` : ''}"><style>text{font:500 12px 'JetBrains Mono',ui-monospace,monospace}@keyframes orbit{to{transform:rotate(360deg)}}.orb{transform-origin:300px 150px;animation:orbit 14s linear infinite}@media(prefers-reduced-motion:reduce){.orb{animation:none}}</style><circle cx="300" cy="150" r="118" fill="none" stroke="rgba(255,255,255,.1)"/><g class="orb"><circle cx="300" cy="32" r="3" fill="#49e8c8"/><path d="M300 32A118 118 0 0 0 244 46" fill="none" stroke="#49e8c8" stroke-width="1.5" opacity=".5"/></g>${nodes}<text x="300" y="146" text-anchor="middle" fill="#e9f2f6" style="font:500 15px 'JetBrains Mono',monospace">${running ? 'running now' : l && l.done ? 'round judged' : 'between rounds'}</text><text x="300" y="166" text-anchor="middle" fill="#6f8698">${l && l.round ? (l.round === 'dev' ? 'development round' : `round ${l.round}`) : 'the loop'}</text></svg>`;
  let line = 'No round is running right now.';
  if (l && l.stage && l.stage !== 'idle') {
    const what = l.round === 'dev' ? 'The development round' : `Round ${l.round}`, t = l.train, h = l.harvest, c = l.stage === 'cold-distilled' ? l.cold.distilled : l.cold && l.cold.base;
    line = `${what} is starting.`;
    if (l.stage === 'harvest' && h) line = `${what}: <b>${h.done} of ${h.total}</b> problems worked under the checker · ${h.complete} finished.`;
    if (l.stage === 'build') line = `${what}: <b>${l.examples}</b> verified examples built.`;
    if (l.stage === 'train' && t) line = `${what}: learning its own verified working · <b>step ${t.step} of ${t.steps}</b>${t.loss.length ? ` · training loss ${t.loss[0].toFixed(3)} → ${t.loss[t.loss.length - 1].toFixed(3)}` : ''}.`;
    if ((l.stage === 'cold-base' || l.stage === 'cold-distilled') && c) line = `${what}: held-out problems, cold, ${l.stage === 'cold-base' ? 'before' : 'after'} training · <b>${c.done} of ${c.total}</b>.`;
    if (l.stage === 'judged') line = d && d.headline && l.done ? `${what} has landed: <b>${esc(d.headline.was)} → ${esc(d.headline.now)}</b> right, cold. Its weights wait for a person's yes. No round is running now.` : `${what}: judged. The numbers appear here once every record has been checked again.`;
    if (t && t.loss.length > 1) { const top = Math.max(...t.loss, 0.001), pts = t.loss.map((y, i) => `${(i / (t.loss.length - 1) * 300).toFixed(1)},${(58 - 54 * Math.min(1, y / top)).toFixed(1)}`).join(' '); line += `<svg class="spark" viewBox="0 0 300 60" preserveAspectRatio="none" role="img" aria-label="Training loss, falling."><polyline points="${pts}" fill="none" stroke="#49e8c8" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><span class="dim" style="font-size:11.5px">training loss on its own verified working</span>`; }
    line += `<br><span class="dim" style="font-size:11.5px">as of ${esc(String(l.at || '').replace('T', ' ').slice(0, 16))} UTC · <a href="${d ? d.live : '#'}" style="color:inherit">open the build</a></span>`;
  }
  $('liveBox').innerHTML = line;
  const h = d && d.headline, dv = S.dev && S.dev.cold;
  const src = d ? `<a class="src" href="${d.live}">receipt: the distillation ↗</a>` : '';
  $('rsiReceipts').innerHTML = (h ? `<div class="stat reveal"><div class="n"><span class="was">${esc(h.was)}</span><span class="arrow">→</span><span class="now">${esc(h.now)}</span></div><div class="lab"><b>Right, cold, on ${h.of} unseen problems.</b> The same model, before and after one round of its own verified work.</div>${src}</div>` : `<div class="stat reveal"><div class="n"><span class="was">—</span><span class="arrow">→</span><span class="wait">—</span></div><div class="lab"><b>Round 1, cold, on unseen problems.</b> The number lands here, pass or fail. ${SEALING}</div></div>`)
    + (dv ? `<div class="stat reveal"><div class="n"><span class="was">${dv.base.right}</span><span class="arrow">→</span><span class="${dv.distilled.right > dv.base.right ? 'wait' : 'bad'}">${dv.distilled.right}</span></div><div class="lab"><b>The practice round</b>, of ${dv.n} unseen problems. It set the settings and is not a claim. <span class="tag gd">not a claim</span></div>${d ? `<a class="src" href="${d.live}data/dev/verdict.json">receipt: its verdict ↗</a>` : ''}</div>` : `<div class="stat reveal"><div class="n"><span class="wait">6</span></div><div class="lab"><b>Claims written down first.</b> Lift, still honest, the wall moved, verify-or-dissolve, clean data, held-out integrity. ${SEALING}</div>${d ? `<a class="src" href="${d.live}CLAIMS.md">receipt: the claims ↗</a>` : ''}</div>`)
    + `<div class="stat reveal"><div class="n"><span class="now">0</span></div><div class="lab"><b>Changes to the model without a person.</b> Adopted weights wait for a recorded grant, by design and by test.</div>${d ? `<a class="src" href="${d.live}#loop">receipt: the gate at the weights ↗</a>` : ''}</div>`;
}
function renderEstate() {
  const e = S.estate;
  if (!e) { $('estateStats').innerHTML = ''; $('shelf').innerHTML = ''; return; }
  const src = `<a class="src" href="https://github.com/${esc(e.org)}?tab=repositories">receipt: the repositories, indexed ${esc(e.indexed)} ↗</a>`;
  const gates = S.builds.filter((b) => b.gate), killed = gates.reduce((a, b) => a + b.gate.killed, 0) + (S.gate ? S.gate.killed : 0), total = gates.reduce((a, b) => a + b.gate.total, 0) + (S.gate ? S.gate.total : 0);
  $('estateStats').innerHTML = `<div class="stat reveal"><div class="n"><span class="now" data-count="${e.public.toLocaleString('en')}">${e.public.toLocaleString('en')}</span></div><div class="lab"><b>Public repositories.</b> Every one readable, forkable, yours to run.</div>${src}</div>`
    + `<div class="stat reveal"><div class="n"><span class="now" data-count="${e.live.toLocaleString('en')}">${e.live.toLocaleString('en')}</span></div><div class="lab"><b>Live pages.</b> Each one answered when it was read on ${esc(e.read)}.</div><a class="src" href="data/estate.json">receipt: the count, as read ↗</a></div>`
    + `<div class="stat reveal"><div class="n"><span class="now">${killed.toLocaleString('en')}</span><span class="was" style="font-size:.42em"> /${total.toLocaleString('en')}</span></div><div class="lab"><b>Planted bugs caught</b> across these builds, by their own tests.${total > killed ? ` Each of the ${total - killed} not caught is written down with its reason.` : ' None exempted.'}</div><a class="src" href="data/gates.json">receipt: this page's own gate ↗</a></div>`;
  bind('h.rest', `Of ${e.live.toLocaleString('en')} older live pages read on ${esc(e.read)}, ${e.onStandard === 0 ? 'none meets' : `${e.onStandard} meet`} it. The five builds above, made since, do. The rest will be rebuilt to it, starting with the pages visitors see most.`);
  $('shelf').innerHTML = e.shelf.map((r, i) => `<a class="srow" href="${r.url}" style="text-decoration:none"><div class="d">${esc(r.row.split(' ')[0].toUpperCase().slice(0, 5))}</div><div class="nm"><b>${esc(r.repo)}</b><span>${esc(r.line)}</span><span class="tag cy">live ↗</span></div></a>`).join('');
}

function render() {
  renderLoop(); renderEstate();
  const v = B('the-verifier-set'), c = B('the-crystal'), d = B('the-distillation');
  const u = v && v.extra.find((x) => x.key === 'unanswerable'), f = c && c.extra.find((x) => x.key === 'forged');
  const none = (lab) => `<div class="stat reveal"><div class="n"><span class="wait">—</span></div><div class="lab">${lab} ${SEALING}</div></div>`;
  $('receipts').innerHTML = (u ? `<div class="stat reveal"><div class="n"><span class="was">${esc(u.value)}</span><span class="arrow">→</span><span class="now" data-count="${esc(u.after)}">${esc(u.after)}</span></div><div class="lab">Of <b>${u.of} questions with no answer</b>, the raw model gave ${esc(u.value)} confident numbers. Checked, it gave none.</div>${src(v, 'the verifier set')}</div>` : none('Confident numbers given to questions with no answer.'))
    + (v && v.headline ? `<div class="stat reveal"><div class="n"><span class="was">${esc(v.headline.was)}</span><span class="arrow">→</span><span class="now" data-count="${esc(v.headline.now)}">${esc(v.headline.now)}</span></div><div class="lab">Right, of <b>${v.headline.of} sealed problems</b> it had never seen. Same model, same weights. The only change is a checker.</div>${src(v, 'the verifier set')}</div>` : none('Sealed problems right, unchecked then checked.'))
    + (f ? `<div class="stat reveal"><div class="n"><span class="now" data-count="${esc(f.value)}">${esc(f.value)}</span><span class="was" style="font-size:.42em"> /${f.of.toLocaleString('en')}</span></div><div class="lab"><b>Fake answers</b> that fooled the checker, out of ${f.of.toLocaleString('en')} we threw at it.</div>${src(c, 'the crystal')}</div>` : none('Fake answers that fooled the checker.'));
  $('readLine').innerHTML = S.live === null ? `Read from each build's own page on ${esc(S.read)}, at a named commit. Reading them again, live…` : S.live.tried === 0 ? `Read from each build's own page on ${esc(S.read)}, at a named commit.` : `<span class="${S.live.differ ? 'fail' : 'pass'}">Read again just now, in this tab, from ${S.live.got} of ${S.live.tried} live pages: ${S.live.differ ? `${S.live.differ} differ from the reading of ${esc(S.read)}, and the live reading is shown` : 'every number agrees'}.</span>`;
  $('builds').innerHTML = S.builds.map((b, i) => { const h = b.headline, wait = !h && b.claims.sealing > 0, cells = grown(b);
    return `<a class="act reveal" href="${b.live}"><span class="num">0${i + 1} — ${esc(b.name.toUpperCase())}${wait ? ` ${SEALING}` : ''}</span><h3>${esc(b.verb)}</h3><p>${esc(b.line)}${h ? ` <b style="color:var(--ink)">${esc(h.was)} → ${esc(h.now)}</b> of ${h.of} sealed problems.` : cells ? ` <b style="color:var(--ink)">${esc(cells.sealed)} of ${cells.of}</b> cells sealed, ${esc(cells.dissolved)} dissolved.` : ''}${b.claims.n ? ` <span class="dim">${b.claims.pass} of ${b.claims.n} claims passed${b.claims.fail ? `, ${b.claims.fail} failed and kept` : ''}${b.claims.sealing ? `, ${b.claims.sealing} sealing` : ''}.</span>` : ''}</p><span class="go">Open the live proof →</span></a>`; }).join('');
  const reuse = S.reuse ? Math.round(100 * S.reuse.taken / (S.reuse.taken + S.reuse.worked)) : null;
  const tagOf = (id) => (id === 'D5' ? (d && d.headline ? `<span class="tag cy">${esc(d.headline.was)} → ${esc(d.headline.now)} cold</span>` : SEALING) : '');
  $('stackRows').innerHTML = LAYERS.map(([id, nm, line]) => `<div class="srow ${id === 'D5' && !(d && d.headline) ? 'gold' : ''}"><div class="d">${id}</div><div class="nm"><b>${nm}</b><span>${line}</span>${tagOf(id)}</div></div>`).join('');
  const win = (n, l, href) => `<div class="win reveal"><div class="wn">${n}</div><div class="wl">${l}${href ? ` <a class="src" href="${href}">receipt ↗</a>` : ''}</div></div>`;
  const pass = S.builds.reduce((a, b) => a + b.claims.pass, 0), fail = S.builds.reduce((a, b) => a + b.claims.fail, 0), sealing = S.builds.reduce((a, b) => a + b.claims.sealing, 0);
  $('wins').innerHTML = win(reuse !== null ? `${reuse}%` : '—', 'of what the model reads is kept from its last step, not read again: a speed test, not a score', d ? `${d.live}data/parity.json` : '')
    + win(f ? `${esc(f.value)}<span class="of">/${f.of.toLocaleString('en')}</span>` : '—', 'fake answers that fooled the checker', c ? c.live : '')
    + win(`${pass}<span class="of">/${pass + fail}</span>`, `claims passed across the builds; ${fail} failed, and ${fail === 1 ? 'stays' : 'stay'} on ${fail === 1 ? 'its page' : 'their pages'} in red${sealing ? `; ${sealing} more are sealing now` : ''}`, '')
    + win(S.gate ? `${S.gate.killed}<span class="of">/${S.gate.total}</span>` : '—', 'planted bugs caught in this page\'s own code', 'data/gates.json');
  $('wall').innerHTML = S.builds.map((b, i) => { const bad = b.standard.rules.filter((r) => !r.pass);
    return `<div class="srow ${b.standard.pass ? '' : 'red'}"><div class="d">0${i + 1}</div><div class="nm"><b>${esc(b.name)}</b><span>${b.standard.rules.map((r) => `<span class="${r.pass ? 'pass' : 'fail'}" title="${esc(r.why)}">${r.id}${r.pass ? '✓' : '✗'}</span>`).join(' ')} · ${b.standard.viewWords.toLocaleString('en')} words before a click</span>${b.standard.pass ? '<span class="tag cy">meets it</span>' : `<span class="tag rd">fails ${bad.length} of 7 · kept</span>`}</div></div>`; }).join('');
  const failed = S.builds.flatMap((b) => b.claims.failed.map((x) => `${esc(b.name)}'s ${esc(x.id)} (${esc(x.name.toLowerCase())})`));
  bind('h.failed', failed.length ? `${failed.join('; ')} failed its bar and is still on its page, in red.` : 'No sealed claim has failed so far; when one does it stays on its page, in red.');
  const dh = B('the-distillation') && B('the-distillation').headline;
  bind('h.loop', dh ? `The retraining loop has run one sealed round: ${esc(dh.was)} → ${esc(dh.now)} right, cold, on ${dh.of} unseen problems. One round, one kind of problem. Its own page says where it did not improve.` : 'The loop that lets the model retrain on its own verified work is sealing now. Its number appears here when it lands, pass or fail, and not before.');
  bind('h.gate', S.gate ? `Its own code's gate: ${S.gate.killed} of ${S.gate.total} planted bugs caught.` : '');
  S.faces = faces();
  const toRebuild = S.builds.filter((b) => !b.standard.pass).length;
  S.rest = `${S.faces.filter((x) => x.state === 1).length} receipts sealed · ${S.faces.filter((x) => x.state === 2).length} sealing now · ${failed.length} failed and kept${toRebuild ? ` · ${toRebuild} ${toRebuild === 1 ? 'page' : 'pages'} still to rebuild` : ''} · point at a face`;
  $('facet').innerHTML = S.rest;
  if (S.crystal) S.crystal.setFaces(S.faces.map((x) => x.state));
  HOUSE.reveal(document);                                                 // what was just drawn rises in like the rest
}

// grown(b) → a build that states cells instead of a before and after: how many it sealed and dissolved, or null
function grown(b) { const s = b.extra.find((x) => x.key === 'sealed'), d = b.extra.find((x) => x.key === 'dissolved'); return s && d ? { sealed: s.value, dissolved: d.value, of: s.of } : null; }

// one face for every receipt on the page, in the order the page shows them
function faces() {
  const out = [], v = B('the-verifier-set'), c = B('the-crystal'), d = B('the-distillation');
  const add = (state, text, to) => out.push({ state, text, to });
  const u = v && v.extra.find((x) => x.key === 'unanswerable'), f = c && c.extra.find((x) => x.key === 'forged');
  add(d && d.headline ? 1 : 2, d && d.headline ? `<b>Self-improvement · ${esc(d.headline.was)} → ${esc(d.headline.now)}</b> cold, on ${d.headline.of} unseen problems` : '<b>Self-improvement</b> · round 1 · sealing now', 'rsi');
  add(u ? 1 : 2, u ? `<b>${esc(u.value)} → ${esc(u.after)}</b> · confident numbers to questions with no answer` : 'sealing now', 'result');
  add(v && v.headline ? 1 : 2, v && v.headline ? `<b>${esc(v.headline.was)} → ${esc(v.headline.now)}</b> of ${v.headline.of} sealed problems · The Verifier Set` : 'sealing now', 'result');
  add(f ? 1 : 2, f ? `<b>${esc(f.value)} of ${f.of.toLocaleString('en')}</b> fake answers fooled the checker · The Crystal` : 'sealing now', 'result');
  for (const b of S.builds) add(b.headline ? 1 : b.claims.sealing > 0 ? 2 : 1, `<b>${esc(b.name)}</b> · ${b.headline ? `${esc(b.headline.was)} → ${esc(b.headline.now)} of ${b.headline.of}` : b.claims.sealing > 0 ? 'sealing now' : grown(b) ? `${esc(grown(b).sealed)} of ${grown(b).of} cells sealed, ${esc(grown(b).dissolved)} dissolved` : 'live'}`, 'builds-s');
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
    for (const b of S.builds) { const g = await getJSON(`../${b.repo}/data/gates.json`); if (g && Number.isInteger(g.killed) && Number.isInteger(g.total)) b.gate = { killed: g.killed, total: g.total, clean: g.clean === true }; }
    const dv = await getJSON('../the-distillation/data/dev/verdict.json'); if (dv && dv.cold) S.dev = { cold: { n: dv.cold.n, base: { right: dv.cold.base.right }, distilled: { right: dv.cold.distilled.right } } };
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
  const r = STANDARD.check(html), p = PLAIN.check(html), line = (x) => `<span class="${x.pass ? 'pass' : 'fail'}">${x.id} ${esc(x.name)}</span>: ${esc(x.why)}`;
  $('pasteOut').innerHTML = `${r.pass ? '<span class="pass">It meets the house standard.</span>' : `<span class="fail">It fails ${r.rules.filter((x) => !x.pass).length} of 7.</span>`}<br>${r.rules.map(line).join('<br>')}<br><br>${p.pass ? '<span class="pass">A twelve-year-old can read it.</span>' : `<span class="fail">It is not plain enough yet: ${p.rules.filter((x) => !x.pass).length} of 5.</span>`}<br>${p.rules.map(line).join('<br>')}`;
}

const ready = (async () => {
  const f = await getJSON('data/flagships.json');
  if (f) Object.assign(S, { builds: f.builds, reuse: f.reuse, read: f.read, dev: f.dev || null, loop: f.loop || null });
  S.estate = await getJSON('data/estate.json');
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
  const loop = async () => { const l = await getJSON(`../the-distillation/data/live.json?${Date.now()}`); if (l && l.stage) { S.loop = l; renderLoop(); HOUSE.reveal(document); if (S.crystal && !l.done && !l.failed && l.stage !== 'idle') S.crystal.setEnergy(1.2); } };
  if (typeof location !== 'undefined' && /^https?:$/.test(location.protocol)) { reread(); loop(); if (typeof setInterval === 'function') setInterval(loop, 60000); }   // live, as soon as the page is open, and kept live
  if (typeof navigator !== 'undefined' && navigator.serviceWorker && typeof location !== 'undefined' && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
window.__house = { ready, S, render, reread, tryPage, faces };
