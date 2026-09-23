---
summary: "Curated family and make-alias policy plus dataset and bundled dependency attribution obligations."
paths:
  - src/families.ts
  - src/rules.ts
  - THIRD_PARTY_NOTICES.md
  - data/source/LICENSE
  - data/source/manifest.json
  - tsup.config.ts
---

# Policy and Provenance

## Curated Policy

`familyDefinitions` bridges source rows that encode configurations inside model strings. Every family prefix must be supported by source row and allowed make association. Build validates this.

`makeAliases` currently normalizes common forms such as Chevy, VW, Mercedes, Benz. Corporate relationships alone do not justify make merging.

Runtime rule sets are product policy. Changes can alter false-positive behavior across many ordinary messages. Add focused regressions and rerun corpus when editing.

## Licensing

Vehicle data is CC BY 4.0. Preserve attribution to Abhilash Reddy / abhionlyone and contributors, source repository, pinned revision, license link, and transformation description.

Package code is MIT.

`levenshtein-lte1@1.0.1` code is bundled by tsup. Build copies its MIT license into `dist/levenshtein-lte1.LICENSE.txt`.

Package contents must retain `LICENSE`, `THIRD_PARTY_NOTICES.md`, source data license, source manifest, and bundled helper license.
