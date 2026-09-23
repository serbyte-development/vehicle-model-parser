---
summary: "Rules for common-word models, make context, contradictory input, ambiguity preservation, families, and known collision behavior."
paths:
  - src/index.ts
  - src/rules.ts
  - src/families.ts
  - tests/review-regressions.test.ts
---

# Context and Ambiguity

## Common Words

Many source models are normal English: Focus, Edge, Fit, Pilot, Golf, Air, Compass, Journey. `commonModels` routes them through local context checks. `highRiskCommonModels` require stronger evidence.

Context uses nearby ownership language, service words, make evidence, and local syntax. Sentence/clause scope matters. Distant automotive language must not legitimize an ordinary word.

`fuzzyStopWords` prevents common service vocabulary from entering typo search.

## Make Context

Nearby make can appear before model, after model in approved parenthetical syntax, or in labeled form context. Optional year can sit between make and model.

Compatible make evidence narrows candidate associations. Leading compatible make wins when both leading and trailing candidates exist.

Contradictory make never creates association. `Toyota Civic` produces Honda/Civic.

Make context must not bleed across comma-separated vehicle mentions. Reviewer regression R1 protects this.

## Ambiguity

Source collisions remain candidates. Examples: Continental, LS, NX, Viper. Formatting folding can create extra collisions, such as FIAT `500e` and Mercedes-Benz `500 E`.

Generic `wranger` can resolve to Ford/Ranger and Jeep/Wrangler. `Jeep wranger` narrows to Wrangler.

## Families

`src/families.ts` adds reviewed generic families missing from source naming shape, such as F-150, Silverado, Sierra, Tacoma, Sprinter, Transit. Family result never invents cab, trim, or source variant.
