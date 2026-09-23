# Independent review

## Phase one

Reviewer joined vehicle-text-parser on 2026-09-17 and read memory.md, PRD.md, buildplan.md and docs/research.md. At the phase-one freeze, production matching rules had not been inspected. Review expectations were based on the frozen PRD and original adversarial messages. Phase two subsequently inspected the runtime, raw snapshot/build scripts, authored/generated corpus oracles, dependency usage, package configuration, notices and CI.

The suite contains 41 labeled message fixtures and seven API/property checks. Initial freeze SHA-256: `622cfa2bde17c97d780b4f9c7413b7bd455b46e6b05d7bd9a8ce666756ed2b8e`. Exact original file is retained in `benchmarks/public/review-holdout.frozen.txt`. This freeze preceded every production-rule inspection and parser execution by this reviewer. Once disclosed for fixes these become regression cases. Their pass rate describes regression compliance.

Initial command: `node --import tsx --test --test-reporter=tap tests/review-holdout.test.ts`. Result: 47/48 passed, including a 1.08 MB message and one million-character token. The single failure was an oracle omission: `wranger` is one deletion from Ranger and one insertion from Wrangler. Main independently confirmed and approved adding Ranger/Ford alongside Wrangler/Jeep to this one expected candidate set. The source behavior was already correct. Original expectation and initial TAP output are retained; this adjustment is an explicit label adjudication.

`tests/review-regressions.test.ts` contains cases added after source inspection and disclosure, tracked separately from the original freeze. `tests/review-public.test.ts` checks diagnostic offset conversion, one-to-one span matching, and prediction-independent duplicate selection.

## Disposition

**APPROVED for local release readiness, 2026-09-17.** Both identified P2 defects are fixed and independently re-reviewed. All reviewer checks, full tests, source/corpus checks and installed-package checks passed. There are no unresolved launch-blocking findings within the reviewed scope. External publication, repository creation, pushes and credential inspection were outside this review and were not performed.

The reviewer loaded and followed `_oss-release` public-readiness and npm artifact guidance for local preparation. Production edits remained with the builder. Reviewer changes are confined to the assigned review tests/report, public diagnostic assets and evaluator.

Main subsequently reported its final `npm run check` and audit passed, including 278 tests, 99,813 corpus cases and package consumers. That coordinator run used Node 26.7.0. The reviewer directly verified the earlier package on Node 20.20.2 and Node 24.19.0, then verified the finalized root tarball on Node 20.20.2 and Node 26.7.0 without rebuilding or repacking it.

## Public diagnostic

AutoSpecNER is pinned to `fd168bc5baa096beceaf2ec36fbb6b5bc31821d1`. The implemented diagnostic preserves original accepted MODEL annotations, reports duplicate accounting, converts code-point offsets to UTF-16, and distinguishes exact from overlap metrics. UK advertisement scope and advertised-vehicle labeling differ from the package's US-derived catalog and general mention extraction contract.

Privacy review found contact data in the exact upstream file. Main approved preserving raw bytes locally with Git exclusion, publishing only provenance/license/fetch instructions and aggregate results. `benchmarks/public/README.md` records the bounded review and metric definitions. Verified source: 659 rows, 645 accepted, 643 unique texts across all rows, 629 unique accepted texts, 1,110 accepted MODEL spans, 16 duplicate accepted rows and 10 duplicate-text groups with differing annotations.

Final diagnostic results, with default fuzzy matching:

| Selection / span rule | Predicted / gold spans | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: |
| All 645 accepted rows, exact | 585 / 1,110 | 75.38% | 39.73% | 52.04% |
| All 645 accepted rows, overlap | 585 / 1,110 | 79.32% | 41.80% | 54.75% |
| First accepted row per exact text, exact | 564 / 1,090 | 75.18% | 38.90% | 51.27% |
| First accepted row per exact text, overlap | 564 / 1,090 | 79.26% | 41.01% | 54.05% |

The raw US source has folded surface matches for 556 gold spans, with exact recall 77.52%. The other 554 gold spans remain in the primary denominator. Their surfaces include Polo, Corsa, Clio and Qashqai, along with omitted family names and spelling/label variants. The unmapped bucket therefore exceeds proven unsupported-vehicle cases. Support and duplicate selection use source labels/text only. Overlap scoring uses maximum one-to-one matching. Same-span canonical alternatives collapse to one occurrence for span scoring. Per-record human/AI authorship is unavailable in the export. `benchmarks/public/results.json` preserves source/runtime hashes and complete aggregates. These measurements describe this diagnostic corpus.

## Findings

### R1, P2: trailing make from the next vehicle widens the preceding candidate

**Fixed and verified.** `findVehicles('Bentley Continental, Lincoln Continental.')` initially gave the first Continental both makes. The first fix resolved prefix syntax; follow-up `Continental Bentley, Continental Lincoln.` still assigned Bentley to both models through preceding context. The final `nearbyMake` separator checks and `groupFor` compatible-leading-make selection in `src/index.ts:136-163,201-208` fix both directions. Post-freeze regressions cover reversed orders, suffix makes, parenthesized makes and mixed syntax. These also pass against the installed ESM and CommonJS artifacts on Node 20 and 24.

### R2, P2: generic fuzzy matching edits short letter-code identities

**Fixed and verified.** `findVehicles('Mercedes-Benz D-Class needs PPF.')` initially emitted eight fuzzy Class models by changing the one-character identity code. The final `singleWordEdit` guard in `src/index.ts:224-236` keeps short components unchanged and bounds the correction to one sufficiently long source word. The D-Class regression now abstains while exact C-Class and Model Y matches remain. Installed ESM/CommonJS checks on Node 20 and 24 also verify the correction.

## Direct verification evidence

| Command / inspection | Observed result |
| --- | --- |
| `node --import tsx --test --test-reporter=tap tests/review*.test.ts` | 55/55 passed: 48 frozen/adjudicated checks, 4 disclosed regressions, 3 diagnostic-oracle checks. |
| `npm test` | 278/278 passed, including every one of the 1,459 pinned make/model pairs. |
| `npm run typecheck` and `npm run build` | Passed; ESM, CommonJS and both declaration entry points emitted. |
| `node --import tsx tests/corpus-evaluate.ts tests/fixtures/generated.jsonl benchmarks/public/.work/independent-corpus-report.json` | 99,813/99,813 passed; reviewer run completed in 4,495 ms. |
| `npm audit --json` | Zero reported vulnerabilities across all severities. |
| Independent Python CSV/checksum audit | All 37 source-file checksums/byte counts matched the manifest; 35 CSVs, 456,577 raw CSV bytes, 11,543 rows, 66 makes, 1,410 model strings and 1,459 pairs. |
| `npm run data:build`, with before/after SHA-256 | Byte-identical catalog: `a5d4adc91f991d1018be10d982dae12959401e546b00ce43ea6fbe96632b01aa`. |
| `python3 benchmarks/public/fetch.py` and `npm run evaluate:public` | Pinned public files verified; final diagnostic above reproduced. |
| `node --import tsx scripts/benchmark.ts` | Cold/warm, repeated/varied and dense long-input measurements recorded in `benchmarks/public/performance.jsonl`. |

Corpus-oracle inspection confirmed authored labels are literal reviewer-independent expectations. Catalog expectations derive from raw CSVs through a separate fixture implementation. Generated mutation collision checks enumerate independent edit neighborhoods. Expected outputs do not call production matching rules. Source coverage, generated stress, authored examples and the supplied real-message regression remain separately categorized.

## Packed artifact and consumers

The reviewer explicitly built before packing, then used:

```sh
npm pack --ignore-scripts --json --pack-destination benchmarks/public/.work
node benchmarks/public/check-installed.mjs
npm exec --yes --package=node@20 -- node benchmarks/public/check-installed.mjs
```

Earlier directly reviewed artifact: `benchmarks/public/.work/serbyte-vehicle-parser-0.1.0.tgz`, **89,996 bytes, 14 files**, SHA-256 **`898e9746c328b65a29982c4431a43d1b06d491f7e061c37a825fbd055435f8fd`**. This artifact passed under Node **20.20.2** and **24.19.0**; `installed-24.json` retains its historical hash. Fresh consumer directories are local and ignored. Tarball installation used offline mode, disabled lifecycle scripts and required zero production dependencies. Runtime assertions and strict NodeNext `.mts`/`.cts` type checks passed, macOS arm64.

The artifact contains ESM/CJS bundles, both declaration files, MIT package license, original vehicle-data CC BY 4.0 license/manifest/README, third-party attribution, and the bundled Damerau helper's original MIT license. File inspection excluded raw CSVs, tests, scripts, source directories, public/private corpora and local absolute user paths. Runtime source inspection confirmed static catalog-only indexes, bounded token windows and candidate searches, fresh outputs, and no user-input cache or network path.

After final metadata/copy edits, the retained root `serbyte-vehicle-parser-0.1.0.tgz` is **90,281 bytes, 14 files**, SHA-256 **`3b0b01e896614ae66c33ac68cc92a38d6d4e66ae14483aa18badaa571e599de4`**. The reviewer directly consumed this existing artifact, with no build or pack operation, using:

```sh
node benchmarks/public/check-installed.mjs ./serbyte-vehicle-parser-0.1.0.tgz
npm exec --yes --package=node@20 -- node benchmarks/public/check-installed.mjs ./serbyte-vehicle-parser-0.1.0.tgz
```

Both complete installed-package checks passed. The first command resolved Node **26.7.0** in the final shell environment; the second used Node **20.20.2**. `installed-26.json` and `installed-20.json` record this final hash. Main separately reported successful final Node **24.19.0** ESM/CommonJS and declaration checks against the same retained artifact. The previously reported coordinator hash `9891e7f96b5a826f844a1ae8964661b49c247b5fe6429f15dd1721b29068300d` was superseded by this final metadata revision.

## Performance and remaining limits

Reviewer environment: Apple M2, macOS arm64, Node 24.19.0, seed 730219. Five fresh-process imports measured 12.46-12.74 ms. Warm typical positive/negative medians were 0.025/0.024 ms over 1,000 repetitions. Repeated-negative medians at 10 KB, 100 KB and 1 MB were 0.801, 8.153 and 80.738 ms; varied contextual vocabulary measured 2.537, 25.283 and 262.377 ms. This observed scaling supports the bounded-work design. A 1 MB single token took 4.154 ms; a dense 999,999-byte input producing 76,923 mentions took 382.396 ms median. Long-case samples contain three repetitions. RSS after the complete benchmark was approximately 409 MB; this is a process snapshot, and token/result memory grows with input/output size. Measurements establish local observations without latency guarantees.

Remaining documented limitations are partial US catalog coverage, heuristic context decisions, unsupported global model names, possible false positives/misses in novel wording, deliberate conservative code fuzziness, and proportional long-input memory. The public diagnostic exposes catalog and annotation-scope gaps explicitly. Local review exercised macOS arm64; the configured Linux Node 20/22/24 CI matrix was inspected but was not executed by this reviewer. Synthetic/source-derived agreement does not establish broad automotive-lead accuracy. No remaining limitation identified here contradicts the documented v0.1 release boundary.
