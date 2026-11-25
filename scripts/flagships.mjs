// flagships.mjs — read every flagship's own built page and write data/flagships.json: the receipts the front door
// shows. No number is typed here. Each is read by src/receipts.mjs from the page that proves it, at a named commit,
// and each page is held to the ship gate (src/standard.mjs). The live page reads the same pages again in the
// visitor's tab; this file is what it shows until that read comes back, and what it shows with scripts off.
//   node scripts/flagships.mjs [folder that holds the flagship repositories]      (default: beside this one)
//   node scripts/flagships.mjs --check     CI: the kernels read the recorded pages' receipts the same way again
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { read } from '../src/flagship.mjs';

export const BUILDS = [
  { repo: 'the-climb', name: 'The Climb', verb: 'It climbs.', line: 'A problem it fails cold, broken into steps it can do. Each step checked.' },
  { repo: 'the-crystal', name: 'The Crystal', verb: 'It crystallises.', line: 'The answer grown from proven pieces. What cannot be proven dissolves.' },
  { repo: 'the-verifier-set', name: 'The Verifier Set', verb: 'It refuses to lie.', line: 'Checked against the arithmetic or the cited source, or not released.' },
  { repo: 'the-seed', name: 'The Seed', verb: 'It grows itself.', line: 'A handful of files that grows verified software, one cell at a time.' },
  { repo: 'the-distillation', name: 'The Distillation', verb: 'It learns.', line: 'Trained only on its own verified work. Tested cold on problems it never saw.' },
];
if (process.argv[1] && process.argv[1].endsWith('flagships.mjs')) {
  const at = (p) => new URL(`../${p}`, import.meta.url);
  if (process.argv[2] === '--check') {
    const f = JSON.parse(readFileSync(at('data/flagships.json'), 'utf8'));
    const ok = f.builds.length === BUILDS.length && f.builds.every((b, i) => b.repo === BUILDS[i].repo && /^[0-9a-f]{40}$/.test(b.commit));
    console.log(ok ? `data/flagships.json records ${f.builds.length} flagships, each read at a named commit (${f.builds.map((b) => `${b.repo}@${b.commit.slice(0, 7)}`).join(', ')})` : 'data/flagships.json is not a whole record of the flagships');
    process.exit(ok ? 0 : 1);
  }
  const home = process.argv[2] || new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const builds = BUILDS.map((b) => {
    const dir = `${home}/${b.repo}`.replace(/\/+/g, '/');
    if (!existsSync(`${dir}/index.html`)) throw new Error(`${b.repo}: no built page at ${dir}`);
    const commit = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const g = existsSync(`${dir}/data/gates.json`) ? JSON.parse(readFileSync(`${dir}/data/gates.json`, 'utf8')) : null;
    return { ...b, live: `https://sjgant80-hub.github.io/${b.repo}/`, commit, ...read(b.repo, readFileSync(`${dir}/index.html`, 'utf8')), gate: g && Number.isInteger(g.killed) ? { killed: g.killed, total: g.total, clean: g.clean === true } : null };
  });
  // one receipt lives in a record, not on a page: how much of the harvest's work was taken over from work already done
  const parity = `${home}/the-distillation/data/parity.json`.replace(/\/+/g, '/');
  const reuse = existsSync(parity) ? (() => { const g = JSON.parse(readFileSync(parity, 'utf8')).grown; return { taken: g.tokens_taken_over, worked: g.tokens_worked_out }; })() : null;
  const gates = existsSync(at('data/gates.json')) ? JSON.parse(readFileSync(at('data/gates.json'), 'utf8')) : null;
  const devPath = `${home}/the-distillation/data/dev/verdict.json`.replace(/\/+/g, '/'), livePath = `${home}/the-distillation/data/live.json`.replace(/\/+/g, '/');
  const dv = existsSync(devPath) ? JSON.parse(readFileSync(devPath, 'utf8')) : null, dev = dv && dv.cold ? { cold: { n: dv.cold.n, base: { right: dv.cold.base.right }, distilled: { right: dv.cold.distilled.right } } } : null;
  const loop = existsSync(livePath) ? JSON.parse(readFileSync(livePath, 'utf8')) : null;
  writeFileSync(at('data/flagships.json'), JSON.stringify({ v: 'house-standard-flagships/1', read: new Date().toISOString().slice(0, 10), builds, reuse, dev, loop, gate: gates ? { killed: gates.killed, total: gates.total, clean: gates.clean } : null }, null, 1) + '\n');
  for (const b of builds) console.log(`${b.standard.pass ? 'PASS' : 'FAIL'} ${b.repo}@${b.commit.slice(0, 7)} · ${b.headline ? `${b.headline.was} → ${b.headline.now} of ${b.headline.of}` : 'no headline receipt on its page'} · claims ${b.claims.pass} pass, ${b.claims.fail} fail, ${b.claims.sealing} sealing · ${b.standard.viewWords} words before a click`);
}
