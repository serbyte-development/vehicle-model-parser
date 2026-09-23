# Vehicle extraction corpus

## Run

```sh
npm run corpus:generate
npm run corpus:check
npx tsx --test tests/corpus.test.ts tests/corpus-properties.test.ts
```

The generator writes `tests/fixtures/generated.jsonl` and `tests/fixtures/generated-manifest.json`. The evaluator writes `tests/fixtures/corpus-report.json` and exits unsuccessfully when any case fails. Both scripts accept an optional JSONL path as their first argument; the evaluator accepts an optional report path as its second argument. The corresponding manifest stays beside the JSONL file.

The evaluator verifies the dataset pin, complete JSONL SHA256, unique generated texts and case IDs, the manifest's per-slice counts, the presence of every required slice, and at least 95,000 generated cases. An empty or partial input cannot pass the large-corpus gate.

## Provenance

| Slice | Source and interpretation |
| --- | --- |
| Original authored messages | 200 original synthetic cases, with text and labels prepared before the first parser execution. The pre-execution design inventory is in `corpus-plan.md`; executable fixtures are in `tests/fixtures/authored.ts`. |
| Collision regression | One additional synthetic regression, `x21`, records the independently verified Macan/Taycan spelling ambiguity found while auditing the mutation oracle. |
| Real message | Exactly one anonymized message excerpt supplied by the user. `real-4runner-001` expects Toyota / 4Runner and is reported separately. |
| Catalog pairs | Every one of the 1,459 distinct make/model pairs in the pinned raw CSV snapshot receives an explicit-make test. |
| Generated cases | 98,152 unique source-derived and composed synthetic cases, with precise counts and a reproducible hash in the generated manifest. |

The 201 synthetic fixtures contain 63 negative messages and 138 positive messages. The dedicated hard-negative category contains 55 of those negatives. No production Serbyte leads or private name-parser benchmarks were read. Public customer messages were not copied. The independent reviewer's public AutoSpecNER diagnostic has its own provenance and report.

The full evaluator runs 99,813 cases across these separate sources. Generated inventory:

| Generated group | Unique cases |
| --- | ---: |
| Canonical and five formatting forms | 72,940 |
| Embedded identifiers, URLs, emails, and composed hard negatives | 10,916 |
| Trailing make context and labeled forms | 2,918 |
| Repeated model occurrences | 1,459 |
| Multiple source vehicles | 5,836 |
| Phone, year, and price noise | 2,918 |
| Reconciled typo mutations | 1,165 |

Regeneration on 2026-09-17 produced identical bytes. JSONL SHA256: `eef757566227605eb5b8e9e7ed2b45e2007a61056b9f1c7c4fc0e9a1eb81697e`. The local checks ran on Node `v26.7.0`, `darwin/arm64`; runtime pass/fail measurements live in `tests/fixtures/corpus-report.json`.

Validation recorded on 2026-09-17: all 99,813 evaluated cases passed, with zero candidate false positives or false negatives across all 33 reported slices. The authored/source tests, seeded properties, long-input assertions, and TypeScript check also passed. The full evaluator took 4,744.9 ms in this local run. This result applies to the labeled corpus and source snapshot described here.

These fixtures measure the documented package contract. The suite is visible during development. It carries no hidden-holdout claim and provides no estimate of historical lead accuracy.

## Expected results

Each fixture stores an ID, category, provenance, original text, and expected model occurrences. Expected mentions contain the complete model string, sorted possible-make set, literal evidence, and original UTF-16 offsets. The authored fixture helper computes offsets from explicitly labeled evidence and an optional occurrence number. It never invokes the parser.

Repeated mentions remain separate. Exact source names retain full cab and model specificity. Generic curated families use the agreed family name, such as `F-150`, `Silverado`, `Sierra`, or `Tacoma`. The fixture never invents a cab or trim for a generic family mention.

Shared models retain complete possible-make sets. An explicit compatible make narrows the set. Contradictory makes preserve valid model associations, as in `Toyota Civic` retaining Honda. Same-make spelling alternatives also remain in the expected result: `Ranger Super Cab` and `Ranger SuperCab` can occupy the same source span. Such alternatives describe source-label ambiguity.

`findMakes` is checked against the sorted union of independently labeled model makes. Make-only inquiries have empty expected results. For each returned match, tests verify ordered occurrences, allowed match types, sorted unique makes, and `text.slice(start, end) === matchedText`.

The evaluator uses a multiset comparison on model, full make set, evidence, and span. This preserves repeated mentions and detects duplicate candidates. The comparison ignores the unspecified ordering among alternative canonical model labels at exactly the same span. Determinism is tested separately.

## Generated design

`tests/fixtures/source.ts` parses the original CSVs with `csv-parse/sync`. It checks the frozen pin and counts directly: 35 files, 11,543 rows, 66 makes, 1,410 model strings, and 1,459 make/model pairs. It imports no runtime code, generated `src/catalog.json`, production normalization, or curated matching rules.

Source pin: `79018e2dbcc03899bf3434d959b445644fb49b76` from `abhionlyone/us-car-models-data`. Source-derived data retains the upstream CC BY 4.0 attribution; see the project's third-party notice and vendored source license.

The independent source-label oracle applies the agreed NFKC, case, and separator equivalence to source model names, preserving every original label that collides. Explicit make context filters those alternatives to valid source associations. This tests implementation and coverage of the pinned catalog; it does not independently validate automotive facts or repair missing catalog entries.

The deterministic generator uses seed `20260917` and these dimensions:

- Ten service-message frames across canonical case, lowercase, uppercase, Unicode separators, fullwidth text, and varied internal whitespace.
- Callback/year/price noise, trailing make context, labeled make/model forms, repeated mentions, and four deterministic second-vehicle pairings for every source pair.
- Embedded booking identifiers, reserved-domain URLs and email addresses, and 55 authored hard negatives combined with 12 automotive openings and 10 service-message endings.
- A separately reported mutation slice with insertion, deletion, substitution, and adjacent-swap examples.

Duplicate complete texts are removed. A duplicate with conflicting expectations aborts generation. Case IDs derive from the text hash, so they survive changes in generation order. The large count represents combinations of explicit test dimensions; the independently authored scenario count remains separate.

## Typo collision policy

Mutation targets are alphabetic source model names of at least six letters. Proposed edits are checked against every exact normalized source spelling and every alphabetic source candidate of the same make, including shorter names. Candidate neighborhoods are enumerated independently; the generator imports no fuzzy matching dependency.

Exact-spelling collisions and ambiguous corrections are excluded from the unique-correction generated slice. Every exclusion records its make, source model, proposed text, reason, and competing labels in the manifest. The frozen run proposed 1,184 operations and excluded 10 unchanged exact spellings from equal-letter swaps plus 9 ambiguous source-label corrections. Authored fixtures cover retained ambiguity explicitly, including generic `wranger` and the Macan/Taycan collision.

Generated typo recall applies only to these filtered, explicitly make-qualified, single-word mutations. It says nothing about arbitrary misspellings, omitted makes, numeric edits, or everyday-word context. The human-authored typo category also contains exact valid-neighbor controls. The multi-edit spelling `corrola` is an explicitly approved alias, and remains available with fuzzy matching disabled.

### Oracle correction log

On 2026-09-17 the first large run exposed an incomplete generator neighbor universe. `tacan`, obtained by deleting `y` from the source name `Taycan`, is also one substitution from the source name `Macan`. The source files independently confirm that both belong to Porsche. The original neighbor scan considered only mutation-eligible names of at least six letters and missed the five-letter candidate.

The correction expands collision checking to all alphabetic source candidates. The ambiguous generated case is explicitly excluded and recorded in the manifest. Authored regression `x21` expects both `Macan` and `Taycan` at the same span. This correction follows the source spellings and edit operations. No parser output was copied into an expected-results snapshot.

## Reports and gates

The evaluator reports case agreement, positive/negative counts, false-positive and false-negative cases, candidate-level true positives/false positives/false negatives, make/span invariants, and precision/recall per provenance and category. Candidate-level scoring requires the full labeled model/make-set/span combination. A wrong make set counts as an incorrect candidate. A zero denominator is reported as `null`.

Every authored, real-message, catalog, and emitted generated case is a strict acceptance gate. Reports retain up to 20 failure examples per slice and count every failure. Corrections to labels or exclusions require a semantic explanation. Expected values are never regenerated from parser results.

For future held-out evaluation, keep shared templates, scenario rephrasings, source documents, and related typo families in the same split. Rephrasing a visible case cannot create an independent holdout. Record real-message collection permission and anonymization separately before adding customer text.

## Properties and performance

Seeded `fast-check` properties run 500 arbitrary-Unicode cases and 300 authored-case transformations. They check deterministic output, original offsets, input immutability, stable make unions, case variation, emoji/combining-mark prefix offsets, and punctuation. Focused assertions cover the fuzzy option and result mutation isolation.

Long-input tests use 10,000, 100,000, and 1,000,000 UTF-16 code units of negative text, followed by a terminal positive mention. They check complete scanning and source offsets without a wall-clock threshold. The package benchmark, owned by the builder, measures cold initialization and warm latency separately.

The evaluator's elapsed time includes fixture parsing, two API calls per case, assertions, source-oracle setup, and report preparation. It is an end-to-end test duration. Use the benchmark for isolated runtime performance claims.

Primary testing API references: <https://fast-check.dev/docs/core-blocks/arbitraries/primitives/string/> and <https://fast-check.dev/docs/core-blocks/runners/>. The installed package and lockfile determine the executable version.
