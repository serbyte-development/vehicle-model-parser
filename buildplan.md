# Build Plan

## Goal
Create a standalone package that finds vehicle models and possible makes in lead messages, with useful typo support and a reproducible, diverse test corpus.

## Build
- [x] Create the workspace, shared memory and bounded agent assignments.
- [x] Research reusable data, matching tools and corpus approaches.
- [x] Agree on the public behavior and document it in the PRD.
- [x] Vehicle mentions resolve offline with source evidence and ambiguity preserved.
- [x] Realistic formatting, typos and everyday-language negatives are covered.
- [x] The corpus verifies catalog coverage and independent realistic examples separately.
- [x] Long-message performance and package installation are measured and verified.
- [x] Independent review findings are resolved.
- [x] A local release tarball, usage documentation and required licenses are ready.

## Constraints
Keep implementation small. Maximum five agents including the coordinator. Keep all changes within this standalone project. Preserve unrelated files and avoid external publication. Report observed coverage and limitations accurately.

## Completion evidence
Main independently ran `npm run check` successfully on 2026-09-17: 278 automated tests, 99,813 corpus cases, build/type checks, and offline installed ESM/CommonJS/NodeNext consumers passed. `npm audit` reported zero vulnerabilities. Independent review approved the tested local-release scope after fixing make-context leakage and short-code fuzzy changes. Separate public UK advertisement diagnostics retain their observed limitations.

Local release: `artifacts/serbyte-vehicle-parser-0.1.0.tgz`, with an identical project-root copy. The final package-only recheck passed after documentation/artifact-copy changes. Nothing was published externally and the Serbyte application remains unchanged.
