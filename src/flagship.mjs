// flagship.mjs — everything the front door shows of one build, read from that build's own page and nothing else:
// its headline receipt, its further receipts, how its pre-registered claims came out, and whether its page meets the
// house standard. The front door runs this in the visitor's tab on the live page; the build script runs it on the
// same page at a named commit. One function, so the two can never tell different stories.
//
//   read(repo, html) → { headline, extra, claims: { n, pass, fail, sealing, failed: [{ id, name }] },
//                        standard: { pass, rules: [{ id, pass, why }], viewWords, longest } }
//   same(a, b)       → true when two readings of a build agree on every number and every verdict
// Pure and total.
import RECEIPTS from './receipts.mjs';
import STANDARD from './standard.mjs';

export function read(repo, html) {
  const claims = RECEIPTS.claims(html), s = STANDARD.check(html);
  return {
    headline: RECEIPTS.headline(repo, html), extra: RECEIPTS.extra(repo, html),
    claims: { n: claims.length, pass: claims.filter((c) => c.pass === true).length, fail: claims.filter((c) => c.pass === false).length, sealing: claims.filter((c) => c.pass === null).length, failed: claims.filter((c) => c.pass === false).map((c) => ({ id: c.id, name: c.name })) },
    standard: { pass: s.pass, rules: s.rules.map((r) => ({ id: r.id, pass: r.pass, why: r.why })), viewWords: s.measured.viewWords, longest: s.measured.longest },
  };
}

const pick = (x) => { try { return JSON.stringify([x.headline, x.extra, x.claims, x.standard.pass, x.standard.rules.map((r) => r.pass)]); } catch { return null; } };
export function same(a, b) { const x = pick(a); return x !== null && x === pick(b); }

export default { read, same };
