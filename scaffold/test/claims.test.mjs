import { test } from 'node:test';
import assert from 'node:assert/strict';
import K from '../src/claims.mjs';

const rec = (before, after) => ({ before, after });
const run = (records, planned) => ({ planned: planned ?? records.length, records });

test('with no run every claim is pending: never passed, never failed, by default', () => {
  for (const bad of [null, undefined, 7, 'x', {}, [], { records: [] }, { planned: 3 }, { planned: 0, records: [] }, { planned: 1.5, records: [rec(true, true)] }, { planned: -1, records: [] }]) {
    assert.deepEqual(K.verdicts(bad).map((v) => v.pass), [null, null], JSON.stringify(bad)); assert.deepEqual(K.receipts(bad), []);
    for (const v of K.verdicts(bad)) assert.equal(v.result, 'the run has not been made');
  }
  assert.deepEqual(K.verdicts(null).map((v) => [v.id, v.name, v.bar]), K.CLAIMS.map((c) => [c.id, c.name, c.bar]));
});

test('C1 the run is whole; C2 it is right more often than it was', () => {
  const good = run([rec(false, true), rec(true, true), rec(false, false), rec(false, true)]);
  assert.deepEqual(K.verdicts(good).map((v) => [v.id, v.pass, v.result]), [['C1', true, '4 of 4 problems have a record'], ['C2', true, 'right before 1, right after 3']]);
  assert.deepEqual(K.verdicts(run([rec(true, true)], 2))[0], { id: 'C1', name: 'The run is whole', bar: 'every problem the seal fixed has a record in the run', pass: false, result: '1 of 2 problems have a record' });
  assert.equal(K.verdicts(run([rec(true, true), rec(false, false)]))[1].pass, false, 'as many is not more');
  assert.equal(K.verdicts(run([rec(true, false), rec(false, false)]))[1].pass, false);
  // only true counts as right
  assert.equal(K.verdicts(run([rec('yes', 1), rec(null, true)]))[1].result, 'right before 0, right after 1');
  assert.doesNotThrow(() => K.verdicts(run([null, 7, 'x'])));
});

test('receipts: the page\'s numbers are counts of the run', () => {
  assert.deepEqual(K.receipts(run([rec(false, true), rec(true, true), rec(false, false)])), [{ was: '1', now: '2', label: 'right, of 3 sealed problems: before, then after' }]);
  assert.deepEqual(K.receipts(run([rec('yes', 1), null])), [{ was: '0', now: '0', label: 'right, of 2 sealed problems: before, then after' }]);
});
