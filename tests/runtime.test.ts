import assert from 'node:assert/strict';
import test from 'node:test';
import fc from 'fast-check';
import damerau from 'levenshtein-lte1/damerau.js';
import { findMakes, findVehicles } from '../src/index.js';

test('public example and original UTF-16 spans', () => {
  assert.deepEqual(findVehicles("I've had my 4runner for 6months"), [
    {
      model: '4Runner',
      makes: ['Toyota'],
      matchedText: '4runner',
      start: 12,
      end: 19,
      matchType: 'exact',
    },
  ]);
  const text = '🚗 Cafe\u0301: My Ｃａｍｒｙ and Toyota 4Runner’s hood.';
  const results = findVehicles(text);
  assert.deepEqual(
    results.map((match) => match.model),
    ['Camry', '4Runner'],
  );
  for (const match of results) assert.equal(text.slice(match.start, match.end), match.matchedText);
});

test('compact output returns make/model pairs and preserves ambiguity', () => {
  assert.deepEqual(findVehicles("I've had my 4runner for 6months", { output: 'compact' }), [
    { make: 'Toyota', model: '4Runner' },
  ]);
  assert.deepEqual(findVehicles('I own a Continental and want leather cleaned', { output: 'compact' }), [
    { make: 'Bentley', model: 'Continental' },
    { make: 'Lincoln', model: 'Continental' },
  ]);
  assert.deepEqual(findVehicles('Need PPF for my silverdo', { output: 'compact' }), [
    { make: 'Chevrolet', model: 'Silverado' },
  ]);
});

test('reviewed formatting and family names preserve source detail', () => {
  for (const value of ['4 runner', '4-runner', '４ＲＵＮＮＥＲ'])
    assert.equal(findVehicles(value)[0]?.model, '4Runner');
  for (const value of ['f150', 'F-150', 'f 150']) assert.equal(findVehicles(value)[0]?.model, 'F-150');
  for (const value of ['cx5', 'CX 5', 'CX‑5']) assert.equal(findVehicles(value)[0]?.model, 'CX-5');
  assert.deepEqual(
    findVehicles('Ford F150 Regular Cab').map((match) => match.model),
    ['F150 Regular Cab'],
  );
  assert.deepEqual(
    findVehicles('Dodge Ram 1500 Crew Cab').map((match) => match.model),
    ['Ram 1500 Crew Cab'],
  );
  assert.deepEqual(
    findVehicles('My Mustang MACH-E needs tint').map((match) => match.model),
    ['Mustang MACH-E'],
  );
});

test('single-edit Damerau corrections, preserved ties, and disabling fuzzy', () => {
  assert.deepEqual(findMakes('Need PPF for my silverdo'), ['Chevrolet']);
  assert.deepEqual(findMakes('My camery needs a wash'), ['Toyota']);
  assert.deepEqual(
    findVehicles('My Jeep wranger needs tint').map((match) => match.model),
    ['Wrangler'],
  );
  assert.deepEqual(
    findVehicles('My wranger needs tint').map((match) => match.model),
    ['Ranger', 'Wrangler'],
  );
  assert.deepEqual(
    findVehicles('My toyota tacmoa needs tint').map((match) => match.model),
    ['Tacoma'],
  );
  assert.deepEqual(findVehicles('My camery needs a wash', { fuzzy: false }), []);
  assert.equal(findVehicles('Toyota corrola', { fuzzy: false })[0]?.matchType, 'alias');
  assert.deepEqual(findVehicles('BMW X9'), []);
  assert.deepEqual(findVehicles('Mercedes-Benz D-Class needs PPF.'), []);
  assert.deepEqual(
    findVehicles('My Land Cruser needs PPF.').map((match) => match.model),
    ['Land Cruiser'],
  );
});

test('true associations and normalization collisions remain intact', () => {
  assert.deepEqual(findMakes('Toyota Civic'), ['Honda']);
  assert.deepEqual(findMakes('I own a Continental and want leather cleaned'), ['Bentley', 'Lincoln']);
  assert.deepEqual(findMakes('Lincoln Continental'), ['Lincoln']);
  assert.deepEqual(
    findVehicles('My 500e needs tint').map((match) => match.model),
    ['500 E', '500e'],
  );
  assert.deepEqual(
    findVehicles('FIAT 500e').map((match) => match.model),
    ['500e'],
  );
  assert.deepEqual(
    findVehicles('Mercedes-Benz 500 E').map((match) => match.model),
    ['500 E'],
  );
  assert.deepEqual(
    findVehicles('Genesis GV70').map((match) => match.model),
    ['GV70'],
  );
  assert.deepEqual(
    findVehicles('Hyundai Genesis').map((match) => match.model),
    ['Genesis'],
  );
});

test('common language, URLs, identifiers, numbers and make-only text abstain', () => {
  for (const text of [
    'My focus is on paint protection',
    'wrap the edge of the film',
    'We have reached an accord.',
    'My battery charger was left in the trunk.',
    'There is air trapped under the film.',
    'Toyota',
    'Can you quote a Chevy?',
    'Call 208-555-9110 about invoice 1500.',
    'https://example.com/Camry',
    'www.Civic.example/4Runner',
    'camry@honda.example',
    'abc4runnerxyz',
    'Camryish',
    'pre_corolla_post',
    'Book a wash for two cars.',
  ])
    assert.deepEqual(findVehicles(text), [], text);
  assert.deepEqual(
    findVehicles('The edge of my Ford Edge needs repair.').map((match) => match.matchedText),
    ['Edge'],
  );
  assert.deepEqual(
    findVehicles('My Honda Fit. Please focus on the seats.').map((match) => match.model),
    ['Fit'],
  );
});

test('original punctuation in a full source name is included in the span', () => {
  const text = 'Quote Audi A4 (2005.5) today';
  assert.equal(findVehicles(text)[0]?.matchedText, 'A4 (2005.5)');
  assert.equal(findVehicles('Audi Ａ４ （２００５．５）')[0]?.matchedText, 'Ａ４ （２００５．５）');
  assert.equal(findVehicles('Volkswagen ID.Buzz')[0]?.model, 'ID.Buzz');
  for (const text of [
    'Volkswagen ID.Buzz.',
    'Volkswagen ID.Buzz, please.',
    'My ID.Buzz (Volkswagen) needs paint correction.',
    'Make: Volkswagen\nModel: ID.Buzz\nService: full detail.',
  ])
    assert.equal(findVehicles(text)[0]?.model, 'ID.Buzz', text);
});

test('make context supports labeled fields and parentheticals without crossing vehicle clauses', () => {
  assert.deepEqual(findMakes('Make: Acura\nModel: CL\nService: tint'), ['Acura']);
  assert.deepEqual(findMakes('My CL (Acura) needs tint'), ['Acura']);
  assert.deepEqual(
    findVehicles('Bentley Continental, Lincoln Continental.').map((match) => match.makes),
    [['Bentley'], ['Lincoln']],
  );
  assert.deepEqual(
    findVehicles('Continental Bentley, Continental Lincoln.').map((match) => match.makes),
    [['Bentley'], ['Lincoln']],
  );
  assert.deepEqual(
    findVehicles('I own a Continental, Lincoln Continental.').map((match) => match.makes),
    [['Bentley', 'Lincoln'], ['Lincoln']],
  );
});

test('argument boundary validation', () => {
  for (const value of [null, 42, {}, [], undefined]) assert.throws(() => findVehicles(value as never), TypeError);
  for (const value of [null, true, 'yes', [], { fuzzy: 1 }, { fuzzy: null }]) {
    assert.throws(() => findVehicles('Camry', value as never), TypeError);
  }
  assert.throws(() => findVehicles('Camry', { output: 'summary' } as never), TypeError);
  assert.deepEqual(findVehicles(''), []);
  assert.deepEqual(findVehicles(' \t\r\n'), []);
});

test('repeated matches, ordering, sorted makes, and caller mutation isolation', () => {
  const text = 'My Camry, Civic, and Camry need tint.';
  const expected = findVehicles(text);
  assert.deepEqual(
    expected.map((match) => match.model),
    ['Camry', 'Civic', 'Camry'],
  );
  assert.deepEqual(findMakes(text), ['Honda', 'Toyota']);
  const changed = findVehicles(text);
  changed[0].makes.push('Invalid');
  changed[0].model = 'Invalid';
  changed.pop();
  assert.deepEqual(findVehicles(text), expected);
});

test('seeded Unicode properties preserve spans and deterministic results', () => {
  fc.assert(
    fc.property(fc.string({ unit: 'binary', maxLength: 200 }), (text) => {
      const matches = findVehicles(text);
      assert.deepEqual(findVehicles(text), matches);
      for (const match of matches) {
        assert.ok(match.start >= 0 && match.end > match.start && match.end <= text.length);
        assert.equal(text.slice(match.start, match.end), match.matchedText);
        assert.deepEqual(match.makes, [...new Set(match.makes)].sort());
      }
    }),
    { seed: 730219, numRuns: 1000 },
  );
});

test('1 MB arbitrary tokens and late exact matches are scanned completely', () => {
  const prefix = 'unrecognizedvocabulary '.repeat(50000);
  const text = prefix + 'Toyota Camry';
  const matches = findVehicles(text);
  assert.deepEqual(
    matches.map((match) => match.model),
    ['Camry'],
  );
  assert.equal(matches[0].start, prefix.length + 7);
  assert.deepEqual(findVehicles('x'.repeat(1_000_000)), []);
});

test('dependency agrees with an independent small Damerau distance oracle', () => {
  function distance(a: string, b: string): number {
    const d = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) d[i][0] = i;
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    return d[a.length][b.length];
  }
  const word = fc.array(fc.constantFrom('a', 'b', 'c'), { maxLength: 8 }).map((letters) => letters.join(''));
  fc.assert(
    fc.property(word, word, (a, b) => {
      const expected = distance(a, b);
      assert.equal(damerau(a, b), expected <= 1 ? expected : Infinity);
    }),
    { seed: 121001, numRuns: 2000 },
  );
});
