// durable.mjs — survive-the-kill. A long run's state lives on disk, not in memory. Each step is its own process:
// load the cursor, do ONE pure unit, commit atomically, exit. A SIGKILL finds nothing in memory to corrupt; a kill
// before the commit leaves the old state whole (atomic rename), so the pure step simply re-runs; a kill after it is
// already recorded and skipped. However many times it is killed, the result reduces to the clean run — verify or
// dissolve, applied to a crash. The commit is the only durability point, and it is atomic by rename.
//
//   import { init, step, runAll, read, heartbeatAgeMs } from './durable.mjs'
//   node genome/durable.mjs step <dir>   # one step then exit (0 = stepped, 7 = done). Used to kill-test for real.
import { readFileSync, writeFileSync, openSync, fsyncSync, closeSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const STATE = (dir) => join(dir, 'state.json');
const stepValue = (i) => i * i;                       // the demo unit of work: pure, so a re-run is identical

// the atomic durability point: write a temp file, flush it to disk, then rename over the old state. A rename is
// atomic on a POSIX filesystem, so a kill at any instant leaves either the whole old state or the whole new one.
export function commit(dir, s) {
  const tmp = STATE(dir) + '.' + process.pid + '.tmp';
  const fd = openSync(tmp, 'w');
  writeFileSync(fd, JSON.stringify(s));
  fsyncSync(fd);
  closeSync(fd);
  renameSync(tmp, STATE(dir));
}

export function read(dir) {
  return JSON.parse(readFileSync(STATE(dir), 'utf8'));
}

export function init(dir, n) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  commit(dir, { n, cursor: 0, acc: 0, heartbeat: Date.now() });
}

// one step: load, (optionally pause in the kill window), commit the advanced state. Returns true while work remains.
export async function step(dir, killWindowMs = 0) {
  const s = read(dir);
  if (s.cursor >= s.n) return false;
  const acc = s.acc + stepValue(s.cursor);          // compute (pure) — nothing committed yet
  if (killWindowMs) await new Promise((r) => setTimeout(r, killWindowMs));
  commit(dir, { n: s.n, cursor: s.cursor + 1, acc, heartbeat: Date.now() });
  return true;
}

export async function runAll(dir, n) {
  init(dir, n);
  while (await step(dir)) { /* one process-exit-per-round in production; one call in-process here */ }
  return read(dir);
}

export const heartbeatAgeMs = (dir) => Date.now() - read(dir).heartbeat;

// CLI worker: ONE step then exit. The kill window (env DUR_KILL_MS) opens a gap before the commit so a test can land
// a real SIGKILL in it. Exit 7 means the run is already done.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, dir] = process.argv.slice(2);
  if (cmd !== 'step' || !dir) { console.error('usage: node genome/durable.mjs step <dir>'); process.exit(2); }
  const did = await step(dir, Number(process.env.DUR_KILL_MS || 0));
  process.exit(did ? 0 : 7);
}
