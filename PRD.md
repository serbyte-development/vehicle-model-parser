# Vehicle Parser v0.1

## Outcome
Ship a standalone npm package that extracts vehicle model mentions and their possible makes from ordinary lead messages, including formatting variations and realistic single-edit typos. The package runs synchronously and offline. Serbyte can consume its results as enrichment evidence without any coupling to its application.

## Research basis
Research recommends a small model-to-makes index, bounded token-window matching, explicit aliases, contextual rules for common words, and a reused single-edit Damerau matcher. Source: `abhionlyone/us-car-models-data`, pinned to commit `79018e2dbcc03899bf3434d959b445644fb49b76`. Research measured 11,543 year records, 66 makes, 1,410 distinct model strings, and 1,459 make/model pairs across 35 CSVs. The 2025 and 2026 files contain only 28 and 3 records respectively. Builder must verify these counts while importing the snapshot. The data uses CC BY 4.0 and requires attribution and a description of transformations. See `docs/research.md` for the completed source comparison.

## Package boundary
- Working package name: `@serbyte/vehicle-parser`, version `0.1.0`.
- TypeScript, ESM and CommonJS, bundled declarations, Node 20 or later.
- Core code follows sibling package conventions: node:test, tsx, tsup, TypeScript. Reuse `levenshtein-lte1/damerau` if the builder confirms its published API and packaging; choose an equivalent small maintained implementation if verification finds a problem.
- Reuse a real CSV parser for build-time ingestion. Pin provenance and dependencies using a lockfile. Install and normal builds must not fetch vehicle data.
- Code MIT; bundled source-derived data retains its CC BY 4.0 notice. Ship third-party notices and original dataset license.
- This task prepares a local release. Publishing, remote repository creation, credentials, and changes to `serbyte-api` are outside scope.

## Public contract
```ts
type MatchType = 'exact' | 'alias' | 'fuzzy';
interface VehicleMatch {
  model: string;
  makes: string[];
  matchedText: string;
  start: number;
  end: number;
  matchType: MatchType;
}
interface FindOptions { fuzzy?: boolean }
function findVehicles(text: string, options?: FindOptions): VehicleMatch[];
function findMakes(text: string, options?: FindOptions): string[];
```

`findVehicles` returns occurrences in text order. `start` is inclusive and `end` exclusive, using JavaScript UTF-16 offsets into the original input. `text.slice(start, end)` always equals `matchedText`. Repeated mentions retain separate spans. Candidate makes are sorted and deduplicated. Multiple canonical source labels at the same span are returned in deterministic order when normalization collides, including same-make case or formatting variants. These are candidate labels for the same mention. Empty input produces an empty array. Invalid external argument types produce clear TypeErrors. Fuzzy matching is enabled by default and can be disabled. Reviewed aliases remain active with `fuzzy: false`; this option disables algorithmic edit matching.

`findMakes` returns the sorted union of makes from model mentions. Make-only recognition, year extraction, trim invention, ownership inference, and choosing a single vehicle from a multi-vehicle message are outside this v1 contract. Explicit makes serve as context and valid disambiguators for model detection. There are no confidence scores.

Example:
```ts
findVehicles("I've had my 4runner for 6months");
// [{ model: '4Runner', makes: ['Toyota'], matchedText: '4runner',
//    start: 12, end: 19, matchType: 'exact' }]
findMakes('Need PPF for my silverdo');
// ['Chevrolet']
```

## Required behavior
1. Recognize every catalog make/model pair with explicit make context. Preserve specific source model names. A full `Mustang MACH-E` mention takes precedence over an overlapping `Mustang` alias or model.
2. Handle case, Unicode normalization, apostrophes, hyphens and reasonable whitespace variations while preserving original offsets and token boundaries. Recognize `4 runner`, `f150`, `f 150`, and `cx5` through vetted formatting/family aliases.
3. Support family mentions omitted by the source's body-style naming, including Silverado and F-150. Store these as documented curated aliases/families; do not fabricate a cab, trim, year, or exact source variant.
4. Support realistic insertions, deletions, substitutions and adjacent swaps for sufficiently long alphabetic model words. Handle `silverdo`, `camery`, and `Jeep wranger`. Avoid fuzzy edits to numeric/code identities or to very short words. Preserve all admissible tied candidates, such as generic `wranger` matching Ranger and Wrangler when both have suitable context. A reviewed multi-edit spelling such as `corrola` may be an explicit Corolla alias; this does not broaden the generic one-edit policy.
5. Preserve model-to-make ambiguity. Examples found in the source include Continental, LS, NX and Viper. Formatting normalization must preserve candidates for collisions such as FIAT `500e` and Mercedes-Benz `500 E`.
6. A nearby explicit make may narrow candidates only when it is a valid catalog association. `Toyota Civic` must never create Toyota/Civic. Keep the valid Honda candidate and leave contradictory-input decisions to the caller.
7. Ordinary words and bare numbers require clear vehicle context. `my focus is on paint protection`, `wrap the edge`, generic golf/pilot/journey/compass language, phone numbers, and URLs/emails must not produce spurious vehicle mentions. `my Ford Focus` must resolve. Capitalization or a distant automotive word alone is insufficient context.
8. Scan long text with bounded per-token work and no silent truncation. Build indexes once and avoid unbounded cross-request caches of user input. Exact/alias matching precedes fuzzy matching. Benchmark repeated and varied long text so caching cannot disguise poor performance.

## Corpus and validation
- Independent authored suite: at least 180 examples, including at least 50 hard negatives. Keep labels independent of implementation outputs. Include the user's anonymized 4Runner example as a separately identified real-message regression.
- Catalog integrity: every pinned source make/model pair is represented and tested with clear make context. Record source coverage separately from free-text accuracy.
- Large deterministic generated suite: target roughly 100,000 useful, unique cases across clear positives, formatting changes, boundaries, noise, multiple vehicles and negatives. Keep generation seeded/reproducible. Prefer diversity over padding a count. Generated output may be an ignored local artifact produced by a script.
- Fuzzy mutation evaluation: track separately; exclude or label collisions with existing valid models and ambiguous corrections. Never assume every random mutation should map back to its original model.
- Property tests: offsets slice correctly, deterministic results, options work, stable deduplication, input immutability, normalization invariants and long-input behavior.
- Report results by corpus category, including false positives, false negatives, exact-set agreement, and generated typo recall where appropriate. No claims of broad real-world accuracy from synthetic fixtures.
- All agreed authored regressions and hard negatives must pass. All catalog pairs must be represented. Generated failures must be fixed or explicitly classified with evidence; do not silently delete failures or regenerate expected values from the parser.
- Measure cold initialization and warm typical-message, 10 KB, 100 KB and 1 MB performance. Report local environment and observed timings; investigate pathological growth. Do not promise latency without measurements.
- Typecheck, build, tests, corpus evaluation, dependency audit, package contents, clean-install ESM/CommonJS and declaration smoke tests must pass before release readiness is claimed.

## Ownership
- Main: PRD, buildplan, memory, integration decisions and final validation.
- Researcher: `docs/research.md` and research notes; follow `_idea-research`.
- Builder: runtime, dataset snapshot/build tools, config/lockfile, README/licenses, focused runtime tests, benchmark script and CI.
- Corpus: `tests/corpus*`, `tests/fixtures/*`, `scripts/generate-corpus.ts`, `docs/corpus*`; owns independent expectations and evaluation.
- Reviewer: independent adversarial/release review and `docs/review.md`; coordinates fixes with builder. No production edits without explicit handoff.

## Launch acceptance
A local npm tarball installs and runs independently; examples and measured validation are reproducible; notices are bundled; the README states source coverage, heuristics and limitations; an independent reviewer has no unresolved launch-blocking findings. The package and its documentation stand alone from Serbyte.
