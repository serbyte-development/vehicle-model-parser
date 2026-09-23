# Third-party notices

## Vehicle data: CC BY 4.0

This package contains a transformed `us-car-models-data` catalog by **Abhilash Reddy (abhionlyone) and contributors**.

Source: https://github.com/abhionlyone/us-car-models-data

Pinned revision: `79018e2dbcc03899bf3434d959b445644fb49b76`.

License: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/.
The original license is included at `data/source/LICENSE`. Original yearly CSVs and the upstream README are preserved unchanged in the development source tree. The tarball includes their SHA-256 checksums in `data/source/manifest.json` and the transformed catalog in the runtime bundle.

Transformations: the runtime catalog deduplicates make/model associations across years, sorts entries, and omits year and body-style fields. Matching keys normalize case, punctuation and spacing. Separately curated family labels group explicitly documented source variants. Data coverage spans 1992 through 2026, with partial recent years. These transformations imply no endorsement by the source authors.

## levenshtein-lte1: MIT

Source: https://github.com/Yomguithereal/levenshtein-lte1

Version: 1.0.1. The package's Damerau implementation is bundled into the runtime.
Its original MIT license is reproduced in `dist/levenshtein-lte1.LICENSE.txt` during the build.
