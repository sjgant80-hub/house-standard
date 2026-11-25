// estate.mjs — the estate, in numbers the front door can stand on. It reads the estate's own index (a dated listing
// of every repository) and writes data/estate.json: how many repositories are public, how many carry a live page, and
// a short shelf of public, live builds to open. Only public repositories are ever named.
//   node scripts/estate.mjs <path to estate-index.json>     write it from the index
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
    const ok = Number.isInteger(e.public) && Number.isInteger(e.live) && e.live <= e.public && /^\d{4}-\d{2}-\d{2}$/.test(e.indexed) && Array.isArray(e.shelf) && e.shelf.every((r) => SHELF.some((s) => s[1] === r.repo) && r.url === `https://sjgant80-hub.github.io/${r.repo}/`);
    console.log(ok ? `data/estate.json: ${e.public} public repositories, ${e.live} live pages, indexed ${e.indexed}; ${e.shelf.length} builds on the shelf` : 'data/estate.json is not a whole record');
    process.exit(ok ? 0 : 1);
  }
  const index = JSON.parse(readFileSync(process.argv[2], 'utf8')), by = new Map(index.nodes.map((n) => [n.name, n]));
  const shelf = SHELF.filter(([, repo]) => { const n = by.get(repo); return n && n.private === false && n.live === true && n.archived !== true; }).map(([row, repo, line]) => ({ row, repo, line, url: `https://sjgant80-hub.github.io/${repo}/` }));
  writeFileSync(at('data/estate.json'), JSON.stringify({ v: 'house-standard-estate/1', indexed: index.generated, org: index.org, public: index.public, live: index.live, shelf }, null, 1) + '\n');
  console.log(`data/estate.json: ${index.public} public repositories, ${index.live} live pages, indexed ${index.generated}; ${shelf.length} of ${SHELF.length} shelf builds are public and live`);
}
