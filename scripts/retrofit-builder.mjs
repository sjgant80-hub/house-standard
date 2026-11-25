// retrofit-builder.mjs — the second half of a retrofit: tell an older build's page builder (scripts/make-page.mjs)
// about the house kit. The kit and the receipts reader are inlined first, as vendored; the token sheet goes into the
// page's style; the house layer (page/house-app.js) runs after the build's own page script; what the layer draws is
// baked like everything else. It changes nothing else in the builder.
//   node scripts/retrofit-builder.mjs <repo folder> <name of the page script's ready handle, e.g. __verifier>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, ready] = process.argv.slice(2);
const stop = (why) => { console.error(`builder not changed: ${why}`); process.exit(1); };
if (!dir || !ready) stop('usage: node scripts/retrofit-builder.mjs <repo folder> <ready handle>');
const p = join(dir, 'scripts/make-page.mjs');
let s = readFileSync(p, 'utf8');
if (s.includes('vendor/house/crystal.js')) stop('the builder already knows the kit');
const swap = (a, b) => { if (!s.includes(a)) stop(`the builder has another shape: no ${JSON.stringify(a.slice(0, 60))}`); s = s.replace(a, b); };
swap('export const KERNELS = [\n', "export const KERNELS = [\n  // the house kit (the crystal, the motion) and the house's receipts reader, as vendored\n  ['CRYSTAL', 'vendor/house/crystal.js'], ['HOUSE', 'vendor/house/house.js'], ['RECEIPTS', 'vendor/house/receipts.mjs'],\n");
swap("export const BAKED = [", "export const BAKED = ['hsFacet', 'hsReceipts', 'hsClaims', ");
swap(".replace('/*KERNELS*/', () => kernels).replace('/*APP*/', () => read('page/app.js').trim());", ".replace('/*HOUSE_CSS*/', () => read('vendor/house/house.css').trim()).replace('/*KERNELS*/', () => kernels).replace('/*APP*/', () => `${read('page/app.js').trim()}\\n\\n${read('page/house-app.js').trim()}`);");
swap(`await g.${ready}.ready;`, `await g.${ready}.ready;\n    if (g.__houseLayer) await g.__houseLayer;                       // the house layer draws after the page script, and is baked with it`);
writeFileSync(p, s);
console.log('the builder knows the kit');
