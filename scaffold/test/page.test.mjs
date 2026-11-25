import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { page, KERNELS, body } from '../scripts/make-page.mjs';
import STANDARD from '../vendor/house/standard.mjs';
import { judge, inLane } from '../genome/cell.mjs';

const root = new URL('..', import.meta.url), ROOT = fileURLToPath(root).replace(/[\\/]$/, '');
const read = (p) => readFileSync(new URL(p, root), 'utf8').split('\r\n').join('\n');
const html = read('index.html'), seed = JSON.parse(read('seed.json'));

test('index.html is exactly the build of page/ and the kernels, baked from the recorded run', async () => {
  assert.equal(html, await page(ROOT), 'run node scripts/make-page.mjs');
});

test('every kernel is inlined byte for byte', () => {
  for (const [ns, file] of KERNELS) assert.ok(html.includes(`const ${ns} = (() => {\n${body(read(file), file).code}\n`), `${file} is not inlined as built`);
});

test('the page meets the house standard: the ship gate', () => {
  const r = STANDARD.check(html);
  assert.equal(r.pass, true, r.rules.filter((x) => !x.pass).map((x) => `${x.id} ${x.name}: ${x.why}`).join(' | '));
});

test('nothing on the page is dead: every button is wired, every link on the page has somewhere to go', () => {
  const template = read('page/template.html'), app = read('page/app.js'), ids = [...template.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const m of template.matchAll(/<button[^>]*\sid="([^"]+)"/g)) assert.ok(app.includes(`$('${m[1]}').addEventListener('click'`), `the button #${m[1]} does nothing`);
  for (const m of template.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(m[1]), `a link goes to #${m[1]}, which is not on the page`);
  const visible = html.slice(html.indexOf('<body>'), html.indexOf('<script type="module">'));
  for (const m of visible.matchAll(/href="([^"#][^"]*)"/g)) if (!/^https?:/.test(m[1])) assert.ok(existsSync(new URL(m[1], root)), `a link goes to ${m[1]}, which is not in the repository`);
});

test('the genome cell tells the seed\'s good run from its bad one', async () => {
  assert.equal(await judge(seed.judge.cases.good), 'verified'); assert.equal(await judge(seed.judge.cases.bad), 'unverified');
  assert.equal(await judge(null), 'refused'); assert.equal(await inLane(seed.boundary.inLane), true); assert.equal(await inLane(seed.boundary.outOfLane), false);
  assert.ok(seed.purpose.length >= 20 && seed.purpose.length <= 400);
});
