# Decision Log

Preserve major historical reasoning that helps a future agent understand why the project took its current direction.

Add an entry when a significant decision, reversal, discovery, rejected approach, validation, or lesson from real usage would be useful to understand later and its reasoning is not obvious from the current code, wiki, or Git history.

Do not use this as a changelog. Routine implementation changes, wiki maintenance, generated output, and tests run do not belong here.

## 2026-09-17 - Keep vehicle extraction as standalone package

Vehicle recognition moved into its own npm package before Serbyte integration. Goal: deterministic enrichment boundary, isolated testing, reusable API, no coupling to lead business logic.

## 2026-09-17 - Preserve ambiguity instead of confidence ranking

Parser returns all valid catalog-supported make/model possibilities. Numeric confidence was rejected. This keeps deterministic facts separate from downstream decisions and exposes genuine source collisions.

## 2026-09-17 - Conservative fuzzy matching

General fuzzy policy stays one Damerau edit on sufficiently long alphabetic model words. Short code components and numeric identities stay exact. This came from false-positive risk and reviewer discovery that unsupported `D-Class` could otherwise fan out to many valid Mercedes classes.

## 2026-09-17 - Corpus is independent correctness infrastructure

Large corpus oracle was kept separate from runtime implementation. Generated expectations come from raw source parsing and independent mutation collision logic. Synthetic volume is reported separately from external AutoSpecNER evidence and real-message regressions.
