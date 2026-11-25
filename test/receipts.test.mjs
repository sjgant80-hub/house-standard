import { test } from 'node:test';
import assert from 'node:assert/strict';
import R from '../src/receipts.mjs';

const wrap = (inner) => `<!doctype html><html><head><style>p{}</style></head><body>${inner}<script>const t = "<tr><td><b>Z9</b> in a script</td></tr>";</script></body></html>`;
const row = (id, name, result, verdict) => `<tr><td><b>${id}</b> ${name}</td><td class="small">the bar</td><td class="small">${result}</td><td>${verdict === true ? '<span class="pass">PASS</span>' : verdict === false ? '<span class="fail">FAIL</span>' : '<span class="pend">pending</span>'}</td></tr>`;
const srow = (id, name, result, tag) => `<div class="srow${tag === 'rd' ? ' red' : ''}"><div class="d">${id}</div><div class="nm"><b>${name}</b><span>${result}</span><span class="tag ${tag}">x</span></div></div>`;
const HOSTILE = [null, undefined, 7, {}, [], () => 1];

test('text: the page as a visitor reads it: the body, without tags, scripts or styles, spaces single, entities read', () => {
  assert.equal(R.text(wrap('<p>one   <b>two</b>\n three &amp; four &lt;5&gt; &quot;six&quot; it&#39;s</p>')), 'one two three & four <5> "six" it\'s');
  assert.equal(R.text('<p>no body</p>'), ''); assert.equal(R.text('<body>at the start</body>'), 'at the start');
  assert.equal(R.text('<body><style>x{}</style>seen<script>hidden()</script></body>'), 'seen');
  for (const bad of HOSTILE) assert.equal(R.text(bad), '');
});

test('claims: every pre-registered claim on a page, in both layouts, each once, with its verdict', () => {
  const table = wrap(`<table>${row('C1', 'It climbs', 'one try 36.5%, climb 70.8%', true)}${row('C8', 'Each pass squares what is left', 'it did not', false)}${row('C9', 'Not run', 'waiting', null)}</table>`);
  assert.deepEqual(R.claims(table), [{ id: 'C1', name: 'It climbs', result: 'one try 36.5%, climb 70.8%', pass: true }, { id: 'C8', name: 'Each pass squares what is left', result: 'it did not', pass: false }, { id: 'C9', name: 'Not run', result: 'waiting', pass: null }]);
  const stack = wrap(`<div class="stack">${srow('K1', 'Lift', 'base 31.6%, distilled 50.2%', 'cy')}${srow('K2', 'Still honest', '78 &rarr; 90', 'rd')}${srow('K3', 'The wall', 'round 1 has not run', 'gd')}</div>`);
  assert.deepEqual(R.claims(stack).map((c) => [c.id, c.name, c.pass]), [['K1', 'Lift', true], ['K2', 'Still honest', false], ['K3', 'The wall', null]]);
  assert.equal(R.claims(stack)[0].result, 'base 31.6%, distilled 50.2%');
  // a claim shown twice is one claim; ids are a capital and one or two digits; a row with no id is not a claim
  assert.equal(R.claims(wrap(row('C1', 'a', 'b', true) + row('C1', 'a again', 'b', false))).length, 1);
  assert.deepEqual(R.claims(wrap(row('S12', 'twelve', 'r', true) + row('S123', 'too long', 'r', true) + row('c1', 'small', 'r', true) + '<tr><td>plain</td><td>x</td></tr>')).map((c) => c.id), ['S12']);
  assert.equal(R.claims(wrap(row('C1', '<i>x</i>', 'r', true)))[0], undefined, 'a name is plain words, as the builds write it');
  assert.equal(R.claims(wrap('<tr><td><b>C2</b> short row</td></tr>'))[0].result, '', 'a row with no result cell has no result');
  assert.deepEqual(R.claims(wrap('<p>no claims</p>')), []);
  for (const bad of HOSTILE) assert.deepEqual(R.claims(bad), []);
});

test('headline: each flagship\'s own sentence, read word for word, or nothing', () => {
  const climb = wrap('<p>right at the first try 36.5% (35 of 96) right after the climb 70.8% (68 of 96) told only</p>');
  assert.deepEqual(R.headline('the-climb', climb), { was: '36.5%', now: '70.8%', of: 96, label: 'sealed problems right: at one try, then after the climb' });
  assert.equal(R.headline('the-climb', wrap('<p>right at the first try 36.5% (35 of 96) right after the climb 70.8% (68 of 97)</p>')), null, 'both counts must be of the same problems');
  const crystal = wrap('<p>by an exact test, p &lt; 0.05 one try 31.0%, the crystal 85.7% of 84 problems; 46 only</p><p>forged replies that bonded 0 of 26086 (0.0%)</p>');
  assert.deepEqual(R.headline('the-crystal', crystal), { was: '31.0%', now: '85.7%', of: 84, label: 'sealed problems right: at one try, then as a crystal' });
  assert.deepEqual(R.extra('the-crystal', crystal), [{ key: 'forged', value: '0', of: 26086, label: 'forged replies that got past the check' }]);
  const set = wrap('<p>read generously, got 34 of 144 right; on the 24 problems that have no answer it gave a number 22 times. The lattice brought 139 of 144 out as they should come out.</p>');
  assert.deepEqual(R.headline('the-verifier-set', set), { was: '34', now: '139', of: 144, label: 'sealed problems that came out as they should: unchecked, then checked' });
  assert.deepEqual(R.extra('the-verifier-set', set), [], 'the unchecked count alone is half a receipt');
  const both = wrap('<p>got 34 of 144 problems right, and on the 24 with no answer it gave a number 22 times. With the checks, 139 of 144 came out as they should, and none of those 24 was answered.</p>');
  assert.deepEqual(R.extra('the-verifier-set', both), [{ key: 'unanswerable', value: '22', after: '0', of: 24, label: 'confident numbers given to questions that have no answer: unchecked, then checked' }]);
  assert.deepEqual(R.extra('the-verifier-set', wrap('<p>on the 24 with no answer it gave a number 22 times. With the checks, 139 of 144 came out as they should, and none of those 23 was answered.</p>')), [], 'the none must be none of the same questions');
  const dist = wrap('<div class="stat"><div class="n"><span class="was">31.6%</span><span class="arrow">→</span><span class="now">50.2%</span></div><div class="lab"><b>Right, cold, on 231 held-out problems.</b> The same model.</div></div>');
  assert.deepEqual(R.headline('the-distillation', dist), { was: '31.6%', now: '50.2%', of: 231, label: 'held-out problems right, cold: before, then after training on its own verified work' });
  assert.equal(R.headline('the-distillation', wrap('<div class="n">— → —</div><div class="lab"><b>Right, cold, on held-out problems.</b> sealing now</div>')), null, 'while it is sealing there is no number to read');
  assert.equal(R.headline('the-distillation', climb), null);
  assert.equal(R.headline('the-verifier-set', wrap('<p>got 34 of 144 right; on the 24 problems that have no answer it gave a number 22 times. The lattice brought 139 of 145 out</p>')), null);
  // whole numbers and decimals both read; a page that does not say it gives nothing; one build's sentence is not another's
  assert.equal(R.headline('the-climb', wrap('<p>right at the first try 40% (4 of 10) right after the climb 70% (7 of 10)</p>')).was, '40%');
  assert.equal(R.headline('the-climb', crystal), null); assert.equal(R.headline('the-crystal', climb), null); assert.deepEqual(R.extra('the-crystal', climb), []); assert.deepEqual(R.extra('the-verifier-set', climb), []);
  assert.equal(R.headline('the-seed', climb), null); assert.deepEqual(R.extra('the-climb', climb), []); assert.equal(R.headline('toString', climb), null); assert.deepEqual(R.extra('constructor', climb), []);
  for (const bad of HOSTILE) { assert.equal(R.headline(bad, climb), null); assert.equal(R.headline('the-climb', bad), null); assert.deepEqual(R.extra(bad, crystal), []); assert.deepEqual(R.extra('the-crystal', bad), []); }
});
