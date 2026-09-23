/** Independent local tarball smoke. All generated files stay in this directory's ignored .work. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const work = fileURLToPath(new URL('.work/', import.meta.url));
const tarball = path.resolve(process.argv[2] ?? path.join(work, 'serbyte-vehicle-parser-0.1.0.tgz'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const files = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n');
for (const file of files) {
  assert.ok(file.startsWith('package/') && !file.includes('/../'), file);
  assert.ok(!/^package\/(?:tests|src|scripts|benchmarks|docs|\.cache)\//.test(file), file);
  assert.ok(!/\.csv$|vehicle_ner|\.env(?:\.|$)/.test(file), file);
}
for (const file of [
  'LICENSE',
  'README.md',
  'THIRD_PARTY_NOTICES.md',
  'data/source/LICENSE',
  'data/source/manifest.json',
  'dist/levenshtein-lte1.LICENSE.txt',
  'dist/index.js',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/index.d.cts',
])
  assert.ok(files.includes(`package/${file}`), file);

await mkdir(work, { recursive: true });
const fixture = await mkdtemp(path.join(work, 'independent-consumer-'));
await writeFile(path.join(fixture, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
execFileSync(
  npm,
  ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', tarball],
  { cwd: fixture, stdio: 'pipe' },
);
const installed = path.join(fixture, 'node_modules/@serbyte/vehicle-parser');
const metadata = JSON.parse(await readFile(path.join(installed, 'package.json'), 'utf8'));
assert.equal(metadata.name, '@serbyte/vehicle-parser');
assert.equal(metadata.version, '0.1.0');
assert.deepEqual(metadata.dependencies ?? {}, {});
for (const file of files) {
  const content = await readFile(path.join(installed, file.slice('package/'.length)), 'utf8');
  assert.ok(!content.includes('/Users/austinserb/'), `Local absolute path in ${file}`);
  assert.ok(!content.includes('vehicle_ner.original.jsonl'), `Public corpus reference in ${file}`);
}

const assertions = `
assert.deepEqual(Object.keys(parser).sort(), ['findMakes', 'findVehicles']);
const {findVehicles, findMakes} = parser;
assert.deepEqual(findMakes('Need PPF for my silverdo'), ['Chevrolet']);
assert.deepEqual(findMakes('Toyota Civic'), ['Honda']);
assert.deepEqual(findVehicles('Need PPF for my camery.', {fuzzy:false}), []);
assert.deepEqual(findVehicles('Mercedes-Benz D-Class needs PPF.'), []);
for (const text of ['Bentley Continental, Lincoln Continental.', 'Continental Bentley, Continental Lincoln.'])
  assert.deepEqual(findVehicles(text).map(x=>x.makes), [['Bentley'],['Lincoln']]);
const text = '🚙 Cafe\\u0301 Toyota Ｃａｍｒｙ needs PPF.';
const match = findVehicles(text)[0];
assert.equal(match.model, 'Camry');
assert.equal(match.start, text.indexOf('Ｃａｍｒｙ'));
assert.equal(text.slice(match.start, match.end), match.matchedText);
assert.deepEqual(findVehicles('Need PPF for my 500e.').map(x=>x.model).sort(), ['500 E','500e']);
assert.throws(()=>findVehicles(null), TypeError);
`;
await writeFile(
  path.join(fixture, 'consumer.mjs'),
  `import assert from 'node:assert/strict';\nimport * as parser from '@serbyte/vehicle-parser';\n${assertions}`,
);
await writeFile(
  path.join(fixture, 'consumer.cjs'),
  `const assert=require('node:assert/strict');\nconst parser=require('@serbyte/vehicle-parser');\n${assertions}`,
);
for (const file of ['consumer.mjs', 'consumer.cjs'])
  execFileSync(process.execPath, [file], { cwd: fixture, stdio: 'pipe' });

await writeFile(
  path.join(fixture, 'consumer.mts'),
  `import { findVehicles, findMakes, type VehicleMatch, type FindOptions, type MatchType } from '@serbyte/vehicle-parser';
const options: FindOptions = { fuzzy: false };
const matches: VehicleMatch[] = findVehicles('Toyota Camry', options);
const kind: MatchType = matches[0].matchType;
const makes: string[] = findMakes('Toyota Camry');
// @ts-expect-error invalid option type
findVehicles('Camry', {fuzzy: 1});
// @ts-expect-error confidence is outside the public contract
matches[0].confidence;
`,
);
await writeFile(
  path.join(fixture, 'consumer.cts'),
  `import parser = require('@serbyte/vehicle-parser');
const matches: parser.VehicleMatch[] = parser.findVehicles('Toyota Camry');
const makes: string[] = parser.findMakes('Toyota Camry');
// @ts-expect-error invalid text type
parser.findVehicles(1);
`,
);
execFileSync(
  process.execPath,
  [
    path.join(root, 'node_modules/typescript/bin/tsc'),
    '--strict',
    '--noEmit',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    'consumer.mts',
    'consumer.cts',
  ],
  { cwd: fixture, stdio: 'pipe' },
);

const bytes = await readFile(tarball);
const report = {
  tarball: path.basename(tarball),
  tarballSha256: createHash('sha256').update(bytes).digest('hex'),
  bytes: bytes.length,
  files: files.length,
  node: process.version,
  platform: `${process.platform}/${process.arch}`,
  install: 'Offline, scripts disabled, zero production dependencies',
  checks: [
    'file allowlist',
    'required licenses',
    'no local absolute paths',
    'ESM',
    'CommonJS',
    'NodeNext .mts',
    'NodeNext .cts',
    'review regressions',
  ],
};
await writeFile(
  new URL(`installed-${process.versions.node.split('.')[0]}.json`, import.meta.url),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
