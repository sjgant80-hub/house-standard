// cell.mjs — the house standard's three answers for the estate genome's birth check (seed.json, genome/).
//
// judge  the ship gate's own ruling on one page { html }: verified when the page meets all seven rules of the house
//        standard (src/standard.mjs); unverified when it fails any; refused when what is given is not a page at all.
// lane   in lane when what is given is a page: text with a body. That is all the gate ever rules on.
// health the repository cannot see its page's visitors or callers from inside it, so it says so.
import { check } from '../src/standard.mjs';

const page = (input) => (input !== null && typeof input === 'object' && typeof input.html === 'string' && /<body[\s>]/i.test(input.html) ? input.html : null);

export async function judge(input) {
  const html = page(input);
  if (html === null) return 'refused';
  return check(html).pass ? 'verified' : 'unverified';
}

export async function inLane(input) {
  return page(input) !== null;
}

export async function health() {
  return { used: null, dependedOn: null, lastEarned: null };
}
