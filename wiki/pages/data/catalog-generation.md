---
summary: "Pinned us-car-models-data snapshot, deterministic build checks, generated catalog shape, and source update workflow."
paths:
  - data/source/
  - scripts/build-data.ts
  - scripts/refresh-data.ts
  - src/catalog.json
---

# Catalog Generation

Source repo: `abhionlyone/us-car-models-data`. Pin: `79018e2dbcc03899bf3434d959b445644fb49b76`.

Pinned snapshot facts:

- 35 annual CSV files, 1992 through 2026
- 11,543 source rows
- 66 makes
- 1,410 distinct source model strings
- 1,459 make/model pairs
- 2025 has 28 rows
- 2026 has 3 rows

Recent years are sparse. Year labels are source coverage, not model-year completeness.

## Build

`scripts/build-data.ts` verifies manifest checksums and bytes, exact annual file set, schema, year/file consistency, required fields, body style JSON, duplicate triples, expected counts, and family prefix support.

Output `src/catalog.json` contains source metadata plus deduplicated `models` and curated `families`. Runtime bundle contains transformed catalog, not raw CSV files.

Build should be deterministic. Data changes require review of new/removed models and normalization collisions.

## Refresh

`npm run data:refresh` is explicit maintainer network action. Normal install/build is offline. Refresh keeps immutable source revision checks.

Changing revision requires updating manifest checksums/counts, running catalog build, full tests, corpus, collision review, notices, and package check.
