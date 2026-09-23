import assert from 'node:assert/strict';
import { test } from 'node:test';
import fc from 'fast-check';
import { findMakes, findVehicles } from '../src/index.js';
import { evaluateCase } from './corpus-evaluate.js';
import { authoredCases } from './fixtures/authored.js';

const seed = 20_260_917;

test('arbitrary Unicode preserves deterministic source spans and sorted make unions', () => {
  fc.assert(
    fc.property(fc.string({ unit: 'binary', maxLength: 500 }), (text) => {
      const original = text;
      const matches = findVehicles(text);
      assert.deepEqual(findVehicles(text), matches);
      assert.equal(text, original);
      assert.deepEqual(findMakes(text), [...new Set(matches.flatMap(({ makes }) => makes))].sort());
      for (const match of matches) {
        assert.ok(Number.isInteger(match.start) && Number.isInteger(match.end));
        assert.ok(match.start >= 0 && match.end > match.start && match.end <= text.length);
        assert.equal(text.slice(match.start, match.end), match.matchedText);
        assert.deepEqual(match.makes, [...new Set(match.makes)].sort());
      }
    }),
    { seed, numRuns: 500 },
  );
});

test('case, punctuation, and emoji prefixes preserve authored distinctive identities and shift UTF-16 spans', () => {
  const baseCases = authoredCases.filter(({ id }) =>
    ['c01', 'c02', 'c04', 'c05', 'c25', 'c28', 's03', 's06'].includes(id),
  );
  fc.assert(
    fc.property(
      fc.constantFrom(...baseCases),
      fc.constantFrom('', '🚙 ', '👩🏽‍🔧 ', 'Cafe\u0301: ', '\r\n', '( '),
      fc.boolean(),
      (fixture, prefix, uppercase) => {
        const text = prefix + (uppercase ? fixture.text.toUpperCase() : fixture.text.toLowerCase());
        const expected = fixture.expected.map((mention) => ({
          ...mention,
          start: mention.start + prefix.length,
          end: mention.end + prefix.length,
          matchedText: uppercase ? mention.matchedText.toUpperCase() : mention.matchedText.toLowerCase(),
        }));
        const result = evaluateCase({ ...fixture, text, expected });
        assert.equal(result.pass, true, JSON.stringify(result));
      },
    ),
    { seed, numRuns: 300 },
  );
});

test('fuzzy:false removes algorithmic typos and preserves exact model evidence', () => {
  for (const [text, model] of [
    ['my camery needs a wash', 'Camry'],
    ['my silverdo needs film', 'Silverado'],
    ['my Jeep wranger needs cleaning', 'Wrangler'],
  ]) {
    assert.ok(
      findVehicles(text).some((match) => match.model === model),
      text,
    );
    assert.deepEqual(findVehicles(text, { fuzzy: false }), [], text);
  }
  assert.deepEqual(
    findVehicles('My Toyota Camry needs film.', { fuzzy: false }),
    findVehicles('My Toyota Camry needs film.'),
  );
});

test('editing one result cannot change subsequent calls', () => {
  const text = 'My Toyota Camry and Honda Civic need film.';
  const expected = findVehicles(text);
  const changed = findVehicles(text);
  changed[0].makes.push('Invented make');
  changed[0].model = 'Invented model';
  changed.length = 0;
  assert.deepEqual(findVehicles(text), expected);
});

test('long negative input stays negative and a terminal vehicle is never truncated', () => {
  for (const length of [10_000, 100_000, 1_000_000]) {
    const negative = 'Please clean the seats and remove the dust. '.repeat(Math.ceil(length / 43)).slice(0, length);
    assert.deepEqual(findVehicles(negative), []);
    const suffix = '\nMy Toyota Camry needs paint protection.';
    const text = negative + suffix;
    const matches = findVehicles(text);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].model, 'Camry');
    assert.equal(matches[0].start, negative.length + suffix.indexOf('Camry'));
    assert.equal(matches[0].matchedText, 'Camry');
  }
});
