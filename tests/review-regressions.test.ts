/** Cases authored after production inspection. These are disclosed regressions. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { findVehicles } from '../src/index.js';

test('review regression R1: the next comma-separated vehicle does not widen a preceding make', () => {
  for (const [first, second] of [
    ['Bentley', 'Lincoln'],
    ['Lincoln', 'Bentley'],
  ]) {
    const text = `${first} Continental, ${second} Continental.`;
    const matches = findVehicles(text);
    assert.equal(matches.length, 2);
    assert.deepEqual(
      matches.map((match) => match.makes),
      [[first], [second]],
    );
    for (const match of matches) assert.equal(text.slice(match.start, match.end), match.matchedText);
  }
});

test('review regression R1: suffix and mixed make syntax respect mention separators', () => {
  for (const [first, second] of [
    ['Bentley', 'Lincoln'],
    ['Lincoln', 'Bentley'],
  ]) {
    for (const text of [
      `Continental ${first}, Continental ${second}.`,
      `Continental (${first}), Continental (${second}).`,
      `${first} Continental, Continental (${second}).`,
      `Continental (${first}), ${second} Continental.`,
    ]) {
      assert.deepEqual(
        findVehicles(text).map((match) => match.makes),
        [[first], [second]],
        text,
      );
    }
  }
});

test('review regression: strong-context wranger preserves the complete one-edit tie', () => {
  assert.deepEqual(
    findVehicles('Need PPF for my wranger.').map(({ model, makes }) => ({ model, makes })),
    [
      { model: 'Ranger', makes: ['Ford'] },
      { model: 'Wrangler', makes: ['Jeep'] },
    ],
  );
  assert.deepEqual(
    findVehicles('Jeep wranger needs PPF.').map(({ model, makes }) => ({ model, makes })),
    [{ model: 'Wrangler', makes: ['Jeep'] }],
  );
});

test('review regression R2: fuzzy matching preserves short letter-code identities', () => {
  assert.deepEqual(findVehicles('Mercedes-Benz D-Class needs PPF.'), []);
  assert.deepEqual(findVehicles('Tesla Model Z needs PPF.'), []);
  assert.deepEqual(
    findVehicles('Mercedes-Benz C-Class needs PPF.').map((match) => match.model),
    ['C-Class'],
  );
  assert.deepEqual(
    findVehicles('Tesla Model Y needs PPF.').map((match) => match.model),
    ['Model Y'],
  );
});
