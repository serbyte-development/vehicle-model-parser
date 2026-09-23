---
summary: "High-level map of runtime, source data, generated catalog, tests, benchmarks, and packaging boundaries."
paths:
  - src/
  - scripts/
  - tests/
  - package.json
---

# Architecture

## Flow

`data/source/*.csv` -> `scripts/build-data.ts` -> `src/catalog.json` -> `src/index.ts` runtime indexes -> `findVehicles` / `findMakes`.

Runtime policy comes from `src/rules.ts` and `src/families.ts`. Build step validates family definitions against pinned source rows.

Validation has separate paths:

- `tests/runtime.test.ts`: focused public behavior.
- `tests/corpus*` + `tests/fixtures/*`: large independent corpus.
- `tests/review*`: frozen and disclosed reviewer cases.
- `benchmarks/public/*`: external AutoSpecNER diagnostic and installed-package evidence.
- `scripts/benchmark.ts`: local performance measurements.

Packaging path: `tsup.config.ts` -> `dist/` -> `scripts/check-package.ts` -> local tarball.

## Ownership Boundaries

`src/catalog.json` is generated. Change source snapshot, build script, family definitions, or source pin, then regenerate. Avoid hand edits.

Corpus expectations do not call runtime matcher. Keep that independence when adding cases.

Public external corpus measures boundary behavior. Its raw data contains contact information and stays excluded from package and normal repo publication paths.

## Route

- Runtime behavior: [Runtime](./runtime/index.md)
- Data and generation: [Data](./data/index.md)
- Tests and evidence: [Validation](./validation/index.md)
- Build and release: [Release](./release/index.md)
