# Vehicle text parser research

Verified 2026-09-17. Research precedes production implementation. Sources are linked below; measured catalog facts come from parsing every CSV at the specified commit. No production leads were accessed. Sibling `../first-name-parser` was inspected read-only.

## Recommendation

Build a synchronous, offline TypeScript package around the selected catalog, an explicit alias table, token-window exact matching, and contextual one-edit matching. Reuse `levenshtein-lte1/damerau` for insertions, deletions, substitutions, and adjacent transpositions. Use `csv-parse/sync` during data generation and `fast-check` during testing. Keep the runtime independent of network services, NLP frameworks, learned models, and confidence scores.

The main engineering work is deciding when a string denotes a vehicle and preserving ambiguity. A lookup table supplies candidates; contextual rules determine whether a mention should be emitted. Catalog integrity and real-message extraction require separate tests.

## Selected dataset: verified facts

Repository: [abhionlyone/us-car-models-data](https://github.com/abhionlyone/us-car-models-data).

Pin: [`79018e2dbcc03899bf3434d959b445644fb49b76`](https://github.com/abhionlyone/us-car-models-data/tree/79018e2dbcc03899bf3434d959b445644fb49b76), committed 2025-11-21. The default branch is `master`. The root contains 35 annual CSV files, `1992.csv` through `2026.csv`, plus README, LICENSE, and `.gitignore`. There is no consolidated JSON file or trim table.

| Measurement | Observed |
| --- | ---: |
| CSV data records, excluding headers | 11,543 |
| Distinct year/make/model triples | 11,543 |
| Distinct makes | 66 |
| Distinct model strings, case-sensitive | 1,410 |
| Distinct make/model pairs, case-sensitive | 1,459 |
| Total raw CSV bytes | 456,577 |
| Empty `body_styles` fields | 474 |
| Invalid JSON in nonempty `body_styles` | 0 |
| 2024 / 2025 / 2026 records | 443 / 28 / 3 |

Schema is exactly `year,make,model,body_styles`. For example:

```csv
year,make,model,body_styles
1992,Acura,Integra,"[""Sedan"", ""Hatchback""]"
2026,Cadillac,Vistiq,""
```

Parse CSV quoting first, then JSON-decode a nonempty `body_styles` value. Its eight observed labels are Sedan, Hatchback, Coupe, Convertible, Wagon, Pickup, Van/Minivan, and SUV. Fields such as trim, aliases, manufacturer IDs, verification status, and vehicle ownership are absent.

The [pinned README](https://github.com/abhionlyone/us-car-models-data/blob/79018e2dbcc03899bf3434d959b445644fb49b76/README.md) announces that free updates have stopped. Its headline count exceeds the measured records. The [2026 file](https://github.com/abhionlyone/us-car-models-data/blob/79018e2dbcc03899bf3434d959b445644fb49b76/2026.csv) contains only Cadillac Vistiq, Fisker Pear, and Fisker Ronin. Treat year bounds as the catalog's observed labels. Coverage of an entire model year, actual production, global markets, motorcycles, and pre-1992 vehicles requires separate evidence. Match a known model mentioned with a newer year without requiring that year to exist in this sparse catalog.

### Naming and collisions

Source model names mix families, configurations, and special variants. Preserve the source spelling and add curated family aliases separately:

| Source examples | Consequence |
| --- | --- |
| `F150 Regular Cab`, `F150 SuperCrew Cab`, `F150 Lightning` | Add reviewed `F-150`/`F150` family aliases; retain Lightning specificity. |
| `Silverado 1500 Crew Cab`, `Silverado 2500 HD Double Cab`, `Silverado EV` | `Silverado` is useful family evidence. It cannot establish cab, capacity series, or powertrain. |
| `Civic`, `Civic Type R`; `Mustang`, `Mustang MACH-E` | Longest valid specific match wins within one overlapping span. Preserve separate adjacent vehicles. |
| `Cherokee`, `Grand Cherokee`, `Grand Cherokee L`, `Grand Cherokee 4xe` | Prefix/suffix deletion would collapse meaningful distinctions. |
| `Range Rover`, `Range Rover Sport`, `Range Rover Evoque`, `Range Rover Velar` | Retain the full matched model. |
| `Ranger Super Cab`/`Ranger SuperCab`, `TrailBlazer`/`Trailblazer`, `XL-7`/`XL7` | Formatting normalization needs deterministic canonical labels and preserved provenance. |

Actual cross-make collisions include `Continental` → Bentley/Lincoln; `LS` → Lexus/Lincoln; `NX` → Lexus/Nissan; `Neon` → Dodge/Plymouth; `Viper` → Dodge/SRT; `Voyager` → Chrysler/Plymouth; `Coupe` → MINI/Maserati; `Regular Cab` → Isuzu/Nissan/Toyota; and `Sprinter 2500 Cargo` → Dodge/Freightliner/Mercedes-Benz. Space/punctuation folding adds FIAT `500e` versus Mercedes-Benz `500 E`. Every normalized key must accumulate all candidates. Overwriting or taking the first record loses real ambiguity.

Make spelling includes `FIAT`, `INFINITI`, `MAZDA`, `MINI`, `HUMMER`, `BMW`, `GMC`, `SRT`, and `smart`. A presentation override is a documented transformation. Historical Dodge/Ram and HUMMER/GMC associations need explicit rules; corporate relationships alone do not justify merging catalog makes.

Source trims are incomplete. Recognize `Civic Type R` because it is present; treat nearby `EX`, `SE`, `Limited`, `Sport`, `TRD`, and `GT` as contextual text unless a reviewed entry establishes a model. Avoid generic suffix stripping and automatic aliases for every prefix.

### Reproducible build

Commit the 35 original CSVs and source LICENSE under a vendor/data directory, together with a manifest containing repository, commit, paths, SHA-256 of each exact file, row counts, schema, and retrieval date. The measured SHA-256 of `1992.csv` is `95e51262a5f957730692477a83a66b2ab7abdea09c452a41c2404d90e372505f`. Resolve raw files through the immutable commit URL.

Use pinned `csv-parse` with `parse(csv, { columns: true, bom: true, skip_empty_lines: true })`, followed by explicit header/year/field validation. Fail on unknown schema, invalid JSON, duplicate triples, missing annual files, or checksum changes. Generate deterministic sorted model/make entries and keep raw-source identifiers for audit. Version the normalization and alias policy. A data-change review should show added/removed entries and newly introduced collisions. Normal `npm ci`, tests, and builds operate on committed inputs without downloading live data. Regeneration must produce byte-identical output, with retrieval timestamps confined to the source manifest. Publish the compact generated catalog and all applicable notices; exclude raw corpora and research fixtures from the npm tarball.

## Reusable packages and existing projects

Versions and publication dates below were checked against the npm registry on 2026-09-17. These are observations about release cadence. Local compatibility and benchmark tests remain necessary.

| Project | Actual API, license, maintenance | Decision |
| --- | --- | --- |
| [levenshtein-lte1](https://github.com/Yomguithereal/levenshtein-lte1), [registry](https://registry.npmjs.org/levenshtein-lte1) | `1.0.1`, 2020-01-07, MIT, zero dependencies. `require('levenshtein-lte1/damerau')(a,b)` returns `0`, `1`, or `Infinity`. Published `damerau.d.ts` supplies a default export. Source performs early length rejection and linear comparison with adjacent-swap handling. | Best small v1 fit for one-edit policy. Pin it and test ESM/CJS interoperability; native Node ESM subpath use may require `/damerau.js`. |
| [fastest-levenshtein](https://github.com/ka-weihe/fastest-levenshtein), [registry](https://registry.npmjs.org/fastest-levenshtein) | `1.0.16`, 2022-08-02, MIT, zero dependencies, bundled TS declarations. `distance(a,b): number`; `closest(s, strings): string`. | Good alternative when multi-edit distance is required. Adjacent swaps cost two edits. Avoid `closest` for extraction because it forces one candidate without an abstention rule. |
| [fast-fuzzy](https://github.com/EthanRutherford/fast-fuzzy), [registry](https://registry.npmjs.org/fast-fuzzy) | `1.12.0`, 2022-11-05, ISC, depends on `graphemesplit`. `new Searcher(candidates, options).search(term)`. Defaults include substring matching, punctuation removal, Damerau distance, and threshold `0.6`; results rank by score. | Useful reference for trie pruning. Its default search behavior requires substantial extraction-specific constraints. Skip for v1. |
| [ahocorasick](https://github.com/BrunoRB/ahocorasick), [registry](https://registry.npmjs.org/ahocorasick) | `1.0.2`, 2018-11-12, MIT, zero dependencies. `new AhoCorasick(keywords).search(text)` returns `[inclusiveEndIndex, matchedKeywords[]]`. | Reuse if profiling shows a need for multi-pattern scanning. Boundaries, normalization offsets, context, and overlap selection still belong to this package. A bounded token-window Map is the simpler initial implementation. |
| [csv-parse](https://csv.js.org/parse/api/sync/), [registry](https://registry.npmjs.org/csv-parse) | `7.0.2`, 2026-08-02, MIT. `import { parse } from 'csv-parse/sync'`. TS declarations and ESM/CJS exports. | Build-only dependency. Reuse its CSV grammar. |
| [fast-check](https://fast-check.dev/), [registry](https://registry.npmjs.org/fast-check) | `4.10.1`, 2026-09-15, MIT; depends on `pure-rand`. `fc.assert(fc.property(arbitrary, predicate), { seed, numRuns })`; failures provide reproducible seed/path and shrinking. | Dev-only dependency, used with Node's test runner. |
| [car-names](https://github.com/palashmon/car-names), [published README](https://unpkg.com/car-names@1.11.28/README.md) | `1.11.28`, 2025-12-01, MIT. Exposes `.all` and `.random()`; depends on `unique-random-array`; package requires Node ≥20.19.3. | A name list/randomizer supplies no vehicle-span extraction or contextual ambiguity policy. Keep the selected catalog. |
| [car-models](https://www.npmjs.com/package/car-models), [published README](https://unpkg.com/car-models@1.0.1/readme.md) | `1.0.1`, 2018-03-20, registry license GPL-2.0. `.all()` and `.random()`; README attributes Wikipedia as data source. | Adds licensing/provenance work and no extractor. Skip. |

Searches of npm, GitHub, and automotive NER research did not identify a verified drop-in package meeting this offline, ambiguity-preserving lead-text contract. This is a bounded search result. VIN decoders and vehicle lookup APIs solve adjacent problems. The implementation should reuse the small matching/testing primitives above.

Sibling conventions worth keeping: named TypeScript exports, ESM and CommonJS builds with `tsup`, declarations, `tsx --test test/*.test.ts`, separate typecheck/build commands, explicit scope/limitations, and public benchmark methodology. Preserve this project's no-confidence-score requirement independently of the sibling API. Avoid a framework or factory around the default static catalog.

## Minimal architecture and public contract

Proposed public surface, subject to main's final contract:

```ts
export interface VehicleCandidate {
  model: string;
  makes: readonly string[];
}

export interface VehicleMention {
  text: string;
  start: number;
  end: number;
  match: 'exact' | 'alias' | 'fuzzy';
  candidates: readonly VehicleCandidate[];
}

export function extractVehicles(
  text: string,
  options?: { fuzzy?: boolean },
): readonly VehicleMention[];

export function getMakesForModel(model: string): readonly string[];
```

`start`/`end` are original JavaScript UTF-16 offsets with an exclusive end; `text === input.slice(start, end)`. Return every separate mention in source order and `[]` for no match. Candidate arrays retain both source spellings in normalization collisions. Exact model lookup can return makes for `Fit` while free-text extraction rejects `fit` used as a verb. A family alias may return the reviewed family label, such as `F-150`, with its makes; it must not select an unmentioned cab or trim. The `match` value describes the transformation applied and carries no confidence interpretation.

Implementation can fit in generated data, one alias/policy table, normalization/tokenization, and extraction modules. Tokenize while retaining original offsets; normalize token values, then inspect windows bounded by the longest supported alias. Permit reviewed whitespace/hyphen variants, case folding, and letter/digit variants such as `4 runner`, `4-runner`, and `4runner`. Treat punctuation as a meaningful boundary before applying approved folding; joining across sentences, URLs, or arbitrary words creates false mentions. Unicode normalization can change length, so original offsets must survive the transformation.

Use local compatible make evidence to narrow ambiguous candidates, with a small fixed neighborhood and sentence boundaries. Other vehicles in the message must remain independent. Conflicting brand text must not silently relabel a known model. Match specificity and original span ordering decide overlaps; exact candidates outrank fuzzy candidates at the same span. Model detection remains independent of ownership, interest, negation, and trade-in intent.

For fuzzy matching, start with one Damerau edit on bounded, unclaimed words/windows with normalized alphabetic length ≥5. Exclude numeric-only models, short letter/number codes, URLs, emails, phone/VIN-like identifiers, and generic vehicle words from fuzzy correction. Preserve every admissible tie. Require stronger local evidence for common words and aliases. Evaluate typo aliases and general edits separately; `corrola`, `camery`, and `corolla` are useful controlled cases. Hard-negative tests must cover edits that produce an existing common word or another valid model. Thresholds are proposed policy, requiring measurements before expansion.

Common-word models include Fit, Focus, Edge, Escape, Pilot, Soul, Air, Golf, Journey, and Compass. A global automotive context flag is too broad: `my Camry needs an air filter` should not add Lucid Air. `Ford` elsewhere in a signature should not legitimize ordinary `focus`. Pure numbers (`2`, `500`, `911`) and identifiers (`IS`, `M`, `A4`, `Q3`) need explicit model/make or narrowly vehicle-specific syntax. Distinctive `4runner` supports the supplied example directly.

## Public corpora and privacy

### AutoSpecNER: strongest directly relevant reusable corpus

[Paper, 2026-06-23](https://arxiv.org/html/2606.24387v1); [repository](https://github.com/FilipposVentirozos/AutoSpecNER); [data license](https://github.com/FilipposVentirozos/AutoSpecNER/blob/fd168bc5baa096beceaf2ec36fbb6b5bc31821d1/LICENSE). The repository explicitly licenses data CC-BY-4.0. Verified commit: [`fd168bc5baa096beceaf2ec36fbb6b5bc31821d1`](https://github.com/FilipposVentirozos/AutoSpecNER/tree/fd168bc5baa096beceaf2ec36fbb6b5bc31821d1), dated 2026-06-24. Record an exact data-file checksum when importing.

The README documents `vehicle_ner/vehicle_ner.jsonl`: 659 advertisements, including 645 accepted, 13 rejected, and one ignored annotation verdict. Parsing the pinned JSONL independently confirmed 659 records and 645 accepted records, with **643 distinct full texts** and **five documents containing non-BMP characters**. Deduplicate by normalized source text before splitting, and test offset conversion explicitly. Canonical entities have `{start,end,label}`; end is exclusive. There are 15 labels including MAKE, MODEL, TRIM, and YEAR. Three IAA files contain independent annotations of the same 100 documents; those are repeated annotation views, so deduplicate/group by source document.

This is UK advertisement text from one platform, with both human and AI-generated content. It supplies real automotive span examples, but its label policy targets the advertised vehicle and excludes some ancillary mentions. This package targets mentions generally, requiring a documented label adaptation or separate strict comparison. Report human and generated subsets separately only when reliable provenance permits that split. A usable test import should select accepted documents, preserve upstream labels/provenance, reconcile catalog coverage, and distinguish unsupported UK models from extraction errors. Convert upstream character offsets to JavaScript UTF-16 offsets after checking non-BMP text. The authors report a PII review; inspect any redistributed subset again.

### UCI SMS Spam Collection: realistic background language

[Dataset and license](https://archive.ics.uci.edu/dataset/228/sms%2Bspam%2Bcollection), DOI `10.24432/C5CC84`, credited to Almeida and Hidalgo. The UCI page specifies CC-BY-4.0. SMS supplies abbreviations, punctuation noise, common-word collisions, and contact-like text. Its spam/ham labels do not establish vehicle-span truth. Independently label selected messages and treat raw corpus runs as diagnostics until reviewed. Keep source indices and download checksum; redact phone numbers, names, addresses, and URLs before publishing excerpts, recording those edits.

### NHTSA complaints: useful optional follow-up source

[Official API/download documentation](https://www.nhtsa.gov/nhtsa-datasets-and-apis), [text data dictionary](https://static.nhtsa.gov/odi/ffdd/cmpl/CMPL.txt). Public endpoints include `complaints/complaintsByVehicle?make=acura&model=rdx&modelYear=2012` and retrieval by ODI number. These offer noisy consumer descriptions and associated vehicle metadata. Metadata is separate from a mention: a complaint can omit its model or discuss another vehicle. Group related records by ODI identifier, vehicle/report identity, and near-duplicate text.

The inspected documentation establishes public access and privacy handling; it does not establish a specific redistribution license for every consumer-authored narrative. Treat narrative republication permission as unresolved. Prefer licensed AutoSpecNER and independently authored messages for the initial committed corpus. Any later complaint import requires an explicit rights basis and a privacy review. Skip unlicensed scraped dealership, forum, Reddit, or marketplace text and Kaggle mirrors whose original rights remain unclear.

## Corpus and evaluation design

Maintain three distinct suites: exhaustive catalog integrity, generated behavioral stress, and independently labeled messages. Thousands of catalog-derived fixtures demonstrate transformation coverage; they do not estimate real-message accuracy.

For initial implementation, cover every make/model pair using explicit make-qualified text, every approved alias, every known collision, and all overlap families. For model-only positives, use the actual contextual policy. Avoid declaring every bare catalog entry a positive. Generate fixed-seed combinations of casing, whitespace, dashes, apostrophes, emoji, adjacent numbers, years, multiple vehicles, negation, interests, and typo operators. Store the generator version, template family, seed, mutation, source entry, and expected spans/candidates.

Start the independently authored suite with several hundred cases across positive, hard-negative, ambiguity, and typo buckets. Keep their authors independent of implementation rule changes. Add a separately reported adapted AutoSpecNER subset with explicit rights/provenance and label review. Maintain an untouched held-out slice. Split by original message/document, template family, and mutation parent before generating variants; all variants and paraphrases of one case stay together. For generalization checks, hold out entire model/family and typo-operation combinations from rule tuning. Public benchmark cases used to repair code become regressions and leave the untouched accuracy estimate.

High-value negatives include `this should fit`, `focus on price`, `my soul hurts`, `air filter`, `golf clubs`, `a journey home`, `A4 paper`, `Q3 report`, `call 911`, `500 dollars`, `2 months`, `VIN ends in ...`, URL paths, email usernames, and dealer signatures. Include those phrases inside otherwise automotive messages. Pair minimal positives such as `Honda Fit`, `Ford Focus`, and `Audi A4` with the negatives. Add boundary traps, stale/unsupported models, shared aliases, two competing models, and make mentions across clause boundaries. Mine false positives from licensed background text, then label and freeze regressions.

Use fast-check to test determinism, nonempty valid spans, `input.slice(start,end)` equality, stable candidate ordering, deduplication, normalization equivalence within supported policies, and results isolated from caller mutation. Use `fc.string({unit:'grapheme'})` and `fc.string({unit:'binary'})` for Unicode coverage; the default `fc.string()` is printable ASCII in the inspected API. Record seed/path for every failure. An independently written simple dynamic-programming distance oracle can validate the reused one-edit helper on bounded strings. Avoid an oracle that imports the extractor's normalization/context rules.

Report span precision/recall, exact candidate-set accuracy, false-positive messages per 1,000 negative messages, abstention/missed mentions, and per-bucket counts. Candidate-set metrics must penalize extra makes as well as missing makes. Separate exact, alias, and fuzzy performance; separate in-catalog from unsupported-model outcomes; separate synthetic from independently labeled results. State sample size and uncertainty. Benchmark cold initialization, warmed latency percentiles, memory, bundle size, and adversarial long text with fixed Node version, hardware, input distribution, and seed. Establish limits through measurements and explicit input semantics.

## Licensing and release requirements

The selected dataset's [pinned LICENSE](https://github.com/abhionlyone/us-car-models-data/blob/79018e2dbcc03899bf3434d959b445644fb49b76/LICENSE) is **CC-BY-4.0**. The [Creative Commons terms](https://creativecommons.org/licenses/by/4.0/) require appropriate credit, a license link/text, and an indication of changes, while retaining supplied notices and avoiding implied endorsement. Attribute Abhilash Reddy and the source repository; identify the commit and describe normalization, deduplication, and alias additions. Carry attribution alongside the generated/bundled catalog in the published package. Source LICENSE plus `THIRD_PARTY_NOTICES.md` should be explicitly verified in `npm pack --dry-run` output.

Keep code licensing and embedded dataset licensing clearly scoped in README and package metadata. A code MIT license does not remove CC-BY obligations from the bundled catalog. Preserve MIT/ISC/BSD notices for any bundled library code according to the chosen dependency. AutoSpecNER and UCI excerpts require separate attribution and change notices, even when test-only. Keep public test data out of the runtime bundle and exclude private/provenance-sensitive materials from publication. CC-BY does not grant trademark rights or resolve every privacy/publicity right. These are release requirements derived from the cited licenses; unusual downstream redistribution arrangements warrant legal review.

## This is how I would do it

Ship the pinned catalog with honest measured coverage and attribution. Build a direct token-window extractor with reviewed family aliases, original offsets, preserved candidate sets, and narrow contextual rules. Reuse one small Damerau-distance dependency and the sibling build/test tooling. Establish a substantial original hard-negative corpus and a separately labeled AutoSpecNER evaluation. Expand fuzzy policy only when those independent tests show a useful recall gain and controlled false positives.
