---
summary: "Public TypeScript contract, detailed/compact output behavior, option semantics, offsets, and compatibility expectations."
paths:
  - src/index.ts
  - README.md
  - scripts/check-package.ts
---

# Public API

`findVehicles(text, options?)` is primary API. `findMakes(text, options?)` is convenience union over detailed matches.

## Output Modes

`output: 'detailed'` is default. Returns canonical model, possible makes, exact matched source text, UTF-16 offsets, and `exact | alias | fuzzy`.

`output: 'compact'` flattens every detailed model/make possibility into `{ make, model }`. Ambiguous make sets expand into multiple rows.

Generic `FindOptions<TOutput>` controls return inference. Keep hover JSDoc accurate when changing option or result semantics.

## Options

`fuzzy` defaults enabled. `fuzzy: false` disables algorithmic edit matching. Reviewed aliases remain active.

Option validation rejects unsupported output values and invalid fuzzy types.

## Compatibility Rules

- Detailed output remains default.
- `text.slice(start, end) === matchedText`.
- Repeated mentions stay separate.
- Makes sorted and deduplicated.
- Caller mutation of one result must not affect future calls.
- `findMakes` accepts fuzzy option only and returns sorted unique makes.
- Invalid external argument types throw `TypeError`.

Package smoke tests verify ESM, CommonJS, NodeNext ESM declarations, and NodeNext CommonJS declarations.
