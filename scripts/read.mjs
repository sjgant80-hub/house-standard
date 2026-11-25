// read.mjs — hold a built page to the reading-age check (src/plain.mjs): can a twelve-year-old read it?
//   node scripts/read.mjs <index.html> [more pages…]      exit 0 when every page passes, 1 otherwise
import { readFileSync } from 'node:fs';
import PLAIN from '../src/plain.mjs';

const files = process.argv.slice(2);
if (files.length === 0) { console.error('usage: node scripts/read.mjs <index.html> [more pages…]'); process.exit(1); }
let bad = 0;
for (const f of files) {
  const r = PLAIN.check(readFileSync(f, 'utf8')), v = r.measured.view;
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${f} · school year ${v.grade === null ? '—' : v.grade.toFixed(1)} before a click, ${r.measured.all.grade === null ? '—' : r.measured.all.grade.toFixed(1)} in all`);
  for (const x of r.rules) if (!x.pass) console.log(`  ${x.id} ${x.name}: ${x.why}`);
  if (!r.rules[2].pass) console.log(`     the sentence: ${v.longestText}`);
  if (!r.pass) bad++;
}
process.exit(bad ? 1 : 0);
