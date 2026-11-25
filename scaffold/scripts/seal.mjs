// seal.mjs — freeze everything that can change a result before the sealed run is made: the kernels and the claims
// file. Writes SEAL.json (a SHA-256 of each file's bytes). A run counts only when it records this seal's own hash.
//   node scripts/seal.mjs            make the seal
//   node scripts/seal.mjs --check    CI: every sealed file still has the bytes it froze
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const sha = (b) => createHash('sha256').update(b).digest('hex');
export const sealed = () => [...readdirSync('src').filter((f) => f.endsWith('.mjs')).sort().map((f) => `src/${f}`), 'CLAIMS.md'];
if (process.argv[1] && process.argv[1].endsWith('seal.mjs')) {
  if (process.argv[2] === '--check') {
    if (!existsSync('SEAL.json')) { console.log('no seal yet: nothing sealed can have changed'); process.exit(0); }
    const seal = JSON.parse(readFileSync('SEAL.json', 'utf8')), changed = Object.entries(seal.files).filter(([f, h]) => !existsSync(f) || sha(readFileSync(f)) !== h).map(([f]) => f);
    console.log(changed.length ? `changed after the seal: ${changed.join(', ')}` : `every sealed file has the bytes it froze (${Object.keys(seal.files).length} files)`);
    process.exit(changed.length ? 1 : 0);
  }
  const files = Object.fromEntries(sealed().map((f) => { const b = readFileSync(f); if (b.includes(13)) throw new Error(`${f} has a carriage return: the seal hashes LF bytes only`); return [f, sha(b)]; }));
  writeFileSync('SEAL.json', JSON.stringify({ v: '__NAME__-seal/1', note: 'every file that can change a result, frozen before the sealed run', files }, null, 1) + '\n');
  console.log(`SEAL.json: ${Object.keys(files).length} files · seal sha256 ${sha(readFileSync('SEAL.json')).slice(0, 12)}`);
}
