**Live: https://sjgant80-hub.github.io/house-standard/**

# The house standard

The one starting point for every repository here. A page leads with numbers it can prove, keeps its limits one click
away, and is never a wall of text.

| | |
| --- | --- |
| **7** | rules a built page is held to, by code (`src/standard.mjs`) |
| **5** | parts every page is built from: crystal hero, receipts, stack, glass, honest expander |
| **0** | numbers typed by hand on the front door: each is read from the page that proves it |
| **68 / 68** | planted bugs caught in this repository's own kernels ([the record](data/gates.json)) |

## Use it

```
node scripts/new.mjs <name>          # a new build, opening like the showcase and carrying the organ
node scripts/check.mjs <index.html>  # hold any built page to the standard
```

## What is in here

| Where | What |
| --- | --- |
| `kit/house.css` | the token sheet and the five components |
| `kit/crystal.js` | the hero: a 32-faced crystal ray-traced in one shader, each face bound to a receipt |
| `kit/house.js` | the motion: rising in, numbers running up, light under the pointer |
| `src/standard.mjs` | the ship gate: seven rules, one verdict |
| `src/receipts.mjs`, `src/flagship.mjs` | read each flagship's sealed numbers from its own page |
| `scaffold/` | what a new build starts from: page, kit, genome cell, seal, gate, CI, page test |

<details><summary>The seven rules</summary>

| | Rule | A page passes when |
| --- | --- | --- |
| H1 | The kit | it has the crystal hero, receipts, a stack, a glass with something to press, an honest expander |
| H2 | The law of the page | no paragraph over 45 words greets a visitor, and the default view is at most 1,250 words |
| H3 | Receipts | every receipt carries its source one click away, or says it is still sealing |
| H4 | Nothing unfinished | no placeholder is on the page |
| H5 | The fail-wall | at least three limits sit behind a click, and a failure or unfinished part is shown as one |
| H6 | One identity | the committed-dark tokens and the three faces |
| H7 | House rules | the credit line, no price, no private shorthand |

The gate cannot tell whether a number is true. That is what each build's own seal, mutation gate and records are for.
It tells whether the page is built the way the standard requires.

</details>

<details><summary>The organ every repository carries</summary>

A birth check in CI (the estate genome). Claims registered before any run. A hash seal over everything that can change
a result. A clean mutation gate on every kernel. Every published number re-derived in the browser, with no model.
Failures kept on the page, in red. Inputs verified and recorded; a hash that does not match is stopped and written down.

</details>

<details><summary>Where each flagship stands</summary>

The live page holds each flagship's page to the standard in your browser, and shows the result. A page that fails stays
on that wall, in red, until it is rebuilt. The rest of the estate is brought over in order of what is public-facing.

</details>

MIT licence (holder Simon Gant). Built by Kar. Supplied by [AI Native Solutions](https://www.ai-nativesolutions.com).

Powered by the Konomi architecture, created by Thomas Frumkin.
