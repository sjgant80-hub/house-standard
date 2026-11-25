import { test } from 'node:test';
import assert from 'node:assert/strict';
import P from '../src/plain.mjs';

const page = (inner) => `<!doctype html><html><head><style>p{color:red}</style></head><body>${inner}<script>const t = "A sentence inside a script is not read by anybody at all.";</script></body></html>`;
const grade = (words, sentences, beats) => Math.round((0.39 * (words / sentences) + 11.8 * (beats / words) - 15.59) * 10) / 10;

test('syllables: vowel groups are beats, a silent ending is not one, and everyday words the rule gets wrong are listed', () => {
  for (const [w, n] of [['cat', 1], ['own', 1], ['AI', 1], ['the', 1], ['proof', 1], ['check', 1], ['checked', 1], ['tested', 2], ['needed', 2], ['table', 2], ['simple', 2], ['proves', 1], ['machine', 2], ['machines', 2], ['computer', 3], ['answer', 2], ['yes', 1], ['year', 1], ['young', 1], ['beyond', 2], ['rhythm', 1], ['tsk', 1], ['strengths', 1], ['understand', 3], ['organisation', 5], ['re-run', 2], ["don't", 1], ['queue', 2], ['a', 1], ['I', 1], ['we', 1], ['be', 1], ['go', 1], ['ago', 2], ['any', 2], ['era', 2], ['one', 1], ['use', 1], ['you', 1], ['why', 1], ['eye', 1]]) assert.equal(P.syllables(w), n, w);
  // the listed words: by rule each would be miscounted; the list gives its true beats, in any case
  for (const [w, n] of [['every', 2], ['Every', 2], ['business', 2], ['something', 2], ['idea', 3], ['being', 2], ['science', 2], ['people', 2], ['real', 1], ['used', 1], ['pages', 2], ['everything', 3]]) assert.equal(P.syllables(w), n, w);
  assert.equal(P.syllables('toString'), 2, 'a word that is also the name of a built-in is counted by the rule');
  for (const bad of ['', '123', '—', null, undefined, 7, {}, []]) assert.equal(P.syllables(bad), 0, String(bad));
});

test('sentences: a block ends a piece of text, and so does a stop followed by a space', () => {
  assert.deepEqual(P.sentences(page('<h1>AI you own</h1><p>It runs here. It says “I don’t know.” Then it stops! Why? Because 36.5% is not 70.8%.</p><ul><li>One thing</li><li>Another thing</li></ul>')),
    ['AI you own', 'It runs here.', 'It says “I don’t know.”', 'Then it stops!', 'Why?', 'Because 36.5% is not 70.8%.', 'One thing', 'Another thing']);
  // a button, a link, a table cell and a line break each end one; inline marks do not
  assert.deepEqual(P.sentences(page('<p>See <b>the</b> <em>proof</em> now<br>or later</p><a href="#x">Try it</a><button>Go</button><table><tr><td>Left cell</td><td>Right cell</td></tr></table>')), ['See the proof now', 'or later', 'Try it', 'Go', 'Left cell', 'Right cell']);
  // a piece with no word is dropped; entities are read as the characters they stand for; a line break in the source is a space
  assert.deepEqual(P.sentences(page('<p>22 → 0</p><p>—</p><p>Tom &amp; Sam can&#39;t\n   re&#8209;run it.</p>')), ["Tom & Sam can't re-run it."]);
  // scripts, styles, drawings and option lists are not read; nor is anything before the body
  assert.deepEqual(P.sentences('<p>before the body</p><body><svg><text>drawn words</text></svg><select><option>an option</option></select><textarea>typed</textarea><noscript>off</noscript><p>Read me.</p></body>'), ['Read me.']);
  for (const bad of [null, undefined, 7, {}, [], '', 'plain words', '<p>no body</p>']) assert.deepEqual(P.sentences(bad), [], String(bad));
});

test('measure: the grade is worked out over full sentences only; long words and jargon are counted everywhere', () => {
  const m = P.measure(page('<p>The cat sat on the mat.</p>'));
  assert.deepEqual(m.view, { sentences: 1, pieces: 1, words: 6, grade: grade(6, 1, 6), longest: 6, longestText: 'The cat sat on the mat.', allWords: 6, longWords: 0, longShare: 0, jargon: [] });
  assert.equal(m.view.grade, -1.4); assert.deepEqual(m.all, m.view);
  // a label is a piece, not a sentence: it does not pull the grade down, and its hard words are still counted
  const lab = P.measure(page('<button>Go</button><h2>Organisational infrastructure</h2><p>The cat sat on the mat.</p>')).view;
  assert.deepEqual([lab.sentences, lab.pieces, lab.words, lab.grade, lab.allWords, lab.longWords, lab.longShare], [1, 3, 6, grade(6, 1, 6), 9, 2, 22.2]);
  // numbers are read as figures, not counted as words; longer words and longer sentences raise the grade
  assert.equal(P.measure(page('<p>The cat sat on 26,086 mats in 2026.</p>')).view.words, 6);
  const hard = P.measure(page('<p>Organisations understand computer machines.</p>')).view;
  assert.deepEqual([hard.words, hard.grade, hard.longWords, hard.longShare], [4, grade(4, 1, 13), 3, 75]);
  const two = P.measure(page('<p>It runs. It checks every single answer it gives you.</p>')).view;
  assert.deepEqual([two.sentences, two.words, two.longest, two.longestText], [2, 10, 8, 'It checks every single answer it gives you.']);
  assert.equal(P.measure(page('<p>Done.”</p><p>Done.)</p><p>Not done</p>')).view.sentences, 2, 'a closing quote or bracket after the stop still ends a sentence');
  assert.equal(P.measure(page('<p>One two three. Four five six. Seven eight.</p>')).view.longestText, 'One two three.', 'of two sentences as long as each other, the first is the one named');
  // what waits behind a click, or in a dialog, is in the whole page and not in the view, however deep it is folded
  const f = P.measure(page('<p>Short and plain.</p><details><summary>More</summary><p>Organisations understand.</p><details><summary>Deeper</summary><p>Computer machines.</p></details><p>Still inside.</p></details><dialog><p>A ledger.</p></dialog><p>After it.</p>'));
  assert.deepEqual([f.view.sentences, f.view.words, f.view.pieces], [2, 5, 2]); assert.deepEqual([f.all.sentences, f.all.words, f.all.pieces], [6, 13, 8]);
  assert.ok(f.all.grade > f.view.grade);
  // jargon: the trade's own words, found in any case, each named once, in order; a page may bring its own list
  const j = P.measure(page('<p>Our RAG beats a Codec.</p><button>Run the codec</button><details><summary>More</summary><p>A mutation.</p></details>'));
  assert.deepEqual(j.view.jargon, ['codec', 'rag']); assert.deepEqual(j.all.jargon, ['codec', 'mutation', 'rag']);
  assert.deepEqual(P.measure(page('<p>Our RAG beats a Widget.</p>'), ['widget', 7, null]).view.jargon, ['widget']);
  assert.deepEqual(P.measure(page('<p>Our RAG beats a Widget.</p>'), 'widget').view.jargon, ['rag'], 'a list that is not a list is the standing list');
  assert.ok(P.JARGON.includes('codec') && P.JARGON.every((x) => x === x.toLowerCase()));
  // nothing to read is no grade at all, not a perfect one
  for (const bad of [null, '', '<body></body>', page('<p>22 → 0</p>')]) assert.deepEqual(P.measure(bad).view, { sentences: 0, pieces: 0, words: 0, grade: null, longest: 0, longestText: '', allWords: 0, longWords: 0, longShare: null, jargon: [] }, String(bad));
  assert.equal(P.measure(page('<h1>Only a heading</h1>')).view.grade, null, 'labels alone are no sentence to grade');
});

test('check: five rules, each with what was measured, against the bars or the ones given', () => {
  const plain = page('<h1>AI you own</h1><p>It runs on your own computer. It says so when it does not know.</p><details><summary>More</summary><p>We test it on new sums. It has never seen them.</p></details>');
  const r = P.check(plain);
  assert.equal(r.pass, true); assert.deepEqual(r.rules.map((x) => [x.id, x.name, x.pass]), [['P1', 'Reads at twelve', true], ['P2', 'Behind a click, still plain', true], ['P3', 'Short sentences', true], ['P4', 'Short words', true], ['P5', 'No jargon', true]]);
  assert.equal(r.rules[0].why, `school year ${r.measured.view.grade.toFixed(1)} before any click (at most 6)`);
  assert.equal(r.rules[1].why, `school year ${r.measured.all.grade.toFixed(1)} for the whole page (at most 7)`);
  assert.equal(r.rules[2].why, 'the longest sentence before any click is 8 words (at most 25)');
  assert.equal(r.rules[3].why, '5.9% of the words before any click have three beats or more (at most 10%)');
  assert.equal(r.rules[4].why, 'no trade word before any click');
  assert.deepEqual(P.BARS, { view: 6, all: 7, sentence: 25, long: 10 });
  // hard words in the open fail P1, P2 and P4; folded away they fail only P2
  const dense = '<p>Organisational infrastructure necessitates comprehensive verification methodologies.</p>';
  assert.deepEqual(P.check(page(dense)).rules.map((x) => x.pass), [false, false, true, false, true]);
  assert.deepEqual(P.check(page(`<p>It is plain here.</p><details><summary>More</summary>${dense}${dense}</details>`)).rules.map((x) => x.pass), [true, false, true, true, true]);
  // a long sentence of short words fails P3 at the bar and passes one word under it
  const long = (n) => page(`<p>${Array.from({ length: n }, () => 'so').join(' ')}.</p><p>It is. It was. It can. It will. It did. It does. It may. It has. It had.</p>`);
  assert.equal(P.check(long(25)).rules[2].pass, true); assert.equal(P.check(long(26)).rules[2].pass, false);
  assert.equal(P.check(long(26)).rules[2].why, 'the longest sentence before any click is 26 words (at most 25)');
  // a trade word in the open fails P5 and is named; behind a click it does not
  const jar = P.check(page('<p>It is a codec. It is a RAG.</p>'));
  assert.equal(jar.rules[4].pass, false); assert.equal(jar.rules[4].why, 'trade words before any click: codec, rag');
  assert.equal(P.check(page('<p>It is plain.</p><details><summary>More</summary><p>It is a codec.</p></details>')).rules[4].pass, true);
  assert.equal(P.check(page('<p>It is a widget.</p>'), null, ['widget']).rules[4].why, 'trade words before any click: widget');
  // the bars are the edge: at the bar passes, just over fails
  const g = P.measure(plain).view.grade, a = P.measure(plain).all.grade, l = P.measure(plain).view.longShare;
  assert.equal(P.check(plain, { view: g }).rules[0].pass, true); assert.equal(P.check(plain, { view: g - 0.1 }).rules[0].pass, false);
  assert.equal(P.check(plain, { all: a }).rules[1].pass, true); assert.equal(P.check(plain, { all: a - 0.1 }).rules[1].pass, false);
  assert.equal(P.check(plain, { sentence: 8 }).rules[2].pass, true); assert.equal(P.check(plain, { sentence: 7 }).rules[2].pass, false);
  assert.equal(P.check(plain, { long: l }).rules[3].pass, true); assert.equal(P.check(plain, { long: l - 0.1 }).rules[3].pass, false);
  for (const odd of [null, undefined, 7, 'bars', []]) assert.equal(P.check(plain, odd).pass, true, String(odd));
});

test('what is not a page fails every rule, and nothing thrown at it breaks it', () => {
  for (const bad of [null, undefined, 7, {}, [], () => 1, '', 'plain words', '<p>no body</p>', '<body></body>']) {
    assert.doesNotThrow(() => P.check(bad)); const r = P.check(bad);
    assert.equal(r.pass, false); assert.deepEqual(r.rules.map((x) => x.pass), [false, false, false, false, false], String(bad));
    assert.deepEqual(r.rules.map((x) => x.why), ['no sentence to read before any click (at most 6)', 'no sentence to read for the whole page (at most 7)', 'the longest sentence before any click is 0 words (at most 25)', 'no word to read', 'no word to read']);
  }
  // labels with no sentence: there are words, so the word rules can pass, and the sentence rules still fail
  assert.deepEqual(P.check(page('<h1>Only a heading</h1>')).rules.map((x) => x.pass), [false, false, false, true, true]);
  assert.deepEqual(Object.keys(P.NAMES), ['P1', 'P2', 'P3', 'P4', 'P5']);
});
