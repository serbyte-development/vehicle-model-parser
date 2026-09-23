# AutoSpecNER diagnostic

This local diagnostic compares extracted occurrence spans with the original accepted MODEL annotations in AutoSpecNER. It measures agreement with a UK advertisement corpus. Its results do not estimate US automotive-lead accuracy.

## Source, attribution, and privacy

Source: [FilipposVentirozos/AutoSpecNER](https://github.com/FilipposVentirozos/AutoSpecNER), commit `fd168bc5baa096beceaf2ec36fbb6b5bc31821d1`, `vehicle_ner/vehicle_ner.jsonl`. Attribution: Jordan Lee, Filippos Ventirozos, Abdirahman Abdullahm, Ioanna Nteka, Peter Appleby, and Matthew Shardlow, *AutoSpecNER: A Fine-Grained Named Entity Recognition Dataset for Vehicle Specification Extraction* (2026), [arXiv:2606.24387v1](https://arxiv.org/html/2606.24387v1). Data license: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The exact upstream notice is retained in `LICENSE.AutoSpecNER`; the exact source README is `README.upstream.md`. Source bytes and labels remain unchanged. Only evaluation-time verdict selection, offset conversion, and span grouping are applied.

The 2026-09-17 reviewer privacy scan found 9 email-pattern occurrences, 75 UK-phone-pattern occurrences, 11 postcode-pattern candidates (including a vehicle-specification false hit), and 36 URL-pattern occurrences. Manual inspection of candidates included a personal-looking email address alongside dealership contacts. This bounded scan does not establish full anonymization. Raw JSONL is preserved locally and ignored by Git. Reports contain aggregates and model-label surfaces, with no advertisement excerpts or contact values. Every file in this benchmark directory is excluded from the npm package. Fetching raw data is an explicit developer action.

## Reproduce

```sh
python3 benchmarks/public/fetch.py
npm run evaluate:public
```

The downloader verifies pinned byte counts and SHA-256 checksums and leaves existing files untouched. The evaluator verifies the source again and writes an aggregate `results.json`. Normal builds and tests run offline and do not fetch this corpus.

## Frozen selection and metrics

Selection depends only on upstream `answer === 'accept'`. The original file has 659 records and 643 unique full texts. Its accepted subset has 645 records, 629 unique full texts, and 1,110 MODEL spans. Sixteen accepted records duplicate earlier full texts; ten duplicate-text groups contain differing entity annotations. The primary report includes every accepted row. A separately reported unique-text diagnostic keeps the first accepted row for each exact full text, in original file order. That rule is applied before examining parser predictions. No training/test split or human-versus-AI split is fabricated: per-record authorship metadata is absent from this exported JSONL.

Offsets in upstream entities count Unicode code points. The evaluator converts each start/end to JavaScript UTF-16 positions using a per-document mapping. The full source contains five documents with non-BMP characters. Predictions are checked against original-text slices. Same-span canonical ambiguities collapse to a single predicted occurrence because upstream MODEL annotations provide spans without this package's canonical model/make candidate sets.

Exact span precision/recall/F1 requires identical start and exclusive end offsets. Overlap precision/recall/F1 uses positive character overlap and maximum one-to-one matching. One prediction can match at most one gold occurrence. These metrics evaluate span agreement only; they do not score canonical model or make correctness.

Catalog support is determined independently from the pinned raw US CSV model strings using case, compatibility, whitespace, and punctuation folding. Gold surfaces with no exact folded catalog string are listed separately. This bucket includes unsupported UK names, omitted families, and spelling/label variants; it is broader than proven unsupported vehicles. No parser output determines selection or support. All accepted gold spans remain in the primary denominator.

The paper describes UK ads containing human and AI-generated text, and annotation focused on attributes of the advertised vehicle. This package extracts vehicle mentions generally. Additional valid mentions may count as false positives against upstream labels. US source names can also include trim/body-style text which upstream annotators label separately, affecting exact and overlap agreement. Scores reflect these scope and labeling differences along with extraction errors.

## Recorded results

Final reviewer run on 2026-09-17, Node 24.19.0, fuzzy matching enabled. Source and runtime hashes are in `results.json`.

| Selection / span rule | Predicted / gold | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: |
| All 645 accepted rows, exact | 585 / 1,110 | 75.38% | 39.73% | 52.04% |
| All 645 accepted rows, overlap | 585 / 1,110 | 79.32% | 41.80% | 54.75% |
| First accepted row per text, exact | 564 / 1,090 | 75.18% | 38.90% | 51.27% |
| First accepted row per text, overlap | 564 / 1,090 | 79.26% | 41.01% | 54.05% |

Of 1,110 gold spans, 556 have an exact folded source-catalog surface; their exact recall is 77.52%. The remaining 554 stay in the main denominator. Unmapped surfaces include Polo, Corsa, Clio and Qashqai, plus family/spelling/annotation variants. Complete unmapped-surface counts are retained in `results.json`. These are diagnostic span-agreement measurements with the scope limitations above.
