/** Optional local AutoSpecNER diagnostic. Original labels and text stay unchanged. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';
import { findVehicles } from '../src/index.js';

export interface Span {
  start: number;
  end: number;
}
interface Document {
  id: number;
  text: string;
  answer: 'accept' | 'reject' | 'ignore';
  entities: (Span & { label: string })[];
}
interface Tally {
  documents: number;
  predictions: number;
  gold: number;
  exact: number;
  overlap: number;
  catalogGold: number;
  catalogExact: number;
  catalogOverlap: number;
  unmappedGold: number;
  unmappedExact: number;
  unmappedOverlap: number;
}
const root = new URL('../', import.meta.url);
const directory = new URL('benchmarks/public/', root);
const sha256 = (value: Buffer | string): string => createHash('sha256').update(value).digest('hex');

export function codePointOffsets(text: string): number[] {
  const offsets = [0];
  for (const character of text) offsets.push(offsets[offsets.length - 1]! + character.length);
  return offsets;
}

/** Maximum one-to-one matching. Returns matched GOLD indices. */
export function matchSpans(predicted: Span[], gold: Span[], overlap = false): Set<number> {
  const owner = new Map<number, number>();
  const compatible = (a: Span, b: Span): boolean =>
    overlap ? a.start < b.end && b.start < a.end : a.start === b.start && a.end === b.end;
  function assign(prediction: number, visited: Set<number>): boolean {
    for (let target = 0; target < gold.length; target++) {
      if (visited.has(target) || !compatible(predicted[prediction]!, gold[target]!)) continue;
      visited.add(target);
      const previous = owner.get(target);
      if (previous === undefined || assign(previous, visited)) {
        owner.set(target, prediction);
        return true;
      }
    }
    return false;
  }
  for (let i = 0; i < predicted.length; i++) assign(i, new Set());
  return new Set(owner.keys());
}

export function acceptedUnique(documents: Document[]): Document[] {
  const seen = new Set<string>();
  return documents.filter((document) => {
    if (document.answer !== 'accept' || seen.has(document.text)) return false;
    seen.add(document.text);
    return true;
  });
}

function emptyTally(): Tally {
  return {
    documents: 0,
    predictions: 0,
    gold: 0,
    exact: 0,
    overlap: 0,
    catalogGold: 0,
    catalogExact: 0,
    catalogOverlap: 0,
    unmappedGold: 0,
    unmappedExact: 0,
    unmappedOverlap: 0,
  };
}
function metrics(tally: Tally) {
  const fraction = (a: number, b: number): number | null => (b ? a / b : null);
  const score = (tp: number) => ({
    truePositive: tp,
    falsePositive: tally.predictions - tp,
    falseNegative: tally.gold - tp,
    precision: fraction(tp, tally.predictions),
    recall: fraction(tp, tally.gold),
    f1: fraction(2 * tp, tally.predictions + tally.gold),
  });
  return {
    documents: tally.documents,
    predictedSpans: tally.predictions,
    goldSpans: tally.gold,
    exact: score(tally.exact),
    overlap: score(tally.overlap),
    goldRecallByCatalogSurface: {
      exactFoldedSourceSurface: {
        gold: tally.catalogGold,
        exactRecall: fraction(tally.catalogExact, tally.catalogGold),
        overlapRecall: fraction(tally.catalogOverlap, tally.catalogGold),
      },
      noExactFoldedSourceSurface: {
        gold: tally.unmappedGold,
        exactRecall: fraction(tally.unmappedExact, tally.unmappedGold),
        overlapRecall: fraction(tally.unmappedOverlap, tally.unmappedGold),
      },
    },
  };
}

async function main(): Promise<void> {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
  for (const file of manifest.files) {
    const content = await readFile(new URL(file.localPath, directory));
    assert.equal(content.length, file.bytes, `${file.localPath}: byte count`);
    assert.equal(sha256(content), file.sha256, `${file.localPath}: checksum`);
  }
  const raw = await readFile(new URL('vehicle_ner.original.jsonl', directory), 'utf8');
  const documents: Document[] = raw
    .trimEnd()
    .split('\n')
    .map((line: string) => JSON.parse(line));
  assert.equal(documents.length, manifest.expected.records);
  const accepted = documents.filter((document) => document.answer === 'accept');
  assert.equal(accepted.length, manifest.expected.accepted);
  const unique = acceptedUnique(documents);
  assert.equal(unique.length, manifest.expected.uniqueTextsAccepted);
  assert.equal(new Set(documents.map((document) => document.text)).size, manifest.expected.uniqueTextsAll);
  assert.equal(
    documents.filter((document) => /[\u{10000}-\u{10FFFF}]/u.test(document.text)).length,
    manifest.expected.nonBmpDocumentsAll,
  );

  // Catalog support uses raw source strings. No production matching rule or prediction participates.
  const fold = (value: string): string =>
    value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const catalogKeys = new Set<string>();
  const sourceDirectory = new URL('data/source/', root);
  for (const path of (await readdir(sourceDirectory)).filter((path) => path.endsWith('.csv')).sort()) {
    const rows = parse(await readFile(new URL(path, sourceDirectory)), {
      columns: true,
      bom: true,
      skip_empty_lines: true,
    }) as { model: string }[];
    for (const row of rows) catalogKeys.add(fold(row.model));
  }
  const sourceFiles = ['src/index.ts', 'src/rules.ts', 'src/families.ts', 'src/catalog.json'];
  const implementationHashes = Object.fromEntries(
    await Promise.all(sourceFiles.map(async (path) => [path, sha256(await readFile(new URL(path, root)))])),
  );
  const uniqueIds = new Set(unique.map((document) => document.id));
  assert.equal(new Set(documents.map((document) => document.id)).size, documents.length, 'Unique source IDs');
  const all = emptyTally();
  const distinct = emptyTally();
  const unmapped = new Map<string, number>();
  const duplicateAnnotations = new Map<string, Set<string>>();
  let nonBmpAccepted = 0;

  for (const document of accepted) {
    const offsets = codePointOffsets(document.text);
    if (offsets[offsets.length - 1] !== offsets.length - 1) nonBmpAccepted++;
    const gold = document.entities
      .filter((entity) => entity.label === 'MODEL')
      .map((entity) => {
        assert.ok(
          Number.isInteger(entity.start) &&
            Number.isInteger(entity.end) &&
            entity.start >= 0 &&
            entity.end > entity.start &&
            entity.end < offsets.length,
          `Invalid gold span in ${document.id}`,
        );
        const start = offsets[entity.start]!;
        const end = offsets[entity.end]!;
        const surface = document.text.slice(start, end);
        const inCatalog = catalogKeys.has(fold(surface));
        if (!inCatalog) unmapped.set(surface, (unmapped.get(surface) ?? 0) + 1);
        return { start, end, inCatalog };
      });
    const annotations = duplicateAnnotations.get(document.text) ?? new Set<string>();
    annotations.add(JSON.stringify(document.entities));
    duplicateAnnotations.set(document.text, annotations);
    const predicted = [
      ...new Map(
        findVehicles(document.text).map((match) => {
          assert.equal(
            document.text.slice(match.start, match.end),
            match.matchedText,
            `Prediction offset in ${document.id}`,
          );
          assert.ok(match.start >= 0 && match.end > match.start && match.end <= document.text.length);
          return [`${match.start}:${match.end}`, { start: match.start, end: match.end }] as const;
        }),
      ).values(),
    ];
    const exact = matchSpans(predicted, gold);
    const overlap = matchSpans(predicted, gold, true);
    for (const tally of uniqueIds.has(document.id) ? [all, distinct] : [all]) {
      tally.documents++;
      tally.predictions += predicted.length;
      tally.gold += gold.length;
      tally.exact += exact.size;
      tally.overlap += overlap.size;
      gold.forEach((span, i) => {
        if (span.inCatalog) {
          tally.catalogGold++;
          if (exact.has(i)) tally.catalogExact++;
          if (overlap.has(i)) tally.catalogOverlap++;
        } else {
          tally.unmappedGold++;
          if (exact.has(i)) tally.unmappedExact++;
          if (overlap.has(i)) tally.unmappedOverlap++;
        }
      });
    }
  }
  assert.equal(all.gold, manifest.expected.acceptedModelSpans);
  for (const path of sourceFiles)
    assert.equal(
      sha256(await readFile(new URL(path, root))),
      implementationHashes[path],
      'Implementation changed during evaluation; rerun with a stable source snapshot',
    );
  const report = {
    corpus: manifest.name,
    commit: manifest.commit,
    dataSha256: manifest.files[0].sha256,
    implementationHashes,
    node: process.version,
    fuzzy: true,
    scope:
      'Diagnostic span agreement with accepted UK advertisements; advertised-vehicle labels differ from general mention extraction.',
    canonicalCandidateScoring: false,
    authorshipSplitAvailable: false,
    source: {
      records: documents.length,
      accepted: accepted.length,
      uniqueAcceptedTexts: unique.length,
      duplicateAcceptedRows: accepted.length - unique.length,
      duplicateTextGroupsWithDifferentAnnotations: [...duplicateAnnotations.values()].filter(
        (values) => values.size > 1,
      ).length,
      nonBmpAcceptedDocuments: nonBmpAccepted,
    },
    allAcceptedRows: metrics(all),
    firstAcceptedRowPerExactText: metrics(distinct),
    unmappedGoldSurfaces: [...unmapped]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([surface, count]) => ({ surface, count })),
  };
  await writeFile(new URL('results.json', directory), JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify(
      {
        source: report.source,
        allAcceptedRows: report.allAcceptedRows,
        firstAcceptedRowPerExactText: report.firstAcceptedRowPerExactText,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
