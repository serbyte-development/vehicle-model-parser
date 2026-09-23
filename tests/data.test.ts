import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import catalog from '../src/catalog.json';
import manifest from '../data/source/manifest.json';
import { findVehicles } from '../src/index.js';

test('vendored source files retain their pinned SHA-256 identities', async () => {
  assert.equal(manifest.commit, '79018e2dbcc03899bf3434d959b445644fb49b76');
  for (const file of manifest.files) {
    const bytes = await readFile(new URL(`../data/source/${file.path}`, import.meta.url));
    assert.equal(bytes.length, file.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  }
});

test('catalog counts and all catalog pairs are reachable with their exact make', () => {
  assert.equal(catalog.models.length, 1410);
  assert.equal(
    catalog.models.reduce((count, row) => count + row.makes.length, 0),
    1459,
  );
  for (const row of catalog.models)
    for (const make of row.makes) {
      const text = `${make} ${row.model}`;
      const matches = findVehicles(text, { fuzzy: false });
      assert.ok(
        matches.some((match) => match.model === row.model && match.makes.includes(make)),
        text,
      );
    }
});
