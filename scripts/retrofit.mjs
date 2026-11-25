// retrofit.mjs — bring a build that was written before the house standard up to it, IN PLACE, without touching
// what it proves. The build's kernels, records, seal and page script are left exactly as they are. What changes is
// the page around them: the house hero (the crystal, lit by the build's own claims), receipts and a claim stack read
// from what the page has already worked out, the build's own interactive glass, and every long section folded behind
// a click. Nothing is deleted: every word the page had is still on it.
//   node scripts/retrofit.mjs <repo folder>      (the build's page/template.html must still be the old layout)
// What it does to the folder: vendor/house/ (the kit, the ship gate, the receipts reader), page/template.html
// (rebuilt), page/house-app.js (new), scripts/make-page.mjs (told about the kit). Then build and test as that
// repository does. It refuses a folder it does not know, or one it has already rebuilt.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, basename } from 'node:path';

const here = fileURLToPath(new URL('../', import.meta.url));
const CREDIT = 'Powered by the Konomi architecture, created by Thomas Frumkin.';
export const BUILDS = {
  'the-verifier-set': { name: 'The Verifier Set', ready: '__verifier', h1: 'It refuses to <em>lie.</em>', sub: 'Every answer is checked against the arithmetic or the cited source. If it cannot be checked, it is not released.', claim: 'The same 1B model. Once with the checks, once without. <b>The checks do the work.</b>', glass: 'Grow it on your own graphics chip, or play the sealed record. Nothing leaves your browser.', receipt: 'data/runs/sealed.json',
    limits: ['<b>Grounded is not true.</b> A cited figure is as true as its document. It is labelled grounded, never proven.', '<b>Narrow on purpose.</b> Figures, rules, simple claims and sums. Where no check can say yes, there is no answer.', '<b>One sealed run.</b> One model, problems made by code. It says nothing about messy documents.'] },
  'the-crystal': { name: 'The Crystal', ready: '__crystal', h1: 'It <em>crystallises.</em>', sub: 'The answer is grown from proven pieces, in parallel. What cannot be proven dissolves.', claim: 'One try, against a crystal grown one checked step at a time. <b>Same model, same weights.</b>', glass: 'Grow one on your own graphics chip, or play the sealed record. Nothing leaves your browser.', receipt: 'data/runs/sealed.json',
    limits: ['<b>The reach of the check.</b> The only check is exact arithmetic. Nothing else can bond.', '<b>The model did not get smarter.</b> It is the same small model at the last facet as at the first.', '<b>One sealed run.</b> Problems made by code. An attack that found no leak is evidence, not a proof.'] },
  'the-climb': { name: 'The Climb', ready: '__climb', ids: { claims: 'verdicts', glass: 'live' }, compose: [['right at the first try', 'hl.cold'], ['right after the climb', 'hl.climb']],
    // its page is flat; its glass is the "live" section. The light theme is retired (the house is committed dark): its
    // button stays in the markup, hidden, so the unchanged page script still finds it. A price is not put on a page.
    flat: { glass: 'live', keep: '<button id="theme" type="button" hidden>Theme</button>', drop: ['  <span class="chip">charge per problem <b>$0</b> <span class="muted">(one model download, then your own hardware)</span></span>\n'] }, h1: 'It <em>climbs.</em>', sub: 'A problem it fails cold, broken into steps it can do. Each step is checked before the next.', claim: 'One try, against the climb. <b>Same model, same weights.</b>', glass: 'Run the climb on your own graphics chip, or replay the sealed record. Nothing leaves your browser.', receipt: 'data/runs/sealed.json',
    limits: ['<b>A claim failed, and stays.</b> Not every pre-registered claim passed. The one that did not is in the stack above, in red.', '<b>The reach of the check.</b> Exact arithmetic only. Where it cannot check, it gives no answer.', '<b>One sealed run.</b> One model, problems made by code.'] },
  // its page is a plain top section and panels, and one panel ("plant") is its glass. It has no table of claims: its
  // stack is its organs, and its receipts come from its recorded plant, so it brings a house layer of its own
  // (retrofit/the-seed.js). Two of its ids were each on two elements; the sections that held them are renamed.
  'the-seed': { name: 'The Seed', ready: '__seed', ids: { claims: 'organs', glass: 'run' }, panel: { glass: 'plant', rename: { blueprint: 'built' } }, layer: 'retrofit/the-seed.js',
    noCredit: "left off on the owner's instruction for this build, until he rules on it",
    stack: { kline: 'How it is built', claim: 'Small files, one job each. <b>Every one mutation-gated.</b>', wait: 'Reading the gate record.' }, cta: 'Plant it yourself', crystal: 'Each lit face is one organ, one cell the model grew, or one probe of the floor: cyan when it held, red when it did not.',
    swap: [['<li><b>Depth 5 is not built.</b> The distillation organ harvests verified cells and gates adoption, but it does not train weights, and it never adopts without beating the sealed set and a human grant.</li>', '<li><b>The seed does not train.</b> Its distillation organ harvests verified cells and gates adoption; it changes no weights, and it never adopts without beating the sealed set and a human grant. The training itself is a separate build, <a href="https://sjgant80-hub.github.io/the-distillation/">The Distillation</a>.</li>']],
    h1: 'Plant it. It <em>grows.</em>', sub: 'A handful of small files. Give it a model and an empty workspace, and it grows software one checked cell at a time. What cannot prove itself dissolves.', claim: 'A 1B model, planted in a browser tab. <b>It kept only what it could prove.</b>', glass: 'Plant it on your own graphics chip, or show the recorded plant. Nothing leaves your browser.', receipt: 'data/runs/plant.json',
    limits: ['<b>A first cell, not a finished organism.</b> It shows the loop is alive and every bond is checked. It has not grown an estate.', '<b>Grounded is not true.</b> A grounded cell cites its document faithfully. If the document is wrong, so is the cell.', '<b>It does not train.</b> Its distillation organ gates adoption. It changes no weights.', '<b>The model is not pinned.</b> The browser model comes from a public library and is not checked against a fixed fingerprint here.'] },
};

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
// scope(css) → the old page's own styles, kept for its own content only: every rule sits under .legacy, the old
// colours become .legacy's own, and the rules for parts the house now provides (page, header, hero, footer) go.
// rules(css) → each top-level rule of a style sheet on a line of its own, however the sheet was laid out
export function rules(css) {
  const out = []; let depth = 0, cur = '';
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    cur += ch === '\n' || ch === '\r' ? ' ' : ch;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { out.push(cur.replace(/\s+/g, ' ').replace(/\s*\{\s*/g, '{').replace(/\s*\}\s*/g, '}').trim()); cur = ''; } }
  }
  return out;
}
export function scope(css) {
  const out = [], gone = /^(\*|html|body|main|header|footer|nav|:root|#gem|\.top|\.hero|\.mark|section\.panel|h1)([\s{>,:. ]|$)/;
  const one = (rule) => { const i = rule.indexOf('{'); if (i < 0) return ''; const sels = rule.slice(0, i).split(',').map((s) => s.trim()).filter((s) => s && !gone.test(s)); return sels.length ? `${sels.map((s) => (s.startsWith('#') ? s : `.legacy ${s}`)).join(',')}${rule.slice(i)}` : ''; };
  for (const line of rules(css)) {
    // the house is committed dark: where the old page had a dark theme of its own, those are its colours now
    if (/^:root\[data-theme="?dark"?\]\{/.test(line)) { out.push(`.legacy{${line.slice(line.indexOf('{') + 1, -1).replace(/color-scheme:[^;}]+;?/, '')}}`); continue; }
    if (line.startsWith('@font-face') || line.startsWith(':root[')) continue;        // the faces are the kit's
    if (line.startsWith(':root{')) { out.push(`.legacy{${line.slice(6, -1).replace(/color-scheme:[^;}]+;?/, '')}}`); continue; }
    if (line.startsWith(':root')) continue;                                             // a theme switch: the house is committed dark
    if (line.startsWith('@media')) { const i = line.indexOf('{'), inner = line.slice(i + 1, -1).split('}').filter((r) => r.trim()).map((r) => one(`${r}}`)).filter(Boolean).join(''); if (inner) out.push(`${line.slice(0, i)}{${inner}}`); continue; }
    if (line.startsWith('@')) { out.push(line); continue; }
    const r = one(line); if (r) out.push(r);
  }
  return out.join('\n');
}

if (process.argv[1] && process.argv[1].endsWith('retrofit.mjs')) {
  const dir = process.argv[2], repo = dir ? basename(dir.replace(/[\\/]+$/, '')) : '', cfg = BUILDS[repo];
  const stop = (why) => { console.error(`not rebuilt: ${why}`); process.exit(1); };
  if (!cfg) stop(`usage: node scripts/retrofit.mjs <folder of one of: ${Object.keys(BUILDS).join(', ')}>`);
  const at = (p) => join(dir, p), t = readFileSync(at('page/template.html'), 'utf8').split('\r\n').join('\n');
  if (t.includes('/*HOUSE_CSS*/')) stop('this page is already on the house standard');
  const css = t.slice(t.indexOf('<style>') + 7, t.indexOf('</style>')), head = t.slice(0, t.indexOf('<style>'));
  const body = t.slice(t.indexOf('<body>') + 6, t.indexOf('<script type="module">')), script = t.slice(t.indexOf('<script type="module">'));
  const canvas = (body.match(/<canvas id="gem"[\s\S]*?<\/canvas>/) || [''])[0];
  const hero = body.match(/<section class="hero" id="top">([\s\S]*?)<\/section>/);
  const ids = { claims: 'claims', glass: 'glass', ...(cfg.ids || {}) };   // the house sections' own names, where the old page already uses the usual ones
  let kept, lead, panels;                                                  // panels: [id, title, html]
  const top = !hero && cfg.panel ? body.match(/<section id="top">([\s\S]*?)<\/section>/) : null;
  if (top) {
    // a plain top section and panels: the top's controls and the glass panel's contents together are the glass
    const all = [...body.matchAll(/<section class="panel" id="([^"]+)">\s*<h2>([\s\S]*?)<\/h2>([\s\S]*?)<\/section>/g)].map((m) => [m[1], m[2], m[3]]);
    const live = all.find((p) => p[0] === cfg.panel.glass);
    if (!live) stop('the old glass was not found');
    const rest = top[1].replace(/<p class="kicker">[\s\S]*?<\/p>/, '').replace(/<h1>[\s\S]*?<\/h1>/, '').replace(/<p class="lead">[\s\S]*?<\/p>/, '').replace(/<p class="tags">[\s\S]*?<\/p>/, '').trim();
    kept = `${rest}\n      ${live[2].trim()}`;
    lead = (top[1].match(/<p class="lead">[\s\S]*?<\/p>/) || [''])[0];
    panels = all.filter((p) => p !== live).map((p) => [(cfg.panel.rename || {})[p[0]] || p[0], p[1], p[2]]);
  } else if (hero) {
    kept = hero[1].replace(/<p class="kicker">[\s\S]*?<\/p>/, '').replace(/<h1>[\s\S]*?<\/h1>/, '').replace(/<p class="lead">[\s\S]*?<\/p>/, '').replace(/<p class="tags">[\s\S]*?<\/p>/, '').trim();
    lead = (hero[1].match(/<p class="lead">[\s\S]*?<\/p>/) || [''])[0];
    panels = [...body.matchAll(/<section class="panel" id="([^"]+)">\s*<h2>([\s\S]*?)<\/h2>([\s\S]*?)<\/section>/g)].map((m) => [m[1], m[2], m[3]]);
  } else {
    // a flat page: one <main>, its sections marked only by <h2 id="…">. One of them is its glass.
    const main = body.slice(body.indexOf('<main'), body.indexOf('<footer')), first = main.indexOf('<h2 ');
    if (!cfg.flat || first === -1) stop('the old hero was not found');
    const intro = main.slice(main.indexOf('>') + 1, first).replace(/<h1>[\s\S]*?<\/h1>/, '');
    const parts = main.slice(first).split(/(?=<h2 id=")/).map((p) => p.match(/^<h2 id="([^"]+)">([\s\S]*?)<\/h2>([\s\S]*)$/)).filter(Boolean).map((m) => [m[1], m[2], m[3].trim()]);
    const live = parts.find((p) => p[0] === cfg.flat.glass);
    if (!live) stop('the old glass was not found');
    const say = (live[2].match(/^<p>[\s\S]*?<\/p>/) || [''])[0];
    kept = `${live[2].slice(say.length).trim()}\n      ${cfg.flat.keep || ''}`;
    lead = `${(cfg.flat.drop || []).reduce((s, x) => s.split(x).join(''), intro).trim()}\n${say}`;
    panels = parts.filter((p) => p !== live);
  }
  if (panels.length === 0) stop('no sections were found');
  for (const [was, now] of cfg.swap || []) { const i = panels.findIndex((p) => p[2].includes(was)); if (i === -1) stop(`a line to bring up to date was not found: ${was.slice(0, 60)}`); panels[i][2] = panels[i][2].split(was).join(now); }
  const lim = panels.find((p) => p[0] === 'limits');
  const loose = (body.match(/<div id="tip"[\s\S]*?<\/div>/) || [''])[0];
  const foot = (body.match(/<footer>([\s\S]*?)<\/footer>/) || ['', ''])[1].replace(CREDIT, '').replace(/<br>\s*<br>/g, '<br>').trim();
  const stack = { kline: 'The claims, written down first', claim: 'The pass marks were fixed <b>before the sealed run.</b>', wait: 'Reading the sealed record.', ...(cfg.stack || {}) };
  const page = `${head}${cfg.noCredit ? `<meta name="house-exemption" content="credit: ${cfg.noCredit}">\n` : ''}<style>
/*HOUSE_CSS*/
/* this build's own styles, for its own content, which now sits behind a click or inside the glass */
#gem{position:relative;display:block;width:100%;height:min(68vh,560px);touch-action:none;cursor:grab;border-radius:14px;background:#02070c;margin:0 0 16px}
.legacy{font-size:15px;line-height:1.6;color:var(--ink)}
${scope(css)}
</style>
</head>
<body>
<header class="hero" id="top">
  <canvas id="crystal" role="img" aria-label="A crystal of 32 faces. ${cfg.crystal || "Each lit face is one of this build's pre-registered claims: cyan when it passed, red when it failed and is kept."}"></canvas>
  <div class="hero-shade"></div>
  <div class="wrap">
    <p class="eyebrow">AI Native Solutions · ${cfg.name}</p>
    <h1>${cfg.h1}</h1>
    <p class="sub">${cfg.sub}</p>
    <div class="cta"><a class="btn primary" href="#result">See the result →</a><a class="btn ghost" href="#${ids.glass}">${cfg.cta || 'Run it yourself'}</a></div>
  </div>
  <p class="facet" id="hsFacet" aria-live="polite">Reading the sealed record.</p>
</header>

<section class="pad" id="result">
  <div class="wrap">
    <p class="kline reveal">The result</p>
    <h2 class="claim reveal">${cfg.claim}</h2>
    <div class="stats" id="hsReceipts">Reading the sealed record.</div>
  </div>
</section>

<section class="pad alt" id="${ids.claims}">
  <div class="wrap">
    <p class="kline reveal">${stack.kline}</p>
    <h2 class="claim reveal">${stack.claim}</h2>
    <div class="stack reveal" id="hsClaims">${stack.wait}</div>
  </div>
</section>

<section class="pad proof" id="${ids.glass}">
  <div class="wrap">
    <h2 class="hl reveal"><span class="a">Don't trust us.</span><br><span class="b">Re-run it.</span></h2>
    <p class="sub2 reveal">${cfg.glass}</p>
    <div class="glass legacy reveal" style="text-align:left">
      ${canvas}
      ${kept}
    </div>
    ${loose}
    <details class="honest reveal"><summary>What this does — and doesn't — claim</summary><div class="in">${cfg.limits.map((l) => `<p>${l}</p>`).join('')}${lim ? `<p>The full list is below, under "${strip(lim[1])}".</p>` : ''}</div></details>
  </div>
</section>

<section class="pad alt" id="full">
  <div class="wrap">
    <p class="kline reveal">Everything, in full</p>
    <h2 class="claim reveal">Every detail is still here. <b>One click away.</b></h2>
    ${lead ? `<details class="honest reveal" style="max-width:none"><summary>What it is, in one paragraph</summary><div class="in legacy">${lead}</div></details>` : ''}
${panels.map((p) => `    <details class="honest reveal" id="${p[0]}" style="max-width:none"><summary>${strip(p[1])}</summary><div class="in legacy">${p[2].trim()}</div></details>`).join('\n')}
  </div>
</section>

<footer>
  <div class="wrap frow">
    <div><div class="brand">${cfg.name}</div><div class="fnote">${foot}${cfg.noCredit ? '' : `<br>${CREDIT}`}</div></div>
    <div class="taglist"><span>›</span> AI you own. Proof you can re-run.<br><span>›</span> A small model that says "I can't tell."<br><span>›</span> Nothing leaves your browser.</div>
  </div>
</footer>
${script}`;
  writeFileSync(at('page/template.html'), page);
  // where the page script writes what it works out: every baked id and every binding of the old page
  const baked = (readFileSync(at('scripts/make-page.mjs'), 'utf8').match(/export const BAKED = \[([^\]]*)\]/) || ['', ''])[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  const KEYS = JSON.stringify({ ids: baked, binds: [...new Set([...t.matchAll(/data-bind="([^"]+)"/g)].map((m) => m[1]))] });
  // the house layer: it reads what the page above has already worked out from the sealed run, and shows it the house way
  if (cfg.layer) copyFileSync(join(here, cfg.layer), at('page/house-app.js'));
  else writeFileSync(at('page/house-app.js'), `// house-app.js — the house layer. It adds nothing to what this build proves: it waits for the page script above to
// finish, reads what that script worked out from the sealed run (with the house's receipts reader, vendored), and
// shows it as receipts, a claim stack and a crystal whose lit faces are this build's claims.
window.__houseLayer = (async () => {
  await window.${cfg.ready}.ready;
  const KEYS = ${KEYS};
  const el = (id) => document.getElementById(id), safe = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const drawn = [...KEYS.ids.map((id) => el(id)), ...KEYS.binds.flatMap((k) => [...document.querySelectorAll(\`[data-bind="\${k}"]\`)])].map((e) => (e && typeof e.innerHTML === 'string' ? e.innerHTML : '')).join(' ');
  // where the old page writes a number beside its label, the two are read together, as a visitor reads them
  const said = ${JSON.stringify(cfg.compose || [])}.map(([words, k]) => \`\${words} \${[...document.querySelectorAll(\`[data-bind="\${k}"]\`)].map((e) => e.innerHTML).join(' ')}\`).join(' ');
  const html = \`<body>\${drawn} \${said}</body>\`, claims = RECEIPTS.claims(html), head = RECEIPTS.headline('${repo}', html), more = RECEIPTS.extra('${repo}', html);
  const src = '<a class="src" href="${cfg.receipt}">receipt: the sealed run ↗</a>', passed = claims.filter((c) => c.pass === true).length, failed = claims.filter((c) => c.pass === false);
  const stats = [];
  if (head) stats.push(\`<div class="stat reveal"><div class="n"><span class="was">\${safe(head.was)}</span><span class="arrow">→</span><span class="now">\${safe(head.now)}</span></div><div class="lab"><b>Of \${head.of} sealed problems.</b> \${safe(head.label[0].toUpperCase() + head.label.slice(1))}.</div>\${src}</div>\`);
  for (const x of more) stats.push(\`<div class="stat reveal"><div class="n">\${x.after !== undefined ? \`<span class="was">\${safe(x.value)}</span><span class="arrow">→</span><span class="now">\${safe(x.after)}</span>\` : \`<span class="now">\${safe(x.value)}</span><span class="was" style="font-size:.42em"> /\${x.of.toLocaleString('en')}</span>\`}</div><div class="lab"><b>\${safe(x.label[0].toUpperCase() + x.label.slice(1))}.</b> Of \${x.of.toLocaleString('en')}.</div>\${src}</div>\`);
  if (claims.length) stats.push(\`<div class="stat reveal"><div class="n"><span class="now">\${passed}</span><span class="was" style="font-size:.42em"> /\${claims.length}</span>\${failed.length ? \` <span class="bad" style="font-size:.5em">−\${failed.length}</span>\` : ''}</div><div class="lab"><b>Pre-registered claims passed.</b> \${failed.length ? \`\${failed.map((c) => c.id).join(', ')} failed and \${failed.length === 1 ? 'is' : 'are'} kept on the page, in red.\` : 'A claim that fails stays on the page, in red.'}</div>\${src}</div>\`);
  el('hsReceipts').innerHTML = stats.join('') || '<div class="stat"><div class="n"><span class="wait">—</span></div><div class="lab">The sealed run. <span class="tag gd">sealing now</span></div></div>';
  el('hsClaims').innerHTML = claims.map((c) => \`<div class="srow \${c.pass === false ? 'red' : c.pass === null ? 'gold' : ''}"><div class="d">\${c.id}</div><div class="nm"><b>\${safe(c.name)}</b><span>\${safe(c.result)}</span>\${c.pass === true ? '<span class="tag cy">pass</span>' : c.pass === false ? '<span class="tag rd">fail · kept</span>' : '<span class="tag gd">sealing now</span>'}</div></div>\`).join('') || '<div class="srow gold"><div class="d">—</div><div class="nm"><span>the sealed run is not published yet</span><span class="tag gd">sealing now</span></div></div>';
  const rest = \`\${passed} of \${claims.length} claims passed\${failed.length ? \` · \${failed.length} failed and kept\` : ''} · point at a face\`;
  el('hsFacet').innerHTML = rest;
  const crystal = CRYSTAL.mount(el('crystal'), { energy: 0.9 });
  if (crystal) {
    crystal.setFaces(Array.from({ length: 32 }, (_, i) => (claims[i] ? (claims[i].pass === true ? 1 : claims[i].pass === false ? 3 : 2) : 0)));
    crystal.onHover((i) => { const c = claims[i]; el('hsFacet').innerHTML = c ? \`<b>\${c.id} \${safe(c.name)}</b> · \${c.pass === true ? 'pass' : c.pass === false ? 'FAIL, kept' : 'sealing now'} · \${safe(c.result)}\` : rest; });
    crystal.onPick(() => { const s = el('${ids.claims}'); if (s && s.scrollIntoView) s.scrollIntoView({ behavior: 'smooth' }); });
    HOUSE.bindScroll(crystal, 0.9);
  }
  HOUSE.reveal(document); HOUSE.light(document);
})();
`);
  mkdirSync(at('vendor/house'), { recursive: true });
  for (const f of ['house.css', 'crystal.js', 'house.js']) copyFileSync(join(here, 'kit', f), at(`vendor/house/${f}`));
  for (const f of ['standard.mjs', 'receipts.mjs']) copyFileSync(join(here, 'src', f), at(`vendor/house/${f}`));
  console.log(`${repo}: page rebuilt on the house standard (${panels.length} sections folded behind a click; the old glass kept). Now tell scripts/make-page.mjs about the kit, build, and test.`);
}
