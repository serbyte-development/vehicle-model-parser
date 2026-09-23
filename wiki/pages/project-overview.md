---
summary: "Startup context for vehicle-model-parser: product boundary, engineering approach, and global invariants that affect most changes."
---

# Project Overview

Standalone TypeScript package. Input arbitrary text. Output catalog-supported vehicle model mentions and possible makes. Main use case is deterministic lead enrichment before or beside LLM processing.

## Engineering Approach

Keep runtime small, synchronous, offline. Prefer explicit rules and bounded matching over general NLP machinery. Preserve ambiguity instead of guessing. Treat false positives from ordinary words as a major failure mode.

Source data, generated catalog, matcher, corpus oracle, and public diagnostic have separate ownership. Tests must derive expected values independently of production matcher behavior.

Public API compatibility matters. Default output is detailed. Compact output is opt-in. TypeScript inference and ESM/CommonJS packaging are release gates.

## Global Invariants

- Model detection drives make inference. Make-only text returns no vehicle.
- Catalog association wins over contradictory user text. Example: `Toyota Civic` keeps Honda/Civic.
- Ambiguous valid associations stay visible. No confidence score or forced winner.
- Exact and reviewed alias matching run before fuzzy matching.
- Fuzzy matching stays conservative. Short codes and numeric identities are protected.
- Detailed result offsets always reference original JavaScript UTF-16 text.
- Runtime performs no network access and keeps no cross-request user-text cache.
- Dataset pin and corpus provenance are part of correctness. Generated counts alone do not establish real-world accuracy.
