// claims.mjs — this build's claims, each a verdict worked out from the recorded run and nothing else. A claim with
// no run behind it is PENDING (pass: null): never passed, never failed, by default. Write the bars here BEFORE the
// run, then seal (node scripts/seal.mjs): the seal freezes this file.
//
//   CLAIMS                the claims, each with its bar in words and the test that rules on a run
//   verdicts(run)         → [{ id, name, bar, pass, result }]
//   receipts(run)         → the page's receipts: [{ was, now, label }], or [] while nothing is measured
// Pure and total. Start by replacing the two example claims with your own.
const get = (o, k) => { try { return o == null ? undefined : o[k]; } catch { return undefined; } };
const int = (x) => Number.isInteger(x) && x >= 0;

export const CLAIMS = [
  { id: 'C1', name: 'The run is whole', bar: 'every problem the seal fixed has a record in the run',
    test: (run) => ({ pass: get(run, 'records').length === get(run, 'planned'), result: `${get(run, 'records').length} of ${get(run, 'planned')} problems have a record` }) },
  { id: 'C2', name: 'It is right more often than it was', bar: 'more problems are right after than before',
    test: (run) => { const before = get(run, 'records').filter((r) => get(r, 'before') === true).length, after = get(run, 'records').filter((r) => get(r, 'after') === true).length; return { pass: after > before, result: `right before ${before}, right after ${after}` }; } },
];

const whole = (run) => Array.isArray(get(run, 'records')) && int(get(run, 'planned')) && run.planned > 0;

export function verdicts(run) {
  return CLAIMS.map((c) => {
    const r = whole(run) ? c.test(run) : { pass: null, result: 'the run has not been made' };
    return { id: c.id, name: c.name, bar: c.bar, pass: r.pass, result: r.result };
  });
}

export function receipts(run) {
  if (!whole(run)) return [];
  const n = run.records.length, before = run.records.filter((r) => get(r, 'before') === true).length, after = run.records.filter((r) => get(r, 'after') === true).length;
  return [{ was: String(before), now: String(after), label: `right, of ${n} sealed problems: before, then after` }];
}

export default { CLAIMS, verdicts, receipts };
