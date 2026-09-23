/** Frozen PRD cases authored before reading runtime rules, 2026-09-17.
 * Once shared for fixes, these are review regressions. See docs/review.md. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { findMakes, findVehicles } from '../src/index.js';

interface Expected {
  text: string;
  model: string;
  makes: string[];
  occurrence?: number;
}
interface Case {
  id: string;
  text: string;
  expected: Expected[];
  fuzzy?: boolean;
}
const e = (text: string, model: string, makes: string[], occurrence = 0): Expected => ({
  text,
  model,
  makes,
  occurrence,
});

// Expectations are independent of parser output. Keep labels frozen.
const cases: Case[] = [
  { id: 'astral-prefix', text: '🚙🔧 Toyota Camry needs PPF.', expected: [e('Camry', 'Camry', ['Toyota'])] },
  { id: 'combining-prefix', text: 'Cafe\u0301: Toyota Camry needs PPF.', expected: [e('Camry', 'Camry', ['Toyota'])] },
  { id: 'nfkc-fullwidth', text: 'Toyota Ｃａｍｒｙ needs PPF.', expected: [e('Ｃａｍｒｙ', 'Camry', ['Toyota'])] },
  { id: 'unicode-possessive', text: 'My Toyota Camry’s hood needs PPF.', expected: [e('Camry', 'Camry', ['Toyota'])] },
  {
    id: 'nbsp-model',
    text: 'Land Rover Range\u00a0Rover Sport needs PPF.',
    expected: [e('Range\u00a0Rover Sport', 'Range Rover Sport', ['Land Rover'])],
  },
  {
    id: 'unpaired-surrogate-prefix',
    text: String.fromCharCode(0xd800) + ' Toyota Corolla needs PPF.',
    expected: [e('Corolla', 'Corolla', ['Toyota'])],
  },
  {
    id: 'repeated-model',
    text: 'Toyota Corolla, Corolla and Corolla.',
    expected: [
      e('Corolla', 'Corolla', ['Toyota']),
      e('Corolla', 'Corolla', ['Toyota'], 1),
      e('Corolla', 'Corolla', ['Toyota'], 2),
    ],
  },
  {
    id: 'repeated-qualified-ambiguity',
    text: 'Bentley Continental. Lincoln Continental.',
    expected: [e('Continental', 'Continental', ['Bentley']), e('Continental', 'Continental', ['Lincoln'], 1)],
  },
  { id: 'ls-ambiguity', text: 'Need PPF for my LS.', expected: [e('LS', 'LS', ['Lexus', 'Lincoln'])] },
  { id: 'nx-ambiguity', text: 'Need PPF for my NX.', expected: [e('NX', 'NX', ['Lexus', 'Nissan'])] },
  { id: 'viper-ambiguity', text: 'Need PPF for my Viper.', expected: [e('Viper', 'Viper', ['Dodge', 'SRT'])] },
  {
    id: 'normalized-code-collision',
    text: 'Need PPF for my 500e.',
    expected: [e('500e', '500e', ['FIAT']), e('500e', '500 E', ['Mercedes-Benz'])],
  },
  { id: 'fiat-collision-qualified', text: 'FIAT 500e needs PPF.', expected: [e('500e', '500e', ['FIAT'])] },
  {
    id: 'mercedes-collision-qualified',
    text: 'Mercedes-Benz 500 E needs PPF.',
    expected: [e('500 E', '500 E', ['Mercedes-Benz'])],
  },
  { id: 'contradictory-make', text: 'Toyota Civic needs PPF.', expected: [e('Civic', 'Civic', ['Honda'])] },
  {
    id: 'adjacent-different-vehicles',
    text: 'Honda Civic and Toyota Corolla need PPF.',
    expected: [e('Civic', 'Civic', ['Honda']), e('Corolla', 'Corolla', ['Toyota'])],
  },
  {
    id: 'make-stops-at-sentence',
    text: 'Bentley Continental. My Lincoln needs paint. Need PPF for my Continental.',
    expected: [
      e('Continental', 'Continental', ['Bentley']),
      e('Continental', 'Continental', ['Bentley', 'Lincoln'], 1),
    ],
  },
  {
    id: 'fit-after-real-vehicle',
    text: 'Honda Civic. I am trying to fit a seat cover.',
    expected: [e('Civic', 'Civic', ['Honda'])],
  },
  {
    id: 'focus-after-real-vehicle',
    text: 'Ford Mustang. My focus is on paint protection.',
    expected: [e('Mustang', 'Mustang', ['Ford'])],
  },
  {
    id: 'air-after-real-vehicle',
    text: 'Need PPF for my Camry and an air filter.',
    expected: [e('Camry', 'Camry', ['Toyota'])],
  },
  {
    id: 'edge-after-real-vehicle',
    text: 'My Toyota Camry needs a wrap along the edge.',
    expected: [e('Camry', 'Camry', ['Toyota'])],
  },
  { id: 'ordinary-travel-words', text: 'The pilot will bring golf clubs for the journey home.', expected: [] },
  { id: 'ordinary-automotive-nouns', text: 'My car needs a compass, a seat cover, and fresh air.', expected: [] },
  { id: 'nearby-make-is-insufficient', text: 'The Ford invoice says to focus on the edge of the wrap.', expected: [] },
  { id: 'numbers-and-emergency', text: 'I paid 500 dollars for 2 hours. Call 911.', expected: [] },
  { id: 'code-like-office-language', text: 'Toyota receipt: A4 paper, Q3 totals, 2026 reference.', expected: [] },
  { id: 'urls-and-email', text: 'See https://example.test/Toyota/Camry and email civic@example.test.', expected: [] },
  {
    id: 'url-adjacent-real-mention',
    text: 'https://example.test/Camry Toyota Corolla needs PPF.',
    expected: [e('Corolla', 'Corolla', ['Toyota'])],
  },
  { id: 'embedded-substrings', text: 'xxCamry99 civicson my4runner', expected: [] },
  { id: 'sentence-boundary-fragments', text: 'I need the full range. Rover is a dog.', expected: [] },
  { id: 'numeric-fragment-after-boundary', text: 'Tesla Model.\n3 invoices attached.', expected: [] },
  {
    id: 'longest-mustang',
    text: 'Ford Mustang MACH-E and Ford Mustang need PPF.',
    expected: [e('Mustang MACH-E', 'Mustang MACH-E', ['Ford']), e('Mustang', 'Mustang', ['Ford'], 1)],
  },
  {
    id: 'longest-civic',
    text: 'Honda Civic Type R and Honda Civic need PPF.',
    expected: [e('Civic Type R', 'Civic Type R', ['Honda']), e('Civic', 'Civic', ['Honda'], 1)],
  },
  {
    id: 'longest-cherokee',
    text: 'Jeep Grand Cherokee L needs PPF.',
    expected: [e('Grand Cherokee L', 'Grand Cherokee L', ['Jeep'])],
  },
  {
    id: 'vetted-family-formatting',
    text: 'My f 150 and my 4 runner need PPF.',
    expected: [e('f 150', 'F-150', ['Ford']), e('4 runner', '4Runner', ['Toyota'])],
  },
  {
    id: 'deletion-silverado',
    text: 'Need PPF for my silverdo.',
    expected: [e('silverdo', 'Silverado', ['Chevrolet'])],
  },
  { id: 'insertion-camry', text: 'Need PPF for my camery.', expected: [e('camery', 'Camry', ['Toyota'])] },
  // Main adjudication: both candidates are one edit away. Original label preserved in the freeze snapshot.
  {
    id: 'deletion-wrangler',
    text: 'Need PPF for my wranger.',
    expected: [e('wranger', 'Ranger', ['Ford']), e('wranger', 'Wrangler', ['Jeep'])],
  },
  { id: 'numeric-identities-no-fuzzy', text: 'Audi A5x; BMW X5x; Toyota RAV5.', expected: [] },
  {
    id: 'fuzzy-disabled-preserves-exact',
    text: 'Toyota Camry and my camery need PPF.',
    fuzzy: false,
    expected: [e('Camry', 'Camry', ['Toyota'])],
  },
  { id: 'empty-input', text: '', expected: [] },
];

function nthIndex(text: string, fragment: string, occurrence: number): number {
  let position = -1;
  for (let i = 0; i <= occurrence; i++) {
    position = text.indexOf(fragment, position + 1);
    assert.ok(position >= 0, `Invalid frozen expectation: ${fragment}`);
  }
  return position;
}
function comparable<T extends { start: number; end: number; model: string }>(values: T[]): T[] {
  return values.sort((a, b) => a.start - b.start || a.end - b.end || a.model.localeCompare(b.model));
}
for (const fixture of cases) {
  test(`review frozen: ${fixture.id}`, () => {
    const matches = findVehicles(fixture.text, fixture.fuzzy === undefined ? undefined : { fuzzy: fixture.fuzzy });
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]!;
      assert.equal(fixture.text.slice(match.start, match.end), match.matchedText);
      assert.ok(match.end > match.start);
      assert.deepEqual(match.makes, [...new Set(match.makes)].sort());
      assert.ok(['exact', 'alias', 'fuzzy'].includes(match.matchType));
      if (i) assert.ok(matches[i - 1]!.start <= match.start, 'Results retain source order');
    }
    const expected = fixture.expected.map(({ text, model, makes, occurrence = 0 }) => {
      const start = nthIndex(fixture.text, text, occurrence);
      return { model, makes, matchedText: text, start, end: start + text.length };
    });
    assert.deepEqual(
      comparable(
        matches.map(({ model, makes, matchedText, start, end }) => ({ model, makes, matchedText, start, end })),
      ),
      comparable(expected),
    );
  });
}

test('review frozen: fuzzy tie is preserved or abstained', () => {
  // Traker is one deletion from Tracker and one substitution from Tracer.
  const matches = findVehicles('Need PPF for my Traker.');
  assert.ok(
    matches.length === 0 ||
      JSON.stringify([...new Set(matches.map((x) => x.model))].sort()) === JSON.stringify(['Tracer', 'Tracker']),
    'A fuzzy tie must preserve all candidates or abstain',
  );
  for (const match of matches) assert.equal(match.matchType, 'fuzzy');
});

test('review frozen: options default, false, true and match type', () => {
  const text = 'Need PPF for my camery.';
  assert.deepEqual(findVehicles(text), findVehicles(text, { fuzzy: true }));
  assert.deepEqual(findVehicles(text, { fuzzy: false }), []);
  assert.equal(findVehicles(text)[0]?.matchType, 'fuzzy');
  assert.equal(findVehicles('Toyota Camry')[0]?.matchType, 'exact');
});

test('review frozen: invalid external arguments produce TypeErrors', () => {
  for (const fn of [findVehicles, findMakes]) {
    const external = fn as (...args: unknown[]) => unknown;
    for (const text of [null, undefined, 123, {}, [], new String('Camry')]) {
      assert.throws(() => external(text), TypeError);
    }
    for (const options of [null, false, 1, 'fuzzy', [], { fuzzy: 'false' }, { fuzzy: null }]) {
      assert.throws(() => external('Toyota Camry', options), TypeError);
    }
  }
});

test('review frozen: findMakes is a sorted unique union', () => {
  assert.deepEqual(findMakes('Toyota Camry, Honda Civic, and Toyota Corolla.'), ['Honda', 'Toyota']);
  assert.deepEqual(findMakes('Toyota and Honda.'), []);
  assert.deepEqual(findMakes('Need PPF for my camery.', { fuzzy: false }), []);
});

test('review frozen: caller mutation cannot pollute the next result', () => {
  const first = findVehicles('Need PPF for my Continental.');
  const original = structuredClone(first);
  first[0]!.makes.push('Invalid');
  first[0]!.model = 'Invalid';
  first.push({ ...first[0]!, start: 0 });
  assert.deepEqual(findVehicles('Need PPF for my Continental.'), original);
});

test('review frozen: independent messages and deterministic output', () => {
  const baseline = findVehicles('Need PPF for my Continental.');
  for (const text of ['Bentley Continental', 'Lincoln Continental', 'Toyota Civic', 'FIAT 500e']) findVehicles(text);
  assert.deepEqual(findVehicles('Need PPF for my Continental.'), baseline);
  assert.deepEqual(
    baseline.map((x) => x.makes),
    [['Bentley', 'Lincoln']],
  );
});

test('review frozen: long input reaches the end and rejects one enormous token', { timeout: 30_000 }, () => {
  const prefix = 'zzzzzzzz '.repeat(120_000);
  const text = prefix + '🚙 Toyota Camry';
  const matches = findVehicles(text);
  assert.equal(matches.length, 1);
  assert.equal(matches[0]?.start, text.lastIndexOf('Camry'));
  assert.equal(text.slice(matches[0]!.start, matches[0]!.end), 'Camry');
  assert.deepEqual(findVehicles('z'.repeat(1_000_000)), []);
});
