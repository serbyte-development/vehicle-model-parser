import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authoredCases } from '../tests/fixtures/authored.js';
import { readSourceCatalog, SOURCE_COMMIT, sourceMentions, spellingKey } from '../tests/fixtures/source.js';
import type { CorpusCase } from '../tests/fixtures/types.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.argv[2] ?? `${root}tests/fixtures/generated.jsonl`);
const catalog = readSourceCatalog();
const seed = 20_260_917;
const counts: Record<string, number> = {};
const mutationCounts = { proposed: 0, exactCollision: 0, ambiguousSameMake: 0, emitted: 0 };
const mutationExclusions: Array<{
  make: string;
  sourceModel: string;
  variant: string;
  reason: string;
  alternatives: string[];
}> = [];

const templates: Array<[string, string]> = [
  ['Please quote my ', ' for paint correction.'],
  ['Vehicle: ', '.\nService: interior cleaning.'],
  ['I bought a ', ' and need film on the hood.'],
  ['Could you wash the ', ' before Friday?'],
  ['Our ', ' has dried sap on the roof. Can you help?'],
  ['Hi, the ', ' has mud under the seats after camping.'],
  ['Requesting headlight restoration for my ', ', please.'],
  ['The booking is for a ', '; call 208-555-0100 after 4.'],
  ['🚙 I am bringing the ', ' for a careful hand wash.'],
  ['Please inspect the paint on this ', ' when I drop it off.'],
];
const forms: Array<[string, (text: string) => string]> = [
  ['canonical', (text) => text],
  ['lowercase', (text) => text.toLowerCase()],
  ['uppercase', (text) => text.toUpperCase()],
  ['unicode-separators', (text) => text.replace(/ /g, '\u00a0').replace(/-/g, '\u2011')],
  ['fullwidth', (text) => text.replace(/[!-~]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0xfee0))],
  ['multiline-spaces', (text) => text.replace(/ /g, ' \t ')],
];

// Independent exhaustive single-edit neighborhood, used only for offline
// collision detection. No matching dependency or production rules are used.
function edits(word: string): Set<string> {
  const result = new Set<string>();
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  for (let index = 0; index <= word.length; index++) {
    for (const char of alphabet) {
      result.add(word.slice(0, index) + char + word.slice(index));
      if (index < word.length) result.add(word.slice(0, index) + char + word.slice(index + 1));
    }
    if (index < word.length) result.add(word.slice(0, index) + word.slice(index + 1));
    if (index + 1 < word.length)
      result.add(word.slice(0, index) + word[index + 1] + word[index] + word.slice(index + 2));
  }
  result.delete(word);
  return result;
}

function* candidates(): Generator<Omit<CorpusCase, 'id'>> {
  for (const pair of catalog.pairs) {
    for (const [form, transform] of forms) {
      for (const [prefix, suffix] of templates) {
        const make = transform(pair.make);
        const model = transform(pair.model);
        yield {
          category: `source-${form}`,
          provenance: 'generated-source',
          text: `${prefix}${make} ${model}${suffix}`,
          expected: sourceMentions(catalog, pair, model, prefix.length + make.length + 1),
        };
      }
    }
    const negativePrefix = `Reference booking${spellingKey(pair.model)}record. `;
    yield {
      category: 'embedded-identifiers',
      provenance: 'generated-synthetic',
      text: `${negativePrefix}Please check the appointment time.`,
      expected: [],
    };
    yield {
      category: 'url-boundaries',
      provenance: 'generated-synthetic',
      text: `The photo link is https://example.invalid/${encodeURIComponent(pair.make)}/${encodeURIComponent(pair.model)}.`,
      expected: [],
    };
    yield {
      category: 'email-boundaries',
      provenance: 'generated-synthetic',
      text: `Please email ${spellingKey(pair.make)}.${spellingKey(pair.model)}@example.invalid with the estimate.`,
      expected: [],
    };
    yield {
      category: 'trailing-make-context',
      provenance: 'generated-source',
      text: `My ${pair.model} (${pair.make}) needs paint correction.`,
      expected: sourceMentions(catalog, pair, pair.model, 3),
    };
    const formPrefix = `Make: ${pair.make}\nModel: `;
    yield {
      category: 'structured-form',
      provenance: 'generated-source',
      text: `${formPrefix}${pair.model}\nService: full detail.`,
      expected: sourceMentions(catalog, pair, pair.model, formPrefix.length),
    };
    const repeatedPrefix = `My ${pair.make} `;
    const repeatedMiddle = `. Please clean the ${pair.make} `;
    yield {
      category: 'repeated-source-mentions',
      provenance: 'generated-source',
      text: `${repeatedPrefix}${pair.model}${repeatedMiddle}${pair.model} before collection.`,
      expected: [
        ...sourceMentions(catalog, pair, pair.model, repeatedPrefix.length),
        ...sourceMentions(catalog, pair, pair.model, repeatedPrefix.length + pair.model.length + repeatedMiddle.length),
      ],
    };
    for (const prefix of [
      'Call 208-555-0199 after 4. Invoice 2024 is for my ',
      'The first quote was 1500. My car is a ',
    ]) {
      const start = prefix.length + pair.make.length + 1;
      yield {
        category: 'number-noise',
        provenance: 'generated-source',
        text: `${prefix}${pair.make} ${pair.model}; please text the estimate.`,
        expected: sourceMentions(catalog, pair, pair.model, start),
      };
    }
  }

  for (let index = 0; index < catalog.pairs.length; index++) {
    const first = catalog.pairs[index];
    for (const stride of [97, 389, 617, 997]) {
      const second = catalog.pairs[(index + stride + seed) % catalog.pairs.length];
      const prefix = `I have a ${first.make} `;
      const middle = `. My partner has a ${second.make} `;
      const secondStart = prefix.length + first.model.length + middle.length;
      yield {
        category: 'multiple-source-vehicles',
        provenance: 'generated-source',
        text: `${prefix}${first.model}${middle}${second.model}. Could you detail both?`,
        expected: [
          ...sourceMentions(catalog, first, first.model, prefix.length),
          ...sourceMentions(catalog, second, second.model, secondStart),
        ],
      };
    }
  }

  const openings = [
    'Hello. ',
    'Hi there! ',
    'I need an estimate. ',
    'My car needs a wash. ',
    'I park outside every night. ',
    'The seats need cleaning. ',
    'This is about a paint correction booking. ',
    'We drove on a gravel road. ',
    'I have attached photos of the damage. ',
    'The hood was recently repainted. ',
    'The garage is closed today. ',
    'I would like a window tint quote. ',
  ];
  const endings = [
    ' Thank you.',
    ' Please send a quote.',
    ' I can drop the keys off early.',
    ' Text is easiest for me.',
    ' What is your next opening?',
    ' Could the work be finished Friday?',
    ' I can leave the car overnight.',
    ' The photos were taken yesterday.',
    ' Let me know what preparation is needed.',
    ' Please include the cleaning time in the estimate.',
  ];
  for (const fixture of authoredCases.filter(({ category }) => category === 'hard-negatives')) {
    for (const opening of openings)
      for (const ending of endings) {
        yield {
          category: 'composed-hard-negatives',
          provenance: 'generated-synthetic',
          text: `${opening}${fixture.text}${ending}`,
          expected: [],
        };
      }
  }

  // Every proposed mutation is reconciled against all exact source spellings
  // and every same-make alphabetic neighbor. Conflicts remain counted below.
  const alphabetic = catalog.pairs.filter(({ model }) => /^[A-Za-z]{6,}$/.test(model));
  const collisionCandidates = catalog.pairs.filter(({ model }) => /^[A-Za-z]+$/.test(model));
  const byMake = new Map<string, Map<string, Set<string>>>();
  // Candidates may be shorter than the word chosen for mutation: tacan is
  // one edit from both Taycan (six letters) and Macan (five letters).
  for (const { make, model } of collisionCandidates) {
    let neighborhoods = byMake.get(make);
    if (!neighborhoods) {
      neighborhoods = new Map();
      byMake.set(make, neighborhoods);
    }
    for (const variant of edits(model.toLowerCase())) {
      const models = neighborhoods.get(variant) ?? new Set<string>();
      models.add(model);
      neighborhoods.set(variant, models);
    }
  }
  assert.deepEqual([...byMake.get('Porsche')!.get('tacan')!].sort(), ['Macan', 'Taycan']);
  for (const pair of alphabetic) {
    const word = pair.model.toLowerCase();
    const index = 1 + (seed % (word.length - 2));
    const variations = [
      ['deletion', word.slice(0, index) + word.slice(index + 1)],
      ['insertion', word.slice(0, index) + word[index] + word.slice(index)],
      ['substitution', word.slice(0, index) + (word[index] === 'x' ? 's' : 'x') + word.slice(index + 1)],
      ['adjacent-swap', word.slice(0, index) + word[index + 1] + word[index] + word.slice(index + 2)],
    ];
    for (const [operation, variant] of variations) {
      mutationCounts.proposed++;
      if (catalog.modelSpellings.has(spellingKey(variant))) {
        mutationCounts.exactCollision++;
        mutationExclusions.push({
          make: pair.make,
          sourceModel: pair.model,
          variant,
          reason: 'exact-source-spelling',
          alternatives: catalog.pairs
            .filter(({ model }) => spellingKey(model) === spellingKey(variant))
            .map(({ make, model }) => `${make}/${model}`),
        });
        continue;
      }
      const alternatives = byMake.get(pair.make)!.get(variant)!;
      if (alternatives.size > 1) {
        mutationCounts.ambiguousSameMake++;
        mutationExclusions.push({
          make: pair.make,
          sourceModel: pair.model,
          variant,
          reason: 'ambiguous-same-make-correction',
          alternatives: [...alternatives].sort(),
        });
        continue;
      }
      assert.ok(alternatives.has(pair.model));
      const prefix = `My ${pair.make} `;
      mutationCounts.emitted++;
      yield {
        category: `generated-typo-${operation}`,
        provenance: 'generated-source',
        text: `${prefix}${variant} needs the paint inspected.`,
        expected: sourceMentions(catalog, pair, variant, prefix.length),
      };
    }
  }
}

await mkdir(dirname(output), { recursive: true });
const stream = createWriteStream(output, { encoding: 'utf8' });
const digest = createHash('sha256');
const unique = new Map<string, string>();
let duplicates = 0;
for (const candidate of candidates()) {
  const expectations = JSON.stringify(candidate.expected);
  if (unique.has(candidate.text)) {
    assert.equal(unique.get(candidate.text), expectations, `Conflicting generated labels: ${candidate.text}`);
    duplicates++;
    continue;
  }
  unique.set(candidate.text, expectations);
  const id = `generated:${createHash('sha256').update(candidate.text).digest('hex').slice(0, 20)}`;
  const fixture: CorpusCase = { id, ...candidate };
  const line = JSON.stringify(fixture) + '\n';
  digest.update(line);
  counts[fixture.category] = (counts[fixture.category] ?? 0) + 1;
  if (!stream.write(line)) await once(stream, 'drain');
}
stream.end();
await once(stream, 'finish');
const manifest = {
  schemaVersion: 1,
  generatorVersion: 1,
  sourceCommit: SOURCE_COMMIT,
  seed,
  sourceRows: catalog.rows,
  sourcePairs: catalog.pairs.length,
  generatedCases: unique.size,
  duplicatesRemoved: duplicates,
  counts,
  mutations: mutationCounts,
  mutationExclusions,
  sha256: digest.digest('hex'),
  provenance: 'Deterministic source-derived and composed synthetic evaluation. No historical lead accuracy claim.',
};
const manifestPath = output.replace(/\.jsonl$/, '') + '-manifest.json';
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ output, manifest: manifestPath, ...manifest }, null, 2));
