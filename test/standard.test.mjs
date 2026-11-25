import { test } from 'node:test';
import assert from 'node:assert/strict';
import S from '../src/standard.mjs';

const CREDIT = 'Powered by the Konomi architecture, created by Thomas Frumkin.';
const CSS = ":root{--bg:#02070c;--cyan:#49e8c8;--gold:#ffcf6a;--red:#ff6b6b}body{font-family:'Hanken Grotesk'}h1{font-family:'Fraunces'}.n{font-family:'JetBrains Mono'}";
const stat = (src) => `<div class="stat reveal"><div class="n">31% → 50%</div><div class="lab">right, cold</div>${src}</div>`;
const SRC = '<a class="src" href="data/verdict.json">receipt ↗</a>';
// a page that meets the standard; each part can be swapped to break exactly one thing
const page = (o = {}) => `<!doctype html><html><head><style>${o.css ?? CSS}</style></head><body>
<header class="hero">${o.hero ?? '<canvas id="crystal"></canvas>'}<h1>Taught only its own checked work.</h1><p class="sub">A small model.</p></header>
<section><div class="stats">${o.stats ?? stat(SRC) + stat(SRC)}</div>${o.prose ?? ''}</section>
<section>${o.stack ?? '<div class="stack"><div class="srow"><div class="d">K1</div><div class="nm"><b>Lift</b><span class="tag cy">pass</span></div></div><div class="srow red"><div class="d">K2</div><div class="nm"><b>Honest</b><span class="tag rd">fail · kept</span></div></div></div>'}</section>
<section>${o.glass ?? '<div class="glass"><h3>Try it</h3><button id="go" type="button">Check it</button></div>'}</section>
${o.honest ?? '<details class="honest reveal"><summary>What this does and does not claim</summary><div class="in"><p><b>One.</b> a.</p><p><b>Two.</b> b.</p><p><b>Three.</b> c.</p></div></details>'}
<footer>${o.footer ?? CREDIT}</footer><script>const hidden = "not measured yet";</script></body></html>`;
const rule = (html, id) => S.check(html).rules.find((r) => r.id === id);
const only = (html, id) => { const r = S.check(html); assert.deepEqual(r.rules.filter((x) => !x.pass).map((x) => x.id), [id], JSON.stringify(r.rules.filter((x) => !x.pass))); assert.equal(r.pass, false); return rule(html, id).why; };
const lorem = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

test('a page built to the standard passes all seven rules, each with what was counted', () => {
  const r = S.check(page());
  assert.equal(r.pass, true); assert.deepEqual(r.rules.map((x) => x.id), ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7']);
  for (const x of r.rules) { assert.equal(x.pass, true, x.id); assert.equal(x.name, S.NAMES[x.id]); assert.equal(typeof x.why, 'string'); }
  assert.equal(r.rules[0].why, 'crystal hero, 2 receipts, 2 stack rows, 1 controls on the glass, 1 expanders');
  assert.equal(r.rules[2].why, '2 of 2 receipts carry their source, or say they are still sealing');
  assert.equal(r.rules[6].why, 'the credit line is on the page; no price; no private shorthand');
  const m = r.measured;
  assert.deepEqual([m.crystal, m.receipts, m.stackRows, m.glass, m.controls, m.expanders, m.limits, m.sourced, m.unfinished, m.shown, m.tokens, m.faces, m.credit, m.priced, m.shorthand], [true, 2, 2, 1, 1, 1, 3, 2, 0, true, 4, 3, true, false, false]);
  assert.ok(m.viewWords > 0 && m.viewWords < m.allWords, 'what is behind a click is not counted as greeting the visitor');
  assert.deepEqual(S.LIMITS, { paragraph: 45, view: 1250, limits: 3 });
});

test('H1 the kit: each of the five parts must be there, and the glass must have something to press', () => {
  assert.equal(only(page({ hero: '<canvas id="other"></canvas>' }), 'H1'), 'missing: the crystal hero');
  assert.equal(only(page({ stack: '<p class="fail">no stack</p>' }), 'H1'), 'missing: a stack');
  assert.equal(only(page({ glass: '<div class="glass"><h3>Look</h3></div>' }), 'H1'), 'missing: a glass with something to press');
  assert.equal(only(page({ glass: '<button type="button">loose</button>' }), 'H1'), 'missing: a glass with something to press');
  assert.equal(rule(page({ glass: '<div class="proof"><button type="button">Judge it</button></div><div class="glass"><b>wall</b></div>' }), 'H1').pass, true, 'a control in the proof block runs the glass');
  for (const el of ['select', 'textarea', 'input']) assert.equal(rule(page({ glass: `<div class="glass"><${el}></${el}></div>` }), 'H1').pass, true, el);
  // a class that only contains the word is not the part: "glassy", "stat-bar", "mystack"
  assert.equal(rule(page({ glass: '<div class="glassy"><button>x</button></div>' }), 'H1').pass, false);
  assert.equal(S.measure(page({ stats: '<div class="stat-bar">x</div><div class="mystat">y</div>' })).receipts, 0);
  const none = S.check(page({ hero: '', stats: '', stack: '', glass: '', honest: '' }));
  assert.equal(none.rules[0].why, 'missing: the crystal hero, receipts, a stack, a glass with something to press, an honest expander');
  // nested blocks are matched to their own closing tag
  assert.equal(S.measure(page({ glass: '<div class="glass"><div><div>deep</div></div><button>go</button></div>' })).controls, 1);
});

test('H2 the law of the page: no paragraph of prose greets a visitor, and the default view is short', () => {
  assert.equal(rule(page({ prose: `<p>${lorem(45)}</p>` }), 'H2').pass, true, 'exactly the limit is within it');
  assert.match(only(page({ prose: `<p>${lorem(46)}</p>` }), 'H2'), /the longest paragraph is 46 words \(at most 45\)/);
  // prose behind a click does not greet anyone
  assert.equal(rule(page({ honest: `<details class="honest"><summary>more</summary><div class="in"><p>${lorem(400)}</p><p>b</p><p>c</p></div></details>` }), 'H2').pass, true);
  // many short paragraphs still make a wall
  const many = Array.from({ length: 40 }, () => `<p>${lorem(40)}</p>`).join('');
  assert.match(only(page({ prose: many }), 'H2'), /^1\d\d\d words before any click \(at most 1250\)/);
  const at = (n) => S.measure(page({ prose: `<div>${lorem(n)}</div>` })).viewWords, base = at(0);
  assert.equal(rule(page({ prose: `<div>${lorem(1250 - base)}</div>` }), 'H2').pass, true); assert.equal(rule(page({ prose: `<div>${lorem(1251 - base)}</div>` }), 'H2').pass, false);
  // words in a script, a style, a drawing or a list of options are not prose
  assert.equal(at(0), S.measure(page({ prose: `<svg><text>${lorem(50)}</text></svg><select><option>${lorem(50)}</option></select>` })).viewWords);
  assert.equal(rule('<html><body></body></html>', 'H2').pass, false, 'an empty page is not a short page');
});

test('H3 receipts: every one carries its source, or says it is still sealing', () => {
  assert.equal(only(page({ stats: stat(SRC) + stat('') }), 'H3'), '1 of 2 receipts carry their source, or say they are still sealing');
  assert.equal(rule(page({ stats: stat(SRC) + stat('<span class="tag gd">sealing now</span>') }), 'H3').pass, true);
  assert.equal(rule(page({ stats: stat('<a class="src" href="">receipt</a>') + stat(SRC) }), 'H3').pass, false, 'a link to nowhere is not a source');
  assert.equal(rule(page({ stats: stat('<a href="x.json">receipt</a>') + stat(SRC) }), 'H3').pass, false, 'the source link is marked as one');
  assert.equal(rule(page({ stats: '' }), 'H3').pass, false, 'no receipts is not every receipt sourced');
});

test('H4 nothing unfinished: no placeholder, and nothing left unmeasured', () => {
  for (const bad of ['not measured yet', 'Lorem ipsum dolor', 'Coming soon', 'TODO', 'TBD']) assert.equal(only(page({ prose: `<p>${bad}</p>` }), 'H4'), '1 placeholders on the page', bad);
  assert.equal(rule(page({ prose: '<p>mastodon and todo-list are words</p>' }), 'H4').pass, false, 'todo in any case is caught');
  assert.equal(rule(page({ prose: '<p>the photodiode is tbdless</p>' }), 'H4').pass, true, 'inside a longer word it is not a placeholder');
  assert.equal(rule(page(), 'H4').pass, true, 'a placeholder string inside the script is the script\'s own business');
});

test('H5 the fail-wall: limits behind a click, and a failure or an unfinished part shown as one', () => {
  assert.match(only(page({ honest: '<details class="honest"><summary>limits</summary><div class="in"><p>a</p><p>b</p></div></details>' }), 'H5'), /^2 limits behind a click \(at least 3\)/);
  const clean = '<div class="stack"><div class="srow"><div class="d">K1</div><span class="tag cy">pass</span></div></div>';
  assert.match(only(page({ stack: clean }), 'H5'), /nothing on the page is shown as failed or unfinished$/);
  assert.equal(rule(page({ stack: clean, stats: stat('<span class="tag gd">sealing now</span>') + stat(SRC) }), 'H5').pass, true, 'sealing now is an unfinished part, shown');
  for (const cls of ['fail', 'bad', 'n bad']) assert.equal(rule(page({ stack: clean + `<b class="${cls}">3 lost</b>` }), 'H5').pass, true, cls);
  assert.equal(rule(page({ stack: clean + '<b class="failsafe">x</b>' }), 'H5').pass, false);
  // limits in two expanders add up; a details that is not the honest expander does not count
  assert.equal(rule(page({ honest: '<details class="honest"><summary>a</summary><p>1</p><p>2</p></details><details class="honest"><summary>b</summary><p>3</p></details>' }), 'H5').pass, true);
  assert.equal(S.measure(page({ honest: '<details><summary>a</summary><p>1</p><p>2</p><p>3</p></details>' })).limits, 0);
});

test('H6 one identity and H7 house rules', () => {
  assert.equal(only(page({ css: CSS.replace('#02070c', '#000000') }), 'H6'), '3 of 4 house colours, 3 of 3 house faces');
  assert.equal(only(page({ css: CSS.replace('Fraunces', 'Georgia') }), 'H6'), '4 of 4 house colours, 2 of 3 house faces');
  assert.equal(rule(page({ css: CSS.toUpperCase().replace('FRAUNCES', 'Fraunces').replace('HANKEN GROTESK', 'Hanken Grotesk').replace('JETBRAINS MONO', 'JetBrains Mono') }), 'H6').pass, true, 'a colour is the same colour in capitals');
  assert.equal(only(page({ footer: 'no credit' }), 'H7'), 'the credit line is missing; no price; no private shorthand');
  for (const price of ['£49 a month', '$ 9', '€5', 'per seat', 'per user', 'per month', 'Pricing']) assert.match(only(page({ prose: `<p>${price}</p>` }), 'H7'), /a price is on the page/, price);
  assert.equal(rule(page({ prose: '<p>no charge at all, on the machine you own</p>' }), 'H7').pass, true);
  for (const sign of ['κ', 'φ', '◊', 'a torus of light']) assert.match(only(page({ prose: `<p>${sign}</p>` }), 'H7'), /private shorthand is on the page$/, sign);
  assert.equal(rule(page({ prose: '<p>the history of storus</p>' }), 'H7').pass, true);
});

test('what is not a page fails every rule, and nothing thrown at it breaks it', () => {
  for (const bad of [null, undefined, 7, {}, [], () => 1, '', 'plain words', '<p>no body</p>']) {
    assert.doesNotThrow(() => S.check(bad)); const r = S.check(bad);
    assert.equal(r.pass, false); assert.deepEqual(r.rules.map((x) => x.pass), [false, false, false, false, false, false, false], String(bad));
  }
  assert.deepEqual(Object.keys(S.NAMES), ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7']);
  // a page is what is in its body, wherever the body starts; an element never closed is not a part
  assert.equal(S.measure('<body><canvas id="crystal"></canvas></body>').crystal, true); assert.equal(S.measure('<canvas id="crystal"></canvas>').crystal, false);
  assert.equal(S.measure('<body><div class="stat">never closed').receipts, 0); assert.equal(S.measure('<body><div class="stat"></div>').receipts, 1);
});
