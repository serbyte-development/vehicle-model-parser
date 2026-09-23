# Vehicle-Identifier NER Resources

This directory contains two public NER resources extracted from automotive
advertisement text and annotated for vehicle-identifier entities.

Each document is provided in three aligned views:
- **`entities`** — character-offset spans `{start, end, label}`. This is the
  **canonical** ground truth (what the annotators marked); it is lossless and
  tokenizer-agnostic. `end` is **exclusive**, so `text[start:end]` is the surface
  form.
- **`tokens` / `labels`** — word-level **IOB2**, ready to train/evaluate on.
- **`char_labels`** (companion `*.char_iob2.jsonl` files) — character-level IOB2
  derived from the offsets: one tag per character, `len(char_labels) == len(text)`.

## Resources

### 1. `vehicle_ner/`
The main named-entity-recognition dataset: **659** documents.

`vehicle_ner.jsonl` — one document per line:

```json
{"id": 0, "text": "...", "answer": "accept",
 "tokens": ["With", "only", ...], "labels": ["O", "O", ...],
 "entities": [{"start": 35, "end": 39, "label": "YEAR"}, ...]}
```

`vehicle_ner.char_iob2.jsonl` — character-level IOB2 for the same documents:

```json
{"id": 0, "text": "...", "char_labels": ["O", "B-YEAR", "I-YEAR", ...]}
```

`answer` is the annotation verdict (`accept` / `reject` / `ignore`) carried over
from the annotation tool, so consumers can filter as needed. Document
distribution: {'accept': 645, 'ignore': 1, 'reject': 13}.

### 2. `iaa_study/`
An inter-annotator-agreement (IAA) study: **three annotators independently
labelled the same 100 documents** (V2 annotation round),
anonymised as `annotator_1/2/3`. For each annotator there is a main file
(`annotator_N.jsonl`, same schema as above keyed by `doc_id`) and a character-level
companion (`annotator_N.char_iob2.jsonl`).

`doc_id` is **shared across the three annotators**: the same `doc_id` is the same
document (identical `tokens`), so the three annotations can be aligned directly to
compute agreement (e.g. span-level precision/recall/F1 or chance-corrected
agreement).

## Entity label set (15 types)

| Entity type | Spans (main dataset) |
|---|---|
| BATTERY_CAPACITY | 44 |
| BATTERY_RANGE | 19 |
| BODY_TYPE | 111 |
| BOOT_SIZE | 9 |
| ENGINE_SPEC | 676 |
| EXTERIOR_COLOUR | 127 |
| FUEL_TYPE | 405 |
| INTERIOR_COLOUR | 70 |
| MAKE | 723 |
| MODEL | 1110 |
| NO_SEATS | 5 |
| RECHARGE_TIME | 23 |
| TRANSMISSION | 97 |
| TRIM | 842 |
| YEAR | 348 |

## Format notes
- Encoding: UTF-8.
- Word-level tokenisation is whitespace/punctuation tokens from the annotation
  tool; no subword tokenisation is applied.
- The character-level view keeps multi-word entities **contiguous** — a space
  inside an entity (e.g. "Black Sapphire") is tagged `I-`, not `O`. Note this
  differs from the project's internal evaluation substrate
  (`src/evalutation/eval_token_to_character.py`), which inserts `O` at inter-token
  spaces; that variant is intended for model comparison, not as a dataset.

## Provenance
Built by `src/data_export/export_public_datasets.py` from the project's raw
Prodigy annotation exports. The annotator-name mapping for the IAA study is kept
private and is intentionally not included here.

## License
The data in this directory is released under the
[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
license. You are free to share and adapt the material for any purpose, including
commercially, provided you give appropriate credit. See the `LICENSE` file in
this directory for the full legal text.

## Citation
If you use this dataset, please cite:

```bibtex
@misc{lee2026autospecnerfinegrainednamedentity,
  title={AutoSpecNER: A Fine-Grained Named Entity Recognition Dataset for Vehicle Specification Extraction},
  author={Jordan Lee and Filippos Ventirozos and Abdirahman Abdullahm and Ioanna Nteka and Peter Appleby and Matthew Shardlow},
  year={2026},
  eprint={2606.24387},
  archivePrefix={arXiv},
  primaryClass={cs.CL},
  url={https://arxiv.org/abs/2606.24387},
}
```
