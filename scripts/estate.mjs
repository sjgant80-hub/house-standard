// estate.mjs — the estate, in numbers the front door can stand on. It reads the estate's own index (a dated listing
// of every repository) and the census (scripts/census.mjs: every page asked for, on a date), and writes
// data/estate.json: how many repositories are public, how many pages ANSWERED when they were read, and a short shelf
// of public builds whose pages answered. A repository with pages switched on and nothing served is not a live page:
// the index alone counted those, and the census is what corrected it. Only public repositories are ever named.
//   node scripts/estate.mjs <path to estate-index.json> <path to the census>     write it from the two
//   node scripts/estate.mjs --check                          CI: the record on file is whole
import { readFileSync, writeFileSync } from 'node:fs';

// the shelf: what a visitor can open, in three rows of the estate. A build is listed only if the index says it is
// public and live on the day it is read.
export const SHELF = [
  ['Proof', 'witness', 'A build gate that catches tests which prove nothing.'],
  ['Proof', 'kar-scopeguard', 'Did the coding agent get its green honestly?'],
  ['Proof', 'proven-shelf', 'A badge that means one thing: this proof re-runs.'],
  ['Proof', 'estate-genome', 'The birth check every part must pass.'],
  ['Own the model', 'fallforgemint', 'Bring a task; walk out owning the model.'],
  ['Own the model', 'slm-suite', 'Industry small models with a verified library.'],
  ['Own the model', 'kardlings', 'A card that is a working mind you own.'],
  ['Own the model', 'liveware', 'Verify a living system in your browser.'],
  ['Sovereign tools', 'konomium-vault', 'Encrypted accounts: vault, bank ingest, tax.'],
  ['Sovereign tools', 'falljustice', 'UK consumer claims, with cited law.'],
  ['Sovereign tools', 'divorcerbot', 'UK divorce self-help on verified law.'],
  ['Sovereign tools', 'sovereign-browser', 'One governed AI of your own, on any site.'],
];

if (process.argv[1] && process.argv[1].endsWith('estate.mjs')) {
  const at = (p) => new URL(`../${p}`, import.meta.url);
  if (process.argv[2] === '--check') {
    const e = JSON.parse(readFileSync(at('data/estate.json'), 'utf8'));
    const day = /^\d{4}-\d{2}-\d{2}$/, ok = Number.isInteger(e.public) && Number.isInteger(e.live) && Number.isInteger(e.asked) && Number.isInteger(e.onStandard) && e.live <= e.asked && e.asked <= e.public && e.onStandard <= e.live && day.test(e.indexed) && day.test(e.read) && Array.isArray(e.shelf) && e.shelf.every((r) => SHELF.some((s) => s[1] === r.repo) && r.url === `https://sjgant80-hub.github.io/${r.repo}/`);
    console.log(ok ? `data/estate.json: ${e.public} public repositories indexed ${e.indexed}; ${e.live} of ${e.asked} pages answered when read on ${e.read}; ${e.shelf.length} builds on the shelf` : 'data/estate.json is not a whole record');
    process.exit(ok ? 0 : 1);
  }
  if (!process.argv[3]) { console.error('usage: node scripts/estate.mjs <estate-index.json> <census.json>'); process.exit(1); }
  const index = JSON.parse(readFileSync(process.argv[2], 'utf8')), by = new Map(index.nodes.map((n) => [n.name, n]));
  const census = JSON.parse(readFileSync(process.argv[3], 'utf8')), answered = new Set(census.rows.filter((r) => r.status === 200).map((r) => r.repo)), c = census.summary;
  const shelf = SHELF.filter(([, repo]) => { const n = by.get(repo); return n && n.private === false && n.archived !== true && answered.has(repo); }).map(([row, repo, line]) => ({ row, repo, line, url: `https://sjgant80-hub.github.io/${repo}/` }));
  writeFileSync(at('data/estate.json'), JSON.stringify({ v: 'house-standard-estate/2', indexed: index.generated, read: c.read, org: index.org, public: index.public, asked: c.asked, live: c.answered, onStandard: c.pass, shelf }, null, 1) + '\n');
  console.log(`data/estate.json: ${index.public} public repositories indexed ${index.generated}; ${c.answered} of ${c.asked} pages answered when read on ${c.read}, ${c.pass} of them on the standard; ${shelf.length} of ${SHELF.length} shelf builds are public and answered`);
}
