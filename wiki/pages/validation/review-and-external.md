---
summary: "Independent reviewer suite, fixed defects, AutoSpecNER diagnostic scope, privacy boundary, and interpretation limits."
paths:
  - tests/review-holdout.test.ts
  - tests/review-regressions.test.ts
  - tests/review-public.test.ts
  - scripts/evaluate-public.ts
  - benchmarks/public/
  - docs/review.md
---

# Review and External Diagnostic

Independent reviewer froze adversarial cases before reading production rules. Original frozen file retained under `benchmarks/public/review-holdout.frozen.txt`.

Two material defects found and fixed:

1. Make context crossed comma-separated vehicle mentions.
2. Fuzzy edits changed short code identity in cases like unsupported `D-Class`.

Keep regression tests when refactoring context or fuzzy logic.

## AutoSpecNER

Optional external diagnostic uses pinned AutoSpecNER UK advertisement corpus. It measures MODEL span agreement under different geography and annotation policy.

Final recorded diagnostic: 645 accepted rows, 1,110 gold MODEL spans. Exact precision 75.38%, recall 39.73%, F1 52.04%. Overlap F1 54.75%.

Large share of missed labels are outside selected US catalog or differ in naming policy. Treat metric as boundary diagnostic, not US lead accuracy.

Raw AutoSpecNER export contains email, phone, postcode/address-like contact data. Raw file stays local/ignored and excluded from package. Published project evidence should use aggregate results and provenance only.
