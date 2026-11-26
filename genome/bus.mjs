// bus.mjs — verify-or-dissolve on the wire. Agents talk over an untrusted channel, so a message is trusted only when
// it proves itself: signed with the run's per-task key (HMAC), its nonce unseen (no replay), and — for a privileged
// action — carrying a delegation signed by the authority (Depth 6 / Kar), not by the sender itself. A cheaper tier
// cannot vouch for its own authority; that was the open hole, and it is closed here. Anything that fails a check
// DISSOLVES. The bond is the product, the same law the rest of the house runs on, now between agents.
//
//   import { sign, Receiver } from './bus.mjs'
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const canon = (o) => JSON.stringify(o, Object.keys(o).sort());
export const sign = (key, payload) => createHmac('sha256', key).update(canon(payload)).digest('hex');
const sameSig = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length
  && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const bodyOf = (m) => Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'sig'));

export class Receiver {
  constructor(busKey, authorityKey) { this.busKey = busKey; this.authorityKey = authorityKey; this.seen = new Set(); }

  // returns { ok, why }. ok === true only when the message bonds.
  bond(msg, { privileged = false } = {}) {
    if (!msg || typeof msg !== 'object') return { ok: false, why: 'not a message' };
    // 1 — integrity: HMAC over the exact body with the per-task bus key
    if (!sameSig(msg.sig, sign(this.busKey, bodyOf(msg)))) return { ok: false, why: 'bad/absent signature' };
    // 2 — replay: the nonce must be fresh
    if (!msg.nonce || this.seen.has(msg.nonce)) return { ok: false, why: 'missing/replayed nonce' };
    // 3 — cross-tier: a privileged action needs an authority delegation, not the sender vouching for itself
    if (privileged) {
      const d = msg.delegation;
      if (!d) return { ok: false, why: 'privileged action without delegation' };
      if (!sameSig(d.sig, sign(this.authorityKey, bodyOf(d)))) return { ok: false, why: 'delegation not from authority (self-vouch)' };
      if (d.grantTo !== msg.from) return { ok: false, why: 'delegation not issued to this sender' };
    }
    this.seen.add(msg.nonce);
    return { ok: true, why: 'bonded' };
  }
}

// helper for callers/tests: build a signed message (optionally carrying a delegation)
export function message(key, from, body, delegation) {
  const m = { from, nonce: randomBytes(8).toString('hex'), body };
  if (delegation) m.delegation = delegation;
  m.sig = sign(key, bodyOf(m));
  return m;
}
export function delegate(authorityKey, grantTo, scope) {
  const d = { grantTo, scope };
  d.sig = sign(authorityKey, { grantTo, scope });
  return d;
}
