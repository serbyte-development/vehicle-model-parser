---
summary: "99,813-case correctness corpus: provenance, independent oracle design, generated slices, typo collision policy, and acceptance gates."
paths:
  - tests/corpus-evaluate.ts
  - tests/corpus-properties.test.ts
  - tests/corpus.test.ts
  - tests/fixtures/
  - scripts/generate-corpus.ts
  - docs/corpus.md
  - docs/corpus-plan.md
---

# Correctness Corpus

Corpus is correctness/stress evidence, separate from latency benchmark.

Current evaluated set: 99,813 cases.

- 201 hand-authored synthetic cases
- 1 anonymized user-provided 4Runner regression
- 1,459 explicit source make/model pair cases
- 98,152 unique deterministic generated cases

Generated slices cover casing, fullwidth Unicode, separators, whitespace, identifiers, URLs, email, make context, structured forms, repeated mentions, number noise, multiple vehicles, hard negatives, and four typo operators.

## Oracle Independence

Authored labels predate parser execution. Source oracle parses raw CSV independently and imports no runtime catalog/rules. Generated typo collision logic enumerates its own edit neighborhoods and imports no fuzzy matcher.

Never derive expected outputs from `findVehicles`.

## Mutation Policy

Generated typo target must be alphabetic source model with at least six letters. Candidate mutation is checked against exact source spellings and all same-make alphabetic neighbors, including shorter models.

Collisions are excluded from unique-correction slice and recorded in manifest. Example: `tacan` is near both Porsche Macan and Taycan, so it is an explicit ambiguity regression.

## Gates

Evaluator verifies corpus hash, unique IDs/text, manifest counts, required slices, minimum 95k generated cases, spans, ordering, make sorting, `findMakes` union, and exact candidate multiset.

Visible generated corpus proves contract behavior. It is not hidden holdout and does not estimate production lead accuracy.
