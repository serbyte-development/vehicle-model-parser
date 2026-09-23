---
summary: "Task routing for common maintenance: matcher changes, rules, catalog refresh, corpus additions, benchmark changes, and release verification."
paths:
  - src/
  - scripts/
  - tests/
  - data/source/
---

# Maintenance Workflows

## Change Matcher Logic

Read runtime matching and context pages. Add minimal focused regression first when fixing bug. Run runtime/review tests, then full corpus. Recheck performance when changing scan bounds, tokenization, or fuzzy candidate generation.

## Change Rules or Families

Edit `src/rules.ts` or `src/families.ts`. Family changes require catalog regeneration because generated catalog carries families. Add hard-negative/positive cases covering ordinary-language impact.

## Refresh Vehicle Data

Use explicit `npm run data:refresh`. Review source diff, manifest counts/checksums, new normalization collisions, make/model ambiguity, and family prefix validity. Regenerate catalog and corpus. Re-run full package gate and notices review.

## Add Real Regression

Anonymize and record provenance. Keep real cases distinct from synthetic/generated metrics. Never claim production accuracy from visible regression set.

## Change Public API

Maintain default compatibility unless product decision says otherwise. Update runtime types/JSDoc, README, runtime tests, package smoke type tests, and wiki API page. Rebuild declarations before release.

## Release Candidate

Run `npm run check`, `npm audit`, and benchmark when runtime changed. Inspect package artifact only after final metadata/docs changes. Record final artifact hash if distribution depends on local tarball.
