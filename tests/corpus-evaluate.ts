import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findMakes, findVehicles } from '../src/index.js';
import { authoredCases, realCases } from './fixtures/authored.js';
import { readSourceCatalog, SOURCE_COMMIT, sourceCases } from './fixtures/source.js';
import type { CorpusCase, ExpectedMention } from './fixtures/types.js';

function mentionKey(mention: ExpectedMention): string {
  return JSON.stringify([mention.start, mention.end, mention.model, [...mention.makes].sort(), mention.matchedText]);
}

export function evaluateCase(fixture: CorpusCase) {
  const actual = findVehicles(fixture.text, fixture.options);
  const errors: string[] = [];
  let previousStart = -1;
  for (const mention of actual) {
    if (
      !Number.isInteger(mention.start) ||
      !Number.isInteger(mention.end) ||
      mention.start < 0 ||
      mention.end <= mention.start ||
      mention.end > fixture.text.length ||
      fixture.text.slice(mention.start, mention.end) !== mention.matchedText
    ) {
      errors.push('Invalid original-text UTF-16 span.');
    }
    if (mention.start < previousStart) errors.push('Occurrences are out of source order.');
    previousStart = mention.start;
    if (!['exact', 'alias', 'fuzzy'].includes(mention.matchType)) errors.push('Invalid matchType.');
    if (
      mention.makes.length === 0 ||
      JSON.stringify(mention.makes) !== JSON.stringify([...new Set(mention.makes)].sort())
    ) {
      errors.push('Makes must be nonempty, sorted, and deduplicated.');
    }
  }
  const expectedMakes = [...new Set(fixture.expected.flatMap(({ makes }) => makes))].sort();
  if (JSON.stringify(findMakes(fixture.text, fixture.options)) !== JSON.stringify(expectedMakes)) {
    errors.push('findMakes differs from the independently labeled make union.');
  }

  // A multiset comparison preserves repeated occurrences and flags duplicate
  // candidates. Only the unspecified order within one ambiguous span is ignored.
  const unmatchedActual = actual.map(mentionKey);
  const missing: ExpectedMention[] = [];
  let truePositive = 0;
  for (const mention of fixture.expected) {
    const index = unmatchedActual.indexOf(mentionKey(mention));
    if (index === -1) missing.push(mention);
    else {
      unmatchedActual.splice(index, 1);
      truePositive++;
    }
  }
  return {
    pass: missing.length === 0 && unmatchedActual.length === 0 && errors.length === 0,
    truePositive,
    falsePositive: unmatchedActual.length,
    falseNegative: missing.length,
    missing,
    unexpected: unmatchedActual.map((key) => JSON.parse(key) as unknown),
    errors,
  };
}

interface Slice {
  cases: number;
  passed: number;
  positiveCases: number;
  negativeCases: number;
  falsePositiveCases: number;
  falseNegativeCases: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  invariantFailures: number;
  failures: unknown[];
}

async function main() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const input = resolve(process.argv[2] ?? `${root}tests/fixtures/generated.jsonl`);
  const reportPath = resolve(process.argv[3] ?? `${root}tests/fixtures/corpus-report.json`);
  const manifestPath = input.replace(/\.jsonl$/, '') + '-manifest.json';
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    sourceCommit: string;
    generatedCases: number;
    counts: Record<string, number>;
    sha256: string;
    seed: number;
  };
  assert.equal(manifest.sourceCommit, SOURCE_COMMIT);
  const slices: Record<string, Slice> = {};
  const seenIds = new Set<string>();
  const started = performance.now();
  const record = (fixture: CorpusCase) => {
    if (seenIds.has(fixture.id)) throw new Error(`Duplicate corpus ID: ${fixture.id}`);
    seenIds.add(fixture.id);
    const name = `${fixture.provenance}/${fixture.category}`;
    if (!slices[name]) {
      slices[name] = {
        cases: 0,
        passed: 0,
        positiveCases: 0,
        negativeCases: 0,
        falsePositiveCases: 0,
        falseNegativeCases: 0,
        truePositive: 0,
        falsePositive: 0,
        falseNegative: 0,
        invariantFailures: 0,
        failures: [],
      };
    }
    const slice = slices[name];
    const result = evaluateCase(fixture);
    slice.cases++;
    slice.passed += Number(result.pass);
    slice.positiveCases += Number(fixture.expected.length > 0);
    slice.negativeCases += Number(fixture.expected.length === 0);
    slice.falsePositiveCases += Number(result.falsePositive > 0);
    slice.falseNegativeCases += Number(result.falseNegative > 0);
    slice.truePositive += result.truePositive;
    slice.falsePositive += result.falsePositive;
    slice.falseNegative += result.falseNegative;
    slice.invariantFailures += Number(result.errors.length > 0);
    if (!result.pass && slice.failures.length < 20) {
      slice.failures.push({ id: fixture.id, text: fixture.text.slice(0, 400), ...result });
    }
  };

  for (const fixture of [...authoredCases, ...realCases]) record(fixture);
  for (const fixture of sourceCases(readSourceCatalog())) record(fixture);
  const generatedCounts: Record<string, number> = {};
  const generatedTexts = new Set<string>();
  const digest = createHash('sha256');
  const stream = createReadStream(input, { encoding: 'utf8' });
  stream.on('data', (chunk) => digest.update(chunk));
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const fixture = JSON.parse(line) as CorpusCase;
    assert.ok(!generatedTexts.has(fixture.text), `Duplicate generated text: ${fixture.id}`);
    generatedTexts.add(fixture.text);
    generatedCounts[fixture.category] = (generatedCounts[fixture.category] ?? 0) + 1;
    record(fixture);
  }
  const inputSha256 = digest.digest('hex');
  assert.equal(inputSha256, manifest.sha256, 'Generated JSONL differs from its recorded SHA256.');
  assert.equal(generatedTexts.size, manifest.generatedCases);
  assert.ok(generatedTexts.size >= 95_000, 'The large evaluation requires the full generated corpus.');
  assert.deepEqual(generatedCounts, manifest.counts, 'Every generated slice must match its manifest count.');
  for (const category of [
    'source-canonical',
    'source-lowercase',
    'source-uppercase',
    'source-fullwidth',
    'source-unicode-separators',
    'source-multiline-spaces',
    'embedded-identifiers',
    'url-boundaries',
    'email-boundaries',
    'trailing-make-context',
    'structured-form',
    'repeated-source-mentions',
    'number-noise',
    'multiple-source-vehicles',
    'composed-hard-negatives',
    'generated-typo-deletion',
    'generated-typo-insertion',
    'generated-typo-substitution',
    'generated-typo-adjacent-swap',
  ]) {
    assert.ok(generatedCounts[category] > 0, `Missing required generated slice: ${category}`);
  }
  const summaries = Object.fromEntries(
    Object.entries(slices).map(([name, slice]) => [
      name,
      {
        ...slice,
        exactSetAgreement: slice.passed / slice.cases,
        precision:
          slice.truePositive + slice.falsePositive === 0
            ? null
            : slice.truePositive / (slice.truePositive + slice.falsePositive),
        recall:
          slice.truePositive + slice.falseNegative === 0
            ? null
            : slice.truePositive / (slice.truePositive + slice.falseNegative),
      },
    ]),
  );
  const cases = Object.values(slices).reduce((sum, slice) => sum + slice.cases, 0);
  const passed = Object.values(slices).reduce((sum, slice) => sum + slice.passed, 0);
  const report = {
    schemaVersion: 1,
    sourceCommit: SOURCE_COMMIT,
    seed: manifest.seed,
    inputSha256,
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    elapsedMs: performance.now() - started,
    cases,
    passed,
    failed: cases - passed,
    slices: summaries,
    interpretation:
      'Candidate-level strict model/make-set/span agreement on labeled synthetic and source-derived data. Real-message results are reported separately.',
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.table(
    Object.entries(slices).map(([slice, result]) => ({
      slice,
      cases: result.cases,
      passed: result.passed,
      falsePositives: result.falsePositive,
      falseNegatives: result.falseNegative,
    })),
  );
  console.log(
    JSON.stringify({ cases, passed, failed: cases - passed, report: reportPath, elapsedMs: report.elapsedMs }),
  );
  if (passed !== cases) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
