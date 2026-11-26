// durable.test.mjs — the organ is sealed by a real kill storm: spawn each step as its own process, SIGKILL many of
// them mid-step (before their commit), and the finished result must equal the clean run exactly — every step once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { init, step, runAll, read, heartbeatAgeMs } from '../genome/durable.mjs';

const WORKER = fileURLToPath(new URL('../genome/durable.mjs', import.meta.url));
const N = 24;
const EXPECTED = Array.from({ length: N }, (_, i) => i * i).reduce((a, b) => a + b, 0); // the axiom floor

const freshDir = () => mkdtempSync(join(tmpdir(), 'dur-'));

function runWorkerStep(dir, { kill = false } = {}) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [WORKER, 'step', dir], { env: { ...process.env, DUR_KILL_MS: '120' } });
    let killed = false;
    if (kill) setTimeout(() => { if (p.exitCode === null) { p.kill('SIGKILL'); killed = true; } }, 30);
    p.on('exit', (code) => resolve({ code, killed }));
  });
}

test('clean run: the result reduces to the axiom floor', async () => {
  const dir = freshDir();
  const s = await runAll(dir, N);
  assert.equal(s.acc, EXPECTED);
  assert.equal(s.cursor, N);
  rmSync(dir, { recursive: true, force: true });
});

test('kill storm: real SIGKILLs mid-step, result identical, every step exactly once', async () => {
  const dir = freshDir();
  init(dir, N);
  let kills = 0, spawns = 0;
  while (read(dir).cursor < N) {
    const kill = Math.random() < 0.5;
    const { killed } = await runWorkerStep(dir, { kill });
    spawns++;
    if (killed) kills++;
  }
  const s = read(dir);
  assert.equal(s.acc, EXPECTED, 'killed run equals clean run');
  assert.equal(s.cursor, N, 'no step lost or double-counted');
  assert.ok(kills > 0, `the storm must land real kills (landed ${kills} over ${spawns} spawns)`);
  rmSync(dir, { recursive: true, force: true });
});

test('heartbeat: a stalled run is detectable from the age of its last commit', async () => {
  const dir = freshDir();
  init(dir, N);
  await step(dir);
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(heartbeatAgeMs(dir) >= 30, 'the age since the last commit flags a stall');
  rmSync(dir, { recursive: true, force: true });
});
