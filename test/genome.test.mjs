import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judge, inLane, health } from '../genome/cell.mjs';
import { NORMALS, FACES, rot, faceAt } from '../kit/crystal.js';

const seed = JSON.parse(readFileSync(new URL('../seed.json', import.meta.url), 'utf8'));

test('the judge tells the seed\'s good page from its bad one: a page meets the house standard or it does not', async () => {
  assert.equal(await judge(seed.judge.cases.good), 'verified');
  assert.equal(await judge(seed.judge.cases.bad), 'unverified', 'the same page with its crystal taken out');
  assert.equal(await judge({ html: '<html><body><p>a page, but not one built to the standard</p></body></html>' }), 'unverified');
  // what is not a page is refused, whatever it says
  for (const bad of [{ html: 'no body here' }, { html: '' }, { html: 7 }, { page: '<body></body>' }, {}, null, 'x', 7]) assert.equal(await judge(bad), 'refused', JSON.stringify(bad));
});

test('the lane takes a page and refuses anything else', async () => {
  assert.equal(await inLane(seed.boundary.inLane), true); assert.equal(await inLane(seed.boundary.outOfLane), false);
  assert.equal(await inLane({ html: '<body>x</body>' }), true); assert.equal(await inLane({ html: '<BODY class="a">x' }), true);
  for (const bad of [{ html: '<bodyguard>' }, { html: 'words' }, { html: null }, null, {}, 7, 'x']) assert.equal(await inLane(bad), false, JSON.stringify(bad));
});

test('health says what the repository cannot see from inside itself', async () => {
  assert.deepEqual(await health(), { used: null, dependedOn: null, lastEarned: null });
  assert.equal(seed.name, 'house-standard'); assert.equal(seed.genome, '1'); assert.equal(seed.provenance.repo, 'sjgant80-hub/house-standard'); assert.ok(seed.purpose.length >= 20 && seed.purpose.length <= 400);
});

test('the crystal and the page agree on which face is which: the same sum, in the shader and here', () => {
  assert.equal(FACES, 32); assert.equal(NORMALS.length, 16);
  for (const n of NORMALS) assert.ok(Math.abs(Math.hypot(...n) - 1) < 1e-12, 'every normal is a unit');
  const turn = rot(0.5, 0.18), at = (u, v) => faceAt(u, v, 1.6, turn, [0, 0, 0], 1.37);
  assert.ok(at(0.5, 0.5) >= 0 && at(0.5, 0.5) < 32, 'the middle of the screen is on the crystal');
  for (const [u, v] of [[0.01, 0.01], [0.99, 0.01], [0.01, 0.99], [0.99, 0.99]]) assert.equal(at(u, v), -1, 'the corners are not');
  // turning it half way round shows the opposite face: i and i + 16 are a pair
  const front = faceAt(0.5, 0.5, 1.6, rot(0, 0), [0, 0, 0], 1.37), back = faceAt(0.5, 0.5, 1.6, rot(Math.PI, 0), [0, 0, 0], 1.37);
  assert.equal(Math.abs(front - back), 16);
  // moved aside, the middle of the screen is empty and the crystal is where it was moved to
  assert.equal(faceAt(0.5, 0.5, 1.6, turn, [3, 0, 0], 1.37), -1); assert.ok(faceAt(0.85, 0.5, 1.6, turn, [1.25, 0, 0], 1.37) >= 0);
  const seen = new Set(); for (let y = 0.2; y <= 0.8; y += 0.02) for (let x = 0.3; x <= 0.7; x += 0.02) { const f = at(x, y); if (f >= 0) seen.add(f); }
  assert.ok(seen.size >= 10, `only ${seen.size} faces face the viewer`);
  const { m, inv } = rot(0.7, -0.4); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) assert.equal(m[i * 3 + j], inv[j * 3 + i], 'the inverse of a turn is its transpose');
});
