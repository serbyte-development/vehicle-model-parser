---
summary: "Core extraction algorithm: tokenization, normalization, exact/alias scan, overlap handling, and bounded fuzzy lookup."
paths:
  - src/index.ts
---

# Matching Pipeline

## Startup Indexes

Module load builds static indexes from generated catalog:

- compact model key -> source/family entries
- prefix set for early exact-scan termination
- one-deletion signatures for fuzzy candidate lookup
- normalized make aliases

Equivalent source spellings sharing compact key share approved split positions. This handles source variants such as `SuperCab` and `Super Cab`.

## Input Scan

Tokenizer retains original UTF-16 offsets. Normalization folds case and combining marks. Matching key removes punctuation and spacing. URL/email chunks are suppressed before model extraction.

Exact/alias pass scans bounded token windows. Prefix index stops impossible windows early. Full longer matches replace overlapping shorter candidates.

Make tokens used as disambiguation are protected from becoming unqualified model mentions.

## Fuzzy Pass

Runs only on unoccupied alphabetic windows. Candidate lookup uses deletion signatures, then `levenshtein-lte1/damerau` verifies exactly one edit.

`singleWordEdit` requires:

- same source/input word count
- one changed word maximum
- changed source and input words each at least five characters
- Damerau distance exactly one

This protects short identity components such as `C-Class`. Numeric models receive no generic fuzzy correction.

Reviewed `corrola` -> `Corolla` is explicit alias policy, independent of generic one-edit fuzzy logic.

## Result Construction

Groups sorted by source position. Detailed matches preserve source spelling, candidate makes, span, and match type. Compact output is a final flattening step over detailed matches.
