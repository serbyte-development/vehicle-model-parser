---
summary: "Performance benchmark design, long-input behavior, interpretation of timings, and cases that guard bounded work."
paths:
  - scripts/benchmark.ts
  - tests/corpus-properties.test.ts
  - benchmarks/public/performance.jsonl
  - docs/implementation.md
---

# Performance

`scripts/benchmark.ts` measures built ESM runtime. Input generation happens outside timed section. Fixed seed prevents cache-friendly accidental simplification.

Bench groups:

- cold module import in fresh processes
- typical positive lead with two mentions
- typical negative lead
- repeated negative text at 10 KB, 100 KB, 1 MB
- varied contextual vocabulary at same sizes
- one 1 MB arbitrary token
- dense 1 MB positive text producing tens of thousands of matches

Reviewed Apple M2 / Node 24.19.0 run recorded typical lead medians around 0.02 ms. Varied 1 MB input around 265 ms. Dense 1 MB output around 360 ms. Numbers are machine observations, not SLO.

Long-input property tests separately ensure scanning reaches terminal mention beyond 1 MB and rejects huge arbitrary token. They contain no wall-clock gate.

Performance changes should preserve bounded token windows, prefix early exit, static catalog indexes, bounded fuzzy candidates, and no cross-request text cache.
