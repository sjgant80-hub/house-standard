// new.mjs — start a new build from the house standard. It opens looking like the showcase and carrying the organ on
// day one: the kit (crystal hero, receipts, stack, glass, expander), a claims kernel with its tests, the genome cell,
// the seal, the mutation gate, the CI workflow and the page test that holds the page to the ship gate.
//   node scripts/new.mjs <name> ["Title"] ["One plain line of what it is."] [--into <folder>]
// It writes a new folder beside this repository (or in --into), builds its page and runs its tests. It never
// overwrites a folder that exists, and it creates no remote repository: publishing is a separate, deliberate step.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const here = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2), into = args.includes('--into') ? args[args.indexOf('--into') + 1] : join(here, '..');
const [name, titleArg, lineArg] = args.filter((a, i) => a !== '--into' && args[i - 1] !== '--into');
const stop = (why) => { console.error(`not made: ${why}`); process.exit(1); };
if (!name || !/^[a-z][a-z0-9-]{2,48}$/.test(name)) stop('usage: node scripts/new.mjs <name> ["Title"] ["One plain line."]   (name: small letters, digits and hyphens)');
const title = titleArg || name.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const line = lineArg || 'A small build that proves what it says.';
const dest = join(into, name);
if (existsSync(dest)) stop(`${dest} already exists`);

const copyTree = (from, to) => { mkdirSync(to, { recursive: true }); for (const f of readdirSync(from)) { const a = join(from, f), b = join(to, f === 'gitignore' ? '.gitignore' : f === 'gitattributes' ? '.gitattributes' : f); if (statSync(a).isDirectory()) copyTree(a, b); else copyFileSync(a, b); } };
copyTree(join(here, 'scaffold'), dest);
// the kit and the ship gate, byte for byte, and the three faces
mkdirSync(join(dest, 'vendor/house'), { recursive: true });
for (const f of ['house.css', 'crystal.js', 'house.js']) copyFileSync(join(here, 'kit', f), join(dest, 'vendor/house', f));
copyFileSync(join(here, 'src/standard.mjs'), join(dest, 'vendor/house/standard.mjs'));
copyTree(join(here, 'vendor/fonts'), join(dest, 'vendor/fonts'));
copyFileSync(join(here, 'icon.svg'), join(dest, 'icon.svg'));
// the builder and the gate script are this repository's own, with the new build's kernels named
const swap = (text, from, to, block) => { const a = text.indexOf(from), b = text.indexOf(to); if (a === -1 || b === -1) stop('the builder has changed shape'); return text.slice(0, a) + block + text.slice(b); };
let page = readFileSync(join(here, 'scripts/make-page.mjs'), 'utf8');
page = swap(page, 'export const KERNELS = [', 'const LF = (s) =>', `export const KERNELS = [
  // the house kit (the crystal and the motion), as vendored, then this repository's own kernels
  ['CRYSTAL', 'vendor/house/crystal.js'], ['HOUSE', 'vendor/house/house.js'], ['CLAIMS', 'src/claims.mjs'],
];
// what bake() writes into the page: these ids, and every data-bind
export const BAKED = ['facet', 'receipts', 'claimStack'];
`).split('__house').join('__build').split("read('kit/house.css')").join("read('vendor/house/house.css')").replace('receipt and row from the flagships as last read', 'receipt and row from the recorded run');
writeFileSync(join(dest, 'scripts/make-page.mjs'), page);
let gates = readFileSync(join(here, 'scripts/gates.mjs'), 'utf8');
gates = swap(gates, 'export const GATED = [', 'const args = process.argv.slice(2);', `export const GATED = [
  ['src/claims.mjs', ['test/claims.test.mjs']],
  ['genome/cell.mjs', ['test/page.test.mjs']],
];
export const NOTHING_TO_MUTATE = {
  'genome/io.mjs, judge.mjs, lane.mjs, health.mjs, tombstone.mjs': "the estate genome's hook template, byte for byte; gated in estate-genome",
  'vendor/house/**': 'the house kit and its ship gate, byte for byte; gated in house-standard',
};

`).replace('gates.mjs (house-standard)', `gates.mjs (${name})`);
writeFileSync(join(dest, 'scripts/gates.mjs'), gates);
// the name, the title and the line, wherever the scaffold left room for them
const fill = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) { if (f !== 'vendor' && f !== '.git') fill(p); continue; } if (!/\.(md|html|mjs|js|json|yml)$/.test(f)) continue; const t = readFileSync(p, 'utf8'), u = t.split('__NAME__').join(name).split('__TITLE__').join(title).split('__LINE__').join(line); if (u !== t) writeFileSync(p, u); } };
fill(dest);
const good = { planned: 2, records: [{ before: false, after: true }, { before: true, after: true }] };
writeFileSync(join(dest, 'seed.json'), JSON.stringify({
  genome: '1', name, kind: 'repo', purpose: `${line} Built from the house standard: its claims are registered before the run, its page re-derives every number, and a failed claim stays on the page.`.slice(0, 400),
  lane: { id: `${name}-claims`, accepts: 'a recorded run: how many problems were planned, and a record for each', refuses: 'anything that is not a run' },
  interface: { in: JSON.stringify(good), out: 'verified when every claim passes on the run; unverified when any fails; refused when what is given is not a run' },
  judge: { what: 'a run is verified only when every pre-registered claim passes on it', run: 'node genome/judge.mjs', cases: { good, bad: { planned: 2, records: [{ before: true, after: false }, { before: true, after: true }] } } },
  boundary: { run: 'node genome/lane.mjs', inLane: good, outOfLane: { topping: 'cheese' }, escalate: 'kar' },
  health: { run: 'node genome/health.mjs' }, tombstone: { apply: 'node genome/tombstone.mjs apply', restore: 'node genome/tombstone.mjs restore' },
  provenance: { repo: `sjgant80-hub/${name}`, by: 'Kar, for Simon Gant', born: new Date().toISOString().slice(0, 10), grownFrom: 'sjgant80-hub/house-standard' },
}, null, 2) + '\n');
mkdirSync(join(dest, 'data'), { recursive: true });
writeFileSync(join(dest, 'data/published.json'), JSON.stringify({ v: `${name}-published/1`, run: false }, null, 1) + '\n');
const run = (argv) => spawnSync(process.execPath, argv, { cwd: dest, encoding: 'utf8' });
const built = run(['scripts/make-page.mjs']);
if (built.status !== 0) stop(`the page did not build: ${built.stderr || built.stdout}`);
const tests = run(['--test', ...readdirSync(join(dest, 'test')).filter((f) => f.endsWith('.test.mjs')).map((f) => `test/${f}`)]);
const count = (k) => Number(((tests.stdout || '').match(new RegExp(`ℹ ${k} (\\d+)`)) || [0, 0])[1]);
console.log(`${dest}: made · page built · tests ${count('pass')} pass, ${count('fail')} fail`);
console.log('next: write your claims in src/claims.mjs and CLAIMS.md, seal (node scripts/seal.mjs), make the run, gate (node scripts/gates.mjs --witness <witness.mjs>), then publish');
process.exit(tests.status === 0 ? 0 : 1);
