import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { page, KERNELS, BAKED, body, rewrite } from '../scripts/make-page.mjs';
import STANDARD from '../src/standard.mjs';
import FLAGSHIP from '../src/flagship.mjs';
import { BUILDS } from '../scripts/flagships.mjs';

const root = new URL('..', import.meta.url), ROOT = fileURLToPath(root).replace(/[\\/]$/, '');
const read = (p) => readFileSync(new URL(p, root), 'utf8').split('\r\n').join('\n');
const html = read('index.html'), template = read('page/template.html'), app = read('page/app.js');
const visible = html.slice(html.indexOf('<body>'), html.indexOf('<script type="module">'));
const flagships = JSON.parse(read('data/flagships.json'));

test('index.html is exactly the build of page/, the kit and the kernels, baked from the flagships as last read', async () => {
  const built = await page(ROOT);
  let i = 0; while (i < html.length && html[i] === built[i]) i++;
  assert.equal(html.length === built.length && i === html.length, true, `index.html and the build first differ at character ${i}: run node scripts/make-page.mjs`);
});

test('the kit and every kernel are inlined byte for byte', () => {
  for (const [ns, file] of KERNELS) {
    assert.ok(html.includes(`const ${ns} = (() => {\n${body(read(file), file).code}\n`), `${file} is not inlined as built`);
    for (const line of read(file).split('\n')) if (line.startsWith('import ')) assert.ok(rewrite(line, file), `${file}: an import the page cannot inline: ${line}`);
  }
  assert.ok(html.includes(read('kit/house.css').trim()), 'the token sheet is on the page whole');
  assert.deepEqual(readdirSync(new URL('src/', root)).filter((f) => f.endsWith('.mjs')).sort(), KERNELS.filter(([, f]) => f.startsWith('src/')).map(([, f]) => f.slice(4)).sort(), 'every kernel of this repository is on the page');
});

test('the front door meets its own standard', () => {
  const r = STANDARD.check(html);
  assert.equal(r.pass, true, r.rules.filter((x) => !x.pass).map((x) => `${x.id} ${x.name}: ${x.why}`).join(' | '));
});

test('no number on the front door is typed: each is in the record read from a flagship\'s own page', () => {
  assert.deepEqual(flagships.builds.map((b) => b.repo), BUILDS.map((b) => b.repo));
  for (const b of flagships.builds) {
    assert.match(b.commit, /^[0-9a-f]{40}$/, `${b.repo} was read at a named commit`); assert.equal(b.live, `https://sjgant80-hub.github.io/${b.repo}/`);
    assert.equal(FLAGSHIP.same(b, b), true); assert.equal(b.standard.rules.length, 7);
    if (b.headline) for (const n of [b.headline.was, b.headline.now]) assert.ok(visible.includes(n), `${b.repo}: ${n} is on the page`);
    for (const x of b.claims.failed) assert.ok(visible.includes(`${x.id} (`), `${b.repo}'s failed claim ${x.id} is on the page`);
  }
  // every figure in a receipt is a figure the record holds
  const known = new Set(JSON.stringify(flagships).match(/\d+(?:\.\d+)?/g));
  const receipts = visible.slice(visible.indexOf('id="receipts"'), visible.indexOf('id="readLine"'));
  for (const m of receipts.replace(/<[^>]+>/g, ' ').replace(/,/g, '').matchAll(/\d+(?:\.\d+)?/g)) assert.ok(known.has(m[0]), `the receipt figure ${m[0]} is not in the record`);
  assert.ok(app.includes("getText(`../${b.repo}/`)") && app.includes('FLAGSHIP.read(b.repo, html)'), 'and the page reads the live pages again, with the same kernel');
});

test('nothing on the page is dead: every control is wired, every number has a writer, every link has somewhere to go', () => {
  const ids = [...template.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const m of app.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(m[1]), `the script reaches for #${m[1]}, which is not on the page`);
  for (const id of BAKED) assert.ok(ids.includes(id), `#${id} is baked and is not on the page`);
  for (const m of template.matchAll(/<button[^>]*\sid="([^"]+)"/g)) assert.ok(app.includes(`$('${m[1]}').addEventListener('click'`), `the button #${m[1]} does nothing`);
  for (const m of template.matchAll(/data-bind="([^"]+)"/g)) assert.ok(app.includes(`bind('${m[1]}'`), `nothing writes data-bind="${m[1]}"`);
  for (const m of template.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(m[1]), `a link goes to #${m[1]}, which is not on the page`);
  for (const m of visible.matchAll(/href="([^"#][^"]*)"/g)) if (!/^https?:/.test(m[1])) assert.ok(existsSync(new URL(m[1], root)), `a link goes to ${m[1]}, which is not in the repository`);
  for (const m of read('kit/house.css').matchAll(/url\('([^']+)'\)/g)) assert.ok(existsSync(new URL(m[1], root)), `a font is not in the repository: ${m[1]}`);
  assert.equal([...visible.matchAll(/not measured yet/g)].length, 0);
});

test('the scaffold is whole, and what it makes carries the kit this repository ships', () => {
  for (const f of ['page/template.html', 'page/app.js', 'src/claims.mjs', 'test/claims.test.mjs', 'test/page.test.mjs', 'genome/cell.mjs', 'scripts/seal.mjs', '.github/workflows/gate.yml', 'CLAIMS.md', 'README.md', 'LICENSE', 'gitignore']) assert.ok(existsSync(new URL(`scaffold/${f}`, root)), `scaffold/${f}`);
  const t = read('scaffold/page/template.html');
  for (const part of ['<canvas id="crystal"', 'class="stats"', 'class="stack ', 'class="glass ', '<details class="honest ']) assert.ok(t.includes(part), `the scaffold's page has no ${part}`);
  assert.ok(read('README.md').startsWith('**Live: https://sjgant80-hub.github.io/house-standard/**'));
  const g = JSON.parse(read('data/gates.json')); assert.equal(g.clean, true); assert.ok(read('README.md').includes('**' + g.killed + ' / ' + g.total + '**'), 'the README states the gate as the record has it');
});

test('a verdict tag keeps its own colour inside a stack row: a failure reads red, not grey', () => {
  const css = read('kit/house.css');
  // how strongly a selector binds: ids, then classes and the like, then element names
  const spec = (sel) => [(sel.match(/#[\w-]+/g) || []).length, (sel.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length, (sel.replace(/[.#:][\w-]+|\[[^\]]*\]/g, ' ').match(/[a-z][\w-]*/gi) || []).length];
  const outranks = (a, b) => (a[0] - b[0] || a[1] - b[1] || a[2] - b[2]) > 0;
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}@]+)\{([^{}]*)\}/g)].flatMap(([, sels, body]) => sels.split(',').map((s) => ({ sel: s.trim(), body })));
  const colour = (r) => (r.body.match(/(?:^|;)\s*color:\s*([^;]+)/) || [])[1];
  // every rule that colours plain spans somewhere; a tag is a span, so each such place must hand tags their colour back
  const greyers = rules.filter((r) => /\sspan$/.test(r.sel) && colour(r));
  assert.deepEqual(greyers.map((r) => r.sel).sort(), ['.srow .nm span', '.taglist span'], 'a new rule colours spans: give verdict tags their own colour there too, and list it here');
  const grey = greyers.find((r) => r.sel === '.srow .nm span');
  for (const kind of ['off', 'cy', 'gd', 'rd']) {
    const base = rules.find((r) => r.sel === `.tag.${kind}`), own = rules.find((r) => r.sel === `.srow .nm .tag.${kind}`);
    assert.ok(base && colour(base), `.tag.${kind} has no colour of its own`);
    assert.ok(own, `.tag.${kind} is not given its colour back inside a stack row`);
    assert.equal(colour(own), colour(base), `.tag.${kind} is a different colour inside a stack row`);
    assert.ok(outranks(spec(own.sel), spec(grey.sel)), `.srow .nm .tag.${kind} does not outrank ${grey.sel}`);
    assert.equal(outranks(spec(base.sel), spec(grey.sel)), false, 'the tag\'s own rule alone was never enough: that was the fault');
  }
  assert.equal(colour(rules.find((r) => r.sel === '.tag.rd')), 'var(--red)');
});
