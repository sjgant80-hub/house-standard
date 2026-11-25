// census.mjs — where the whole estate stands against the house standard, measured and not guessed. It reads the
// estate's index, fetches the live page of every public repository that has one, and holds each to the ship gate
// (src/standard.mjs). No model is used: it is a fetch and the same check a page test runs.
//
// What it writes is a working list for whoever brings the next pages over: which pass, which fail and on what, and
// how many words greet a visitor on each. It is written OUTSIDE this repository, to the path given.
//   node scripts/census.mjs <path to estate-index.json> <path to write the census to> [--limit N]
import { readFileSync, writeFileSync } from 'node:fs';
import STANDARD from '../src/standard.mjs';

const [indexPath, outPath] = process.argv.slice(2), limitAt = process.argv.indexOf('--limit'), limit = limitAt > 0 ? Number(process.argv[limitAt + 1]) : Infinity;
if (!indexPath || !outPath) { console.error('usage: node scripts/census.mjs <estate-index.json> <census.json> [--limit N]'); process.exit(1); }
const index = JSON.parse(readFileSync(indexPath, 'utf8'));
const repos = index.nodes.filter((n) => n.private === false && n.live === true && n.archived !== true).slice(0, limit);

async function page(name) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`https://sjgant80-hub.github.io/${name}/`, { signal: AbortSignal.timeout(25000), redirect: 'follow' });
      if (r.status === 404) return { status: 404, html: '' };
      if (r.ok) return { status: r.status, html: await r.text() };
    } catch { /* try once more */ }
  }
  return { status: 0, html: '' };
}

const rows = [];
let next = 0;
async function worker() {
  for (;;) {
    const i = next++; if (i >= repos.length) return;
    const n = repos[i], { status, html } = await page(n.name);
    if (status !== 200) { rows.push({ repo: n.name, pushed: n.pushed, status }); continue; }
    const c = STANDARD.check(html), m = c.measured;
    rows.push({ repo: n.name, pushed: n.pushed, status, bytes: html.length, pass: c.pass, failed: c.rules.filter((r) => !r.pass).map((r) => r.id), viewWords: m.viewWords, longest: m.longest, crystal: m.crystal, receipts: m.receipts, expanders: m.expanders, tokens: m.tokens, faces: m.faces, credit: m.credit, priced: m.priced, shorthand: m.shorthand, clashes: m.clashes.length });
    if (rows.length % 100 === 0) console.log(`${rows.length} of ${repos.length} read`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
rows.sort((a, b) => a.repo.localeCompare(b.repo));

const read = rows.filter((r) => r.status === 200), by = (id) => read.filter((r) => r.failed.includes(id)).length;
const sorted = read.map((r) => r.viewWords).sort((a, b) => a - b), median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
const summary = {
  indexed: index.generated, read: new Date().toISOString().slice(0, 10), asked: repos.length, answered: read.length, notFound: rows.filter((r) => r.status === 404).length, unreachable: rows.filter((r) => r.status === 0).length,
  pass: read.filter((r) => r.pass).length, failing: Object.fromEntries(Object.keys(STANDARD.NAMES).map((id) => [id, by(id)])),
  wallOfText: read.filter((r) => r.viewWords > STANDARD.LIMITS.view || r.longest > STANDARD.LIMITS.paragraph).length, medianWordsBeforeAClick: median,
  priced: read.filter((r) => r.priced).length, shorthand: read.filter((r) => r.shorthand).length, noCredit: read.filter((r) => !r.credit).length, sharedIds: read.filter((r) => r.clashes > 0).length,
};
writeFileSync(outPath, JSON.stringify({ v: 'house-standard-census/1', summary, rows }, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
