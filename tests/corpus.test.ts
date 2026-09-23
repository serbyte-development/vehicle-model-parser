import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateCase } from './corpus-evaluate.js';
import { authoredCases, realCases } from './fixtures/authored.js';
import { readSourceCatalog, sourceCases } from './fixtures/source.js';

test('authored provenance, minimum coverage, unique IDs and independently labeled spans', () => {
  assert.ok(authoredCases.length >= 180);
  assert.ok(authoredCases.filter(({ expected }) => expected.length === 0).length >= 50);
  assert.equal(realCases.length, 1);
  const all = [...authoredCases, ...realCases];
  assert.equal(new Set(all.map(({ id }) => id)).size, all.length);
  assert.equal(new Set(all.map(({ text }) => text)).size, all.length);
  for (const fixture of all) {
    for (const mention of fixture.expected) {
      assert.equal(fixture.text.slice(mention.start, mention.end), mention.matchedText, fixture.id);
    }
  }
  assert.ok(authoredCases.every(({ provenance }) => provenance === 'hand-authored-synthetic'));
  assert.equal(realCases[0].provenance, 'user-provided-real-anonymized');
});

for (const fixture of [...authoredCases, ...realCases]) {
  test(`${fixture.provenance}: ${fixture.id} (${fixture.category})`, () => {
    const result = evaluateCase(fixture);
    assert.equal(result.pass, true, JSON.stringify({ text: fixture.text.slice(0, 500), ...result }, null, 2));
  });
}

test('every pinned source make/model pair resolves with its complete normalized label alternatives', () => {
  const catalog = readSourceCatalog();
  let count = 0;
  const failures: unknown[] = [];
  for (const fixture of sourceCases(catalog)) {
    count++;
    const result = evaluateCase(fixture);
    if (!result.pass) failures.push({ id: fixture.id, text: fixture.text, ...result });
  }
  assert.equal(count, 1_459);
  assert.equal(
    failures.length,
    0,
    JSON.stringify({ failureCount: failures.length, examples: failures.slice(0, 20) }, null, 2),
  );
});
