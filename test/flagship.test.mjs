import { test } from 'node:test';
import assert from 'node:assert/strict';
import F from '../src/flagship.mjs';

const row = (id, name, verdict) => `<tr><td><b>${id}</b> ${name}</td><td>bar</td><td>result</td><td>${verdict === true ? '<span class="pass">PASS</span>' : verdict === false ? '<span class="fail">FAIL</span>' : 'pending'}</td></tr>`;
const climb = (rows) => `<html><body><p>right at the first try 36.5% (35 of 96) right after the climb 70.8% (68 of 96)</p><table>${rows}</table></body></html>`;
const PAGE = climb(row('C1', 'It climbs', true) + row('C2', 'It holds', true) + row('C3', 'It keeps', true) + row('C8', 'Each pass squares what is left', false) + row('C9', 'Waiting', null));

test('read: a build as the front door shows it, from its own page alone', () => {
  const r = F.read('the-climb', PAGE);
  assert.deepEqual(r.headline, { was: '36.5%', now: '70.8%', of: 96, label: 'sealed problems right: at one try, then after the climb' });
  assert.deepEqual(r.extra, []);
  assert.deepEqual(r.claims, { n: 5, pass: 3, fail: 1, sealing: 1, failed: [{ id: 'C8', name: 'Each pass squares what is left' }] });
  // the page is held to the ship gate, and each rule's verdict comes with it
  assert.equal(r.standard.pass, false); assert.deepEqual(r.standard.rules.map((x) => x.id), ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7']);
  for (const x of r.standard.rules) { assert.equal(typeof x.pass, 'boolean'); assert.equal(typeof x.why, 'string'); assert.deepEqual(Object.keys(x), ['id', 'pass', 'why']); }
  assert.equal(r.standard.longest, 17); assert.ok(r.standard.viewWords > 17);
  // another build's page gives that build nothing; nothing that is not a page gives anything
  assert.equal(F.read('the-crystal', PAGE).headline, null);
  for (const bad of [null, undefined, 7, {}, '', 'words']) { const x = F.read('the-climb', bad); assert.deepEqual([x.headline, x.extra, x.claims, x.standard.pass], [null, [], { n: 0, pass: 0, fail: 0, sealing: 0, failed: [] }, false]); assert.doesNotThrow(() => F.read(bad, PAGE)); }
});

test('same: two readings agree only when every number and every verdict is the same', () => {
  const a = F.read('the-climb', PAGE);
  assert.equal(F.same(a, F.read('the-climb', PAGE)), true);
  assert.equal(F.same(a, F.read('the-climb', PAGE.replace('70.8% (68', '71.9% (69'))), false, 'another number');
  assert.equal(F.same(a, F.read('the-climb', PAGE.replace('<span class="fail">FAIL</span>', '<span class="pass">PASS</span>'))), false, 'another verdict');
  assert.equal(F.same(a, F.read('the-climb', climb(row('C1', 'It climbs', true)))), false);
  assert.equal(F.same(a, F.read('the-climb', PAGE.replace('<p>', '<p class="lead">'))), true, 'the same receipts dressed another way');
  // a page that newly fails a house rule is not the same reading
  assert.equal(F.same(a, F.read('the-climb', PAGE.replace('</table>', '</table><p>not measured yet</p>'))), false);
  for (const bad of [null, undefined, 7, {}, 'x']) { assert.equal(F.same(bad, a), false); assert.equal(F.same(a, bad), false); assert.equal(F.same(bad, bad), false); }
});
