// cell.mjs — this build's three answers for the estate genome's birth check (seed.json, genome/).
//
// judge  its own claims' ruling on one recorded run { planned, records }: verified when every claim passes;
//        unverified when any fails; refused when what is given is not a run.
// lane   in lane when what is given is a run: a count of planned problems and a record for each.
// health the repository cannot see its page's visitors or callers from inside it, so it says so.
import { verdicts } from '../src/claims.mjs';

export async function judge(input) {
  const v = verdicts(input);
  if (v.some((x) => x.pass === null)) return 'refused';
  return v.every((x) => x.pass === true) ? 'verified' : 'unverified';
}

export async function inLane(input) {
  return verdicts(input).every((x) => x.pass !== null);
}

export async function health() {
  return { used: null, dependedOn: null, lastEarned: null };
}
