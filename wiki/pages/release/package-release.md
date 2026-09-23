---
summary: "Build and package workflow, tarball contents, consumer smoke tests, CI matrix, and release gates."
paths:
  - package.json
  - tsup.config.ts
  - scripts/check-package.ts
  - .github/workflows/ci.yml
  - README.md
---

# Package and Release

Package targets Node >=20. `tsup` emits ESM, CommonJS, `.d.ts`, and `.d.cts`. Damerau helper is bundled, so published runtime has zero external dependencies.

## Package Allowlist

`package.json#files` includes:

- `dist`
- source data license and manifest
- package `LICENSE`
- `THIRD_PARTY_NOTICES.md`
- `README.md`

Raw CSVs, tests, scripts, docs, and corpora stay outside tarball.

## Smoke

`scripts/check-package.ts` packs with scripts disabled, verifies required files and exclusions, installs tarball offline into fresh temp consumer, checks zero production dependencies, runs ESM and CommonJS examples, and typechecks NodeNext `.mts` / `.cts` consumers.

It also copies verified tarball into `artifacts/`.

## Main Gate

`npm run check`:

1. rebuild/verify catalog
2. build package
3. typecheck
4. run all tests
5. regenerate corpus
6. evaluate corpus
7. smoke packed consumer

Run `npm audit` separately. CI repeats check/audit on Node 20, 22, 24.

When public API changes, update JSDoc, README examples, runtime tests, package consumer type tests, and wiki API page together.
