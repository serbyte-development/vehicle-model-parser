import assert from 'node:assert/strict';
import test from 'node:test';
import { acceptedUnique, codePointOffsets, matchSpans } from '../scripts/evaluate-public.js';

test('public diagnostic converts source code points to UTF-16', () => {
  const text = '🚙 Camry 🛠';
  const offsets = codePointOffsets(text);
  assert.deepEqual(offsets, [0, 2, 3, 4, 5, 6, 7, 8, 9, 11]);
  assert.equal(text.slice(offsets[2], offsets[7]), 'Camry');
});

test('public diagnostic overlap has one-to-one accounting', () => {
  const gold = [
    { start: 0, end: 4 },
    { start: 5, end: 9 },
  ];
  assert.equal(matchSpans([{ start: 0, end: 9 }], gold, true).size, 1);
  assert.equal(
    matchSpans(
      [
        { start: 0, end: 9 },
        { start: 0, end: 4 },
      ],
      gold,
      true,
    ).size,
    2,
  );
  assert.equal(matchSpans([{ start: 0, end: 9 }], gold).size, 0);
  assert.equal(matchSpans([{ start: 0, end: 4 }], gold).size, 1);
});

test('public diagnostic preserves first accepted duplicate independently of predictions', () => {
  const entities = [{ start: 0, end: 5, label: 'MODEL' }];
  const rows = [
    { id: 0, text: 'Camry', answer: 'reject' as const, entities },
    { id: 1, text: 'Camry', answer: 'accept' as const, entities },
    { id: 2, text: 'Camry', answer: 'accept' as const, entities: [] },
    { id: 3, text: 'Civic', answer: 'accept' as const, entities },
  ];
  assert.deepEqual(
    acceptedUnique(rows).map((row) => row.id),
    [1, 3],
  );
  assert.deepEqual(rows[2]!.entities, []);
});
