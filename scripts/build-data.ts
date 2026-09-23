import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { familyDefinitions } from '../src/families.js';

const root = new URL('../', import.meta.url);
const source = new URL('data/source/', root);
const manifest = JSON.parse(await readFile(new URL('manifest.json', source), 'utf8')) as {
  commit: string;
  files: { path: string; sha256: string; bytes: number }[];
  expected: {
    files: number;
    rows: number;
    makes: number;
    models: number;
    pairs: number;
    rows2025: number;
    rows2026: number;
  };
};
const expected = { files: 35, rows: 11543, makes: 66, models: 1410, pairs: 1459, rows2025: 28, rows2026: 3 };
assert.equal(manifest.commit, '79018e2dbcc03899bf3434d959b445644fb49b76');
assert.deepEqual(manifest.expected, expected);
assert.deepEqual(
  (await readdir(source)).filter((name) => name.endsWith('.csv')).sort(),
  Array.from({ length: 35 }, (_, i) => `${1992 + i}.csv`),
);
assert.deepEqual(
  manifest.files.map((file) => file.path).sort(),
  [...Array.from({ length: 35 }, (_, i) => `${1992 + i}.csv`), 'LICENSE', 'README.md'].sort(),
);

const byModel = new Map<string, Set<string>>();
const makes = new Set<string>();
const triples = new Set<string>();
const yearly: Record<string, number> = {};
let rows = 0;
for (const file of manifest.files) {
  const bytes = await readFile(new URL(file.path, source));
  assert.equal(bytes.length, file.bytes, `${file.path}: byte count`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `${file.path}: checksum`);
  if (!file.path.endsWith('.csv')) continue;
  const records = parse(bytes, {
    bom: true,
    skip_empty_lines: true,
    columns: (header: string[]) => {
      assert.deepEqual(header, ['year', 'make', 'model', 'body_styles'], `${file.path}: schema`);
      return header;
    },
  }) as Record<string, string>[];
  yearly[file.path.slice(0, 4)] = records.length;
  for (const row of records) {
    assert.equal(row.year, file.path.slice(0, 4), `${file.path}: year`);
    assert.ok(row.make && row.model && row.make.trim() === row.make && row.model.trim() === row.model);
    if (row.body_styles) {
      const styles: unknown = JSON.parse(row.body_styles);
      assert.ok(Array.isArray(styles) && styles.every((style) => typeof style === 'string'));
    }
    const triple = JSON.stringify([row.year, row.make, row.model]);
    assert.ok(!triples.has(triple), `Duplicate source triple: ${triple}`);
    triples.add(triple);
    const values = byModel.get(row.model) ?? new Set<string>();
    values.add(row.make);
    byModel.set(row.model, values);
    makes.add(row.make);
    rows++;
  }
}
const models = [...byModel]
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  .map(([model, values]) => ({ model, makes: [...values].sort() }));
const counts = {
  files: Object.keys(yearly).length,
  rows,
  makes: makes.size,
  models: models.length,
  pairs: models.reduce((total, model) => total + model.makes.length, 0),
  rows2025: yearly['2025'],
  rows2026: yearly['2026'],
};
assert.deepEqual(counts, expected);
const families = familyDefinitions.map((family) => {
  const supported = new Set(
    models
      .filter((entry) => family.prefixes.some((prefix) => entry.model.startsWith(prefix)))
      .flatMap((entry) => entry.makes),
  );
  assert.deepEqual([...supported].sort(), [...family.makes].sort(), `${family.model}: source-supported makes`);
  assert.ok(!byModel.has(family.model), `${family.model}: family already exists in raw catalog`);
  return { model: family.model, makes: [...family.makes].sort(), aliases: [...family.aliases] };
});
await mkdir(new URL('src/', root), { recursive: true });
await writeFile(
  new URL('src/catalog.json', root),
  JSON.stringify(
    {
      schemaVersion: 1,
      source: { commit: manifest.commit, ...counts, yearly },
      models,
      families,
    },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify({ ...counts, families: families.length }));
