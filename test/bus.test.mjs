// bus.test.mjs — the signed bus is sealed by six claims: a genuine message bonds; a tampered body, an injected
// (wrong-key) message, a replayed nonce, and a cheaper tier vouching for its own authority all DISSOLVE; and an
// authority-signed delegation bonds the privileged action. The delegation-boundary hole is closed by K5.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { Receiver, message, delegate, sign } from '../genome/bus.mjs';

const busKey = randomBytes(32);        // per task
const authKey = randomBytes(32);       // authority: Depth 6 / Kar
const attacker = randomBytes(32);      // an attacker's guessed key

test('K1 a genuine message bonds', () => {
  const R = new Receiver(busKey, authKey);
  assert.equal(R.bond(message(busKey, 'crystal', 'result=85.7')).ok, true);
});

test('K2 a tampered body dissolves', () => {
  const R = new Receiver(busKey, authKey);
  const m = message(busKey, 'crystal', 'result=85.7');
  m.body = 'result=999';
  assert.equal(R.bond(m).ok, false);
});

test('K3 an injected (wrong-key) message dissolves', () => {
  const R = new Receiver(busKey, authKey);
  assert.equal(R.bond(message(attacker, 'evil', 'drop table')).ok, false);
});

test('K4 a replayed nonce dissolves', () => {
  const R = new Receiver(busKey, authKey);
  const m = message(busKey, 'crystal', 'ping');
  assert.equal(R.bond(m).ok, true);
  assert.equal(R.bond(m).ok, false, 'the same message cannot bond twice');
});

test('K5 a cheaper tier vouching for its own authority dissolves', () => {
  const R = new Receiver(busKey, authKey);
  const selfDele = { grantTo: 'haiku-tier', scope: 'write' };
  selfDele.sig = sign(busKey, { grantTo: 'haiku-tier', scope: 'write' }); // signed with the BUS key, not authority
  const m = message(busKey, 'haiku-tier', 'APPROVE merge', selfDele);
  assert.equal(R.bond(m, { privileged: true }).ok, false);
});

test('K6 an authority-signed delegation bonds the privileged action', () => {
  const R = new Receiver(busKey, authKey);
  const m = message(busKey, 'haiku-tier', 'APPROVE merge', delegate(authKey, 'haiku-tier', 'write'));
  assert.equal(R.bond(m, { privileged: true }).ok, true);
});
