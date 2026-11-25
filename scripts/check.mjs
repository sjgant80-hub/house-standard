// check.mjs — hold a built page to the house standard, from the command line. Exits 1 when it fails.
//   node scripts/check.mjs <index.html> [more pages…]
import { readFileSync } from 'node:fs';
import STANDARD from '../src/standard.mjs';

const files = process.argv.slice(2);
if (files.length === 0) { console.error('usage: node scripts/check.mjs <index.html> [more pages…]'); process.exit(2); }
let bad = 0;
for (const f of files) {
  let html = '';
  try { html = readFileSync(f, 'utf8'); } catch { console.log(`FAIL ${f}: not a file that can be read`); bad++; continue; }
  const r = STANDARD.check(html);
  if (!r.pass) bad++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${f} · ${r.measured.viewWords} words before a click, longest paragraph ${r.measured.longest}`);
  for (const x of r.rules) if (!x.pass) console.log(`  ${x.id} ${x.name}: ${x.why}`);
}
process.exit(bad ? 1 : 0);
