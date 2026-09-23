# Vehicle Model Parser

[![CI](https://github.com/Serbyte-Development/vehicle-model-parser/actions/workflows/ci.yml/badge.svg)](https://github.com/Serbyte-Development/vehicle-model-parser/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Extract vehicle model mentions and possible makes from noisy text with a synchronous, offline TypeScript API.

`vehicle-model-parser` is built for deterministic lead enrichment and text-processing pipelines. It recognizes catalog-supported vehicle model mentions, infers possible makes, handles common formatting differences and conservative typos, preserves valid ambiguity, and returns either source-level match evidence or simple `{ make, model }` pairs.

```sh
npm install vehicle-model-parser
```

Requires Node.js 20 or later. ESM, CommonJS, and TypeScript declarations are included. The published runtime has zero production dependencies and performs no network requests.

## Quick start

```ts
import { findVehicles } from 'vehicle-model-parser';

findVehicles('Need PPF for my silverdo', { output: 'compact' });
// [{ make: 'Chevrolet', model: 'Silverado' }]
```

Detailed output is the default and includes the original text span and match type:

```ts
findVehicles("I've had my 4runner for 6 months");

// [
//   {
//     model: '4Runner',
//     makes: ['Toyota'],
//     matchedText: '4runner',
//     start: 12,
//     end: 19,
//     matchType: 'exact'
//   }
// ]
```

Ambiguous catalog associations stay visible:

```ts
findVehicles('I own a Continental and want leather cleaned', {
  output: 'compact',
});

// [
//   { make: 'Bentley', model: 'Continental' },
//   { make: 'Lincoln', model: 'Continental' }
// ]
```

## Features

- **Offline and synchronous:** no API key, runtime network access, or production dependencies.
- **Noise tolerant:** handles case, spacing, Unicode, hyphenation, reviewed aliases, and model-family formatting.
- **Conservative typo matching:** supports bounded single-edit corrections while protecting short codes and numeric identities.
- **Ambiguity preserving:** shared model names can return multiple supported makes.
- **Context aware:** common words such as `Focus`, `Edge`, `Fit`, and `Pilot` require vehicle context.
- **Source evidence:** detailed matches include exact source text, UTF-16 offsets, and `exact`, `alias`, or `fuzzy` match type.

## API

### `findVehicles(text, options?)`

```ts
import { findVehicles } from 'vehicle-model-parser';
```

| Option | Default | Description |
| --- | --- | --- |
| `output` | `'detailed'` | Use `'compact'` for flat `{ make, model }` pairs. |
| `fuzzy` | `true` | Enables bounded algorithmic typo matching. Reviewed aliases remain active when disabled. |

Detailed matches have this shape:

```ts
interface VehicleMatch {
  model: string;
  makes: string[];
  matchedText: string;
  start: number;
  end: number;
  matchType: 'exact' | 'alias' | 'fuzzy';
}
```

`start` and exclusive `end` are UTF-16 offsets into the original input, so `text.slice(start, end) === matchedText`.

Compact output returns one row for each supported make/model possibility:

```ts
findVehicles('Toyota Camry', { output: 'compact' });
// [{ make: 'Toyota', model: 'Camry' }]
```

### `findMakes(text, options?)`

Returns the sorted union of possible makes from detected model mentions.

```ts
import { findMakes } from 'vehicle-model-parser';

findMakes('Need PPF for my 4runner');
// ['Toyota']

findMakes('I have a Toyota');
// []
```

Make-only text is outside the parser's extraction scope. Model detection drives make inference.

## Matching examples

| Input | Result |
| --- | --- |
| `my 4runner` | Toyota / 4Runner |
| `my 4 runner` | Toyota / 4Runner |
| `Ford f150` | Ford / F-150 |
| `Mazda cx5` | MAZDA / CX-5 |
| `my silverdo` | Chevrolet / Silverado |
| `Jeep wranger` | Jeep / Wrangler |
| `my wranger` | Ford / Ranger and Jeep / Wrangler |
| `Lincoln Continental` | Lincoln / Continental |
| `Toyota Civic` | Honda / Civic |
| `my focus is on paint protection` | no vehicle |

Explicit make context can narrow a valid ambiguity. A contradictory make does not create a new catalog association, so `Toyota Civic` retains the catalog-supported Honda/Civic association.

Disable algorithmic typo matching when exact and reviewed alias matching is preferred:

```ts
findVehicles('My camery needs tint', { fuzzy: false });
// []
```

## Data coverage and attribution

The bundled model catalog is derived from [abhionlyone/us-car-models-data](https://github.com/abhionlyone/us-car-models-data), by Abhilash Reddy (abhionlyone) and contributors, pinned to revision `79018e2dbcc03899bf3434d959b445644fb49b76` under CC BY 4.0.

The verified source snapshot contains 11,543 records across 35 yearly CSV files, yielding 66 makes, 1,410 distinct model strings, and 1,459 make/model pairs after deduplication. Source years span 1992 through 2026.

> [!NOTE]
> Recent-year source coverage is sparse. The pinned 2025 file contains 28 records and 2026 contains 3, so the package makes no model-year completeness claim.

The runtime catalog deduplicates make/model associations across years and omits year and body-style fields. Full attribution and transformation details are retained in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and the bundled source manifest.

## Validation

The current recorded corpus contains **99,813 labeled cases**, with all 99,813 passing the strict evaluator. It includes independently authored cases, every source make/model pair, deterministic generated variations, typo mutations, hard negatives, repeated mentions, and an anonymized real-message regression.

> [!NOTE]
> The visible corpus verifies documented behavior and stress cases. It is not a hidden holdout or an estimate of production accuracy.

The repository also records an external AutoSpecNER diagnostic over 645 accepted UK vehicle advertisements. Exact MODEL-span precision is 75.38%, recall is 39.73%, and F1 is 52.04%. The diagnostic uses a different geography, catalog scope, and annotation policy, so it is retained as boundary evidence rather than a US lead-accuracy estimate.

## Performance

The benchmark suite measures built ESM runtime on typical lead text, negative text, large inputs, cold imports, and dense positive output.

One recorded Apple M2 / Node 24.19.0 run measured a 0.025 ms median for a 91-byte positive message, 262.377 ms for varied 1 MB text, and 382.396 ms for a dense 1 MB input producing 76,923 matches. These are machine observations, not latency guarantees.

```sh
npm run build
npm run bench
```

## Development

```sh
npm ci
npm run check
```

`npm run check` rebuilds and verifies the catalog, typechecks, runs the test suite, regenerates and evaluates the corpus, builds ESM/CommonJS output, and smoke-tests a packed consumer. Package smoke tests cover ESM, CommonJS, NodeNext ESM declarations, and NodeNext CommonJS declarations.

Normal installs and builds do not download vehicle data. `npm run data:refresh` is the explicit maintainer workflow for refreshing the pinned source snapshot.

## Scope and limitations

- Catalog coverage is US-oriented and incomplete for recent years.
- The package extracts make/model possibilities. It does not infer ownership, year, trim, VIN, or vehicle condition.
- Common-word models use deterministic contextual heuristics.
- Conservative fuzzy matching can abstain on unusual misspellings, and unsupported international, historical, or newly released models can be missed.
- Multiple valid possibilities remain multiple results.

For implementation details and validation methodology, see [`docs/implementation.md`](docs/implementation.md), [`docs/corpus.md`](docs/corpus.md), [`docs/research.md`](docs/research.md), and [`docs/review.md`](docs/review.md).

Developed & maintained by [Serbyte Development](https://www.serbyte.net/) · [GitHub](https://github.com/Serbyte-Development)
