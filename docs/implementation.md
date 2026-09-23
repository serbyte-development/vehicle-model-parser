# Implementation handoff

Verified locally on 2026-09-23. Package: `vehicle-model-parser@0.1.0`.

## Deliverable

The standalone package implements the frozen PRD in this project. It exposes synchronous `findVehicles(text, options?)` and `findMakes(text, options?)` with original UTF-16 spans, repeated occurrences, sorted possible makes, preserved ambiguities, and exact/alias/fuzzy match types. It has zero production dependencies and ships ESM, CommonJS, and both declaration formats for Node.js 20 or later.

Final local archives:

```text
vehicle-model-parser-0.1.0.tgz
artifacts/vehicle-model-parser-0.1.0.tgz
```

Both contain the same 14-file package, **93,890 bytes**, SHA-256:

```text
4ace5d31b7a2b2a1f9f2450317cc015968938a8b91b040ecea189dbd4fc7a345
```

Main verified the final archives through an offline installation, ESM/CommonJS execution, and NodeNext declaration checks after the last README and artifact-retention changes. These archives remain local. External publication, remote repository creation, and changes to other projects were outside this work.

## Runtime design

`src/index.ts` builds catalog-only indexes once at module initialization: normalized exact keys, bounded prefixes, make spellings, and deletion signatures for fuzzy candidates. Each request retains original token offsets. The runtime uses source token boundaries and reviewed letter/digit transitions to accept formatting variants without matching inside arbitrary words. Equivalent catalog spellings share accepted formatting boundaries and preserve every source candidate.

Exact and formatting matches are selected before fuzzy matches. Longer specific models absorb overlapping shorter models. Family aliases establish only the family label. Every family-to-make association is verified against its documented source prefixes in `src/families.ts` during data generation.

Local make evidence supports leading makes, optional years, labeled make/model fields, and trailing parenthetical makes. Compatible leading make evidence takes precedence. Commas and clause punctuation separate vehicle contexts. A contradictory make never introduces an invalid catalog association.

Common words and short identifiers use local vehicle syntax from `src/rules.ts`; pure numeric models require a compatible nearby make. URL/email-containing chunks are suppressed. A dotted source spelling such as `ID.Buzz` requires compatible local make evidence to distinguish it from a bare domain. Case, Unicode compatibility forms, combining marks, whitespace, and supported punctuation are normalized while output spans address the unchanged input.

Generic fuzzy matching uses the verified `levenshtein-lte1@1.0.1` Damerau helper. Native ESM uses `levenshtein-lte1/damerau.js`; tsup bundles the helper for both runtime formats. It returns 0, 1, or Infinity and supports adjacent swaps. A seeded independent dynamic-programming oracle checks its one-edit behavior.

Fuzzy candidates have alphabetic compact keys of 5 through 32 characters and at most three source words. Exactly one word may change, with both versions at least five characters long. Every short component stays unchanged, protecting composite identities such as `A-Class`. Numeric identities receive no typo corrections. Candidate ties remain visible. The reviewed two-edit spelling exception `corrola` maps to `Corolla` with `matchType: 'alias'`; this exception remains active with `fuzzy: false`. The general algorithm retains its one-edit bound.

No request text is cached across calls. There is no runtime network access, truncation, or catalog scan per input token. Work per token is bounded by the fixed catalog, maximum token window, and fixed fuzzy word-length limits. Request memory scales with tokens and returned occurrences. Returned objects and make arrays are isolated from subsequent calls.

## Source snapshot and reproducibility

Original data: Abhilash Reddy (abhionlyone) and contributors, `us-car-models-data`, pinned to:

```text
79018e2dbcc03899bf3434d959b445644fb49b76
```

The 35 original annual CSVs, original README, and original license are preserved byte-for-byte under `data/source/`. The manifest records provenance, file lengths, SHA-256 checksums, transformations, and expected totals. Independently verified build totals:

| Measurement | Value |
| --- | ---: |
| Annual CSVs | 35 |
| Source records | 11,543 |
| Distinct makes | 66 |
| Distinct source model strings | 1,410 |
| Make/model pairs | 1,459 |
| 2025 records | 28 |
| 2026 records | 3 |
| Curated family labels | 19 |

`scripts/build-data.ts` uses `csv-parse/sync@7.0.2`. It verifies checksums and lengths, the exact annual file set, the `year,make,model,body_styles` schema, filename/year agreement, required names, JSON body-style arrays, unique year/make/model triples, fixed totals, and family associations. The generated `src/catalog.json` contains `schemaVersion`, `source`, `models: [{model,makes}]`, and `families: [{model,makes,aliases}]`.

Repeated offline builds produced identical catalog SHA-256:

```text
a5d4adc91f991d1018be10d982dae12959401e546b00ce43ea6fbe96632b01aa
```

`npm run data:refresh` is a separate explicit maintainer network action. It fetches the immutable revision and checks the recorded checksums. Normal installation, tests, and builds operate on committed data. A future data-pin change requires review of checksums, expected totals, naming changes, and collisions.

## Commands and observed verification

```sh
npm ci
npm run check
npm run bench
npm audit
```

`check` regenerates and verifies the catalog, builds both formats, typechecks the project, runs all tests, generates/evaluates the corpus, and smoke-tests a locally packed package. Individual commands remain available: `test:runtime`, `typecheck`, `build`, `corpus:generate`, `corpus:check`, and `package:check`.

| Gate | Observed result |
| --- | --- |
| Complete test suite | 279/279 passed |
| Independent reviewer checks | 55/55 passed |
| Independent corpus evaluation | 99,813/99,813 cases passed across 33 slices |
| Labeled corpus false positives / false negatives | 0 / 0 |
| Source-pair coverage | All 1,459 pairs passed |
| Typecheck and dual build | Passed |
| Offline local tarball installation | Passed with lifecycle scripts disabled |
| Installed ESM/CommonJS and NodeNext declarations | Passed |
| Dependency audit | 0 reported vulnerabilities |
| Independent release review | Approved; no unresolved launch-blocking findings in reviewed scope |

The corpus comprises **201 independently authored synthetic cases**, **one anonymized user-provided real message**, **1,459 source-pair cases**, and **98,152 unique deterministic generated cases**. Corpus labels were owned independently and were never modified by the builder. The generated JSONL SHA-256 is:

```text
eef757566227605eb5b8e9e7ed2b45e2007a61056b9f1c7c4fc0e9a1eb81697e
```

`docs/corpus.md` and `tests/fixtures/corpus-report.json` preserve the detailed breakdown. Seeded runtime properties additionally check Unicode offsets, determinism, sorted makes, mutation isolation, and the reused distance helper. Long-input tests verify matches at the end of inputs exceeding one megabyte.

The reviewer independently verified installed consumers on **Node 20.20.2** and **Node 24.19.0**. Main reran the complete check pipeline and subsequently verified the final packaging-only changes on Node 24.19.0. CI is configured for Node 20, 22, and 24 using `npm ci`, `npm run check`, and `npm audit`; remote CI execution was outside this local task.

Two concrete review findings were fixed and independently rechecked: make evidence crossing comma-separated vehicle mentions, and fuzzy changes to short letter-code components. The reviewer also documented a label correction that preserves the genuine Ranger/Wrangler tie for `wranger`; the original frozen expectation remains recorded. See `docs/review.md` for disposition and scope.

## Performance measurements

Builder measurement: Apple M2, macOS arm64, Node **24.19.0**, seed **730219**, built ESM runtime. Input construction is excluded from timed sections. The script generates varied vocabulary independently of the parser and performs no input caching.

Five fresh-process module imports measured **12.377, 12.542, 12.518, 12.503, and 12.458 milliseconds**. Warm measurements:

| Input | Bytes | Repetitions | Median ms | p95 ms |
| --- | ---: | ---: | ---: | ---: |
| Typical positive, two mentions | 91 | 1,000 | 0.024 | 0.045 |
| Typical negative | 87 | 1,000 | 0.023 | 0.042 |
| Repeated negative | 10,000 | 10 | 0.758 | 0.892 |
| Varied vocabulary with local vehicle context | 10,000 | 10 | 2.592 | 2.747 |
| Repeated negative | 100,000 | 10 | 8.146 | 11.501 |
| Varied vocabulary with local vehicle context | 100,000 | 10 | 25.550 | 26.780 |
| Repeated negative | 1,000,000 | 3 | 83.213 | 95.659 |
| Varied vocabulary with local vehicle context | 1,000,000 | 3 | 265.198 | 265.325 |
| One arbitrary token | 1,000,000 | 3 | 4.256 | 4.260 |
| Dense positive, 76,923 occurrences | 999,999 | 3 | 359.582 | 368.756 |

The growth observed across these sizes was approximately proportional to input size. Three-repeat p95 values represent the largest observation in that small sample. These local measurements establish no latency guarantee. The final whole-benchmark process snapshot reported RSS 465,747,968 bytes and heap used 145,346,688 bytes after the dense-output workload; it does not isolate per-request or peak memory. `npm run bench` prints machine details, timings, and memory. The reviewer retains an independent run under `benchmarks/public/performance.jsonl`.

## Packaging and licenses

The package allowlist includes runtime bundles/declarations, README, MIT code license, third-party notices, the original data license and provenance manifest, and the bundled Damerau helper's original MIT license. Raw CSVs, tests, generated corpora, and public benchmark advertisements remain outside the tarball. The smoke script asserts required notices and rejects source/test/benchmark directories or CSV payloads.

Vehicle data retains **CC BY 4.0**. `THIRD_PARTY_NOTICES.md` credits the author and repository, pins the revision, links the license, and describes deduplication, field removal, normalization, and curated families. Code is MIT. The distance helper is bundled with its MIT notice; it requires no production installation. Build-time CSV and testing tools remain dev dependencies. An esbuild override to 0.28.2 resolves the audit finding encountered during initial setup.

## Scope and remaining limitations

The source's observed year range is 1992 through 2026, with sparse recent files. It supplies no guarantee of complete model-year, international-market, trim, motorcycle, or historical coverage. Family aliases cover the 19 reviewed families only. Generic fuzzy matching preserves code identities and strict source word partitions; some compounded formatting-plus-typo inputs will abstain. Common-word rules remain explicit language heuristics and can miss or misinterpret unseen wording. Results express catalog-supported mention evidence and establish no ownership or model-year validity.

Synthetic and authored regression success must remain separate from external-corpus agreement. The independently implemented AutoSpecNER diagnostic retains the original accepted UK advertisement MODEL annotations. On 645 accepted records and 1,110 gold spans, this runtime produced 585 distinct predicted spans: exact precision **75.38%**, recall **39.73%**, F1 **52.04%**; overlap F1 **54.75%**. Those results include catalog-scope differences, annotation-policy differences, and extraction errors. They measure span agreement and supply no US lead-accuracy estimate or canonical make/model score.

Public diagnostic methods and aggregate results are in `benchmarks/public/README.md` and `benchmarks/public/results.json`. Raw advertisements contain contact data and are retained locally with Git exclusion; they are excluded from the package. Fetching that optional corpus is an explicit developer action. No production leads or private benchmarks were accessed.
