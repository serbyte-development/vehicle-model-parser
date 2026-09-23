import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import type { CorpusCase, ExpectedMention } from './types.js';

export const SOURCE_COMMIT = '79018e2dbcc03899bf3434d959b445644fb49b76';
const sourceDirectory = new URL('../../data/source/', import.meta.url);

export interface SourcePair {
  make: string;
  model: string;
}
export interface SourceCatalog {
  pairs: SourcePair[];
  byMakeAndSpelling: Map<string, string[]>;
  modelSpellings: Set<string>;
  rows: number;
}

// Independent implementation of the PRD's formatting-equivalence contract.
// No runtime, generated catalog, curated rules, or parser output is imported.
export function spellingKey(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

export function readSourceCatalog(): SourceCatalog {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', sourceDirectory), 'utf8')) as { commit: string };
  assert.equal(manifest.commit, SOURCE_COMMIT, 'Update independent corpus provenance when changing the dataset pin.');
  const files = readdirSync(sourceDirectory)
    .filter((file) => /^\d{4}\.csv$/.test(file))
    .sort();
  const unique = new Map<string, SourcePair>();
  let rows = 0;
  for (const file of files) {
    const records = parse(readFileSync(new URL(file, sourceDirectory), 'utf8'), {
      columns: true,
      skip_empty_lines: true,
    }) as Array<{ year: string; make: string; model: string; body_styles: string }>;
    rows += records.length;
    for (const { make, model } of records) unique.set(`${make}\0${model}`, { make, model });
  }
  const pairs = [...unique.values()].sort((a, b) =>
    a.make < b.make ? -1 : a.make > b.make ? 1 : a.model < b.model ? -1 : a.model > b.model ? 1 : 0,
  );
  assert.equal(files.length, 35);
  assert.equal(rows, 11_543);
  assert.equal(pairs.length, 1_459);
  assert.equal(new Set(pairs.map(({ make }) => make)).size, 66);
  assert.equal(new Set(pairs.map(({ model }) => model)).size, 1_410);
  const byMakeAndSpelling = new Map<string, string[]>();
  for (const { make, model } of pairs) {
    const key = `${make}\0${spellingKey(model)}`;
    const group = byMakeAndSpelling.get(key) ?? [];
    group.push(model);
    byMakeAndSpelling.set(key, group);
  }
  return { pairs, byMakeAndSpelling, modelSpellings: new Set(pairs.map(({ model }) => spellingKey(model))), rows };
}

export function sourceMentions(
  catalog: SourceCatalog,
  pair: SourcePair,
  matchedText: string,
  start: number,
): ExpectedMention[] {
  const alternatives = catalog.byMakeAndSpelling.get(`${pair.make}\0${spellingKey(pair.model)}`);
  assert.ok(alternatives, `Missing source association: ${pair.make} / ${pair.model}`);
  return alternatives.map((model) => ({
    model,
    makes: [pair.make],
    matchedText,
    start,
    end: start + matchedText.length,
  }));
}

export function* sourceCases(catalog: SourceCatalog): Generator<CorpusCase> {
  for (const pair of catalog.pairs) {
    const prefix = `My ${pair.make} `;
    yield {
      id: `catalog:${pair.make}/${pair.model}`,
      category: 'catalog-pairs',
      provenance: 'generated-source',
      text: `${prefix}${pair.model} needs paint protection.`,
      expected: sourceMentions(catalog, pair, pair.model, prefix.length),
    };
  }
}
