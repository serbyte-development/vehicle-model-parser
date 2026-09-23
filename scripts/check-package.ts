import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packed = JSON.parse(
  execFileSync(npm, ['pack', '--ignore-scripts', '--json'], { cwd: root, encoding: 'utf8' }),
) as {
  filename: string;
  size: number;
  unpackedSize: number;
  files: { path: string }[];
}[];
assert.equal(packed.length, 1);
const tarball = packed[0];
const files = new Set(tarball.files.map((file) => file.path));
for (const required of [
  'package.json',
  'README.md',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  'dist/index.js',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/index.d.cts',
  'dist/levenshtein-lte1.LICENSE.txt',
  'data/source/LICENSE',
  'data/source/manifest.json',
])
  assert.ok(files.has(required), `Missing package file: ${required}`);
for (const name of files)
  assert.ok(
    !/^(?:tests|src|scripts|benchmarks|docs)\//.test(name) && !name.endsWith('.csv'),
    `Unexpected package file: ${name}`,
  );

await mkdir(path.join(root, '.cache'), { recursive: true });
const fixture = await mkdtemp(path.join(root, '.cache', 'package-smoke-'));
await writeFile(
  path.join(fixture, 'package.json'),
  JSON.stringify({ name: 'vehicle-model-parser-smoke', private: true, type: 'module' }),
);
execFileSync(
  npm,
  ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', path.join(root, tarball.filename)],
  { cwd: fixture, stdio: 'pipe' },
);
const installed = JSON.parse(
  await readFile(path.join(fixture, 'node_modules/vehicle-model-parser/package.json'), 'utf8'),
);
assert.equal(installed.name, 'vehicle-model-parser');
assert.equal(installed.version, '0.1.0');
assert.deepEqual(Object.keys(installed.dependencies ?? {}), []);

const checks = `
assert.deepEqual(findMakes('Need PPF for my silverdo'), ['Chevrolet']);
assert.deepEqual(findMakes('Toyota Civic'), ['Honda']);
assert.equal(findVehicles('🚙 Toyota 4runner')[0].matchedText, '4runner');
assert.deepEqual(findVehicles('🚙 Toyota 4runner', {output:'compact'}), [{make:'Toyota', model:'4Runner'}]);
assert.deepEqual(findVehicles('My camery needs tint', {fuzzy:false}), []);
`;
await writeFile(
  path.join(fixture, 'smoke.mjs'),
  `import assert from 'node:assert/strict';
import {findVehicles, findMakes} from 'vehicle-model-parser';\n${checks}`,
);
await writeFile(
  path.join(fixture, 'smoke.cjs'),
  `const assert = require('node:assert/strict');
const {findVehicles, findMakes} = require('vehicle-model-parser');\n${checks}`,
);
const runtime = process.env.SMOKE_NODE ?? process.execPath;
for (const file of ['smoke.mjs', 'smoke.cjs']) execFileSync(runtime, [file], { cwd: fixture, stdio: 'pipe' });

await writeFile(
  path.join(fixture, 'smoke.mts'),
  `import {findVehicles, findMakes, type VehicleMatch, type CompactVehicleMatch, type FindOptions, type MatchType} from 'vehicle-model-parser';
const options: FindOptions = {fuzzy: false};
const matches: VehicleMatch[] = findVehicles('Toyota Camry', options);
const compact: CompactVehicleMatch[] = findVehicles('Toyota Camry', {output: 'compact'});
const type: MatchType = matches[0].matchType;
const makes: string[] = findMakes('Toyota Camry');
// @ts-expect-error fuzzy is a boolean
findVehicles('Camry', {fuzzy: 1});
// @ts-expect-error compact output does not contain detailed match evidence
findVehicles('Camry', {output: 'compact'})[0].matchedText;
`,
);
await writeFile(
  path.join(fixture, 'smoke.cts'),
  `import parser = require('vehicle-model-parser');
const matches: parser.VehicleMatch[] = parser.findVehicles('Toyota Camry');
const makes: string[] = parser.findMakes('Toyota Camry');
// @ts-expect-error text is required
parser.findVehicles();
`,
);
execFileSync(
  process.execPath,
  [
    path.join(root, 'node_modules/typescript/bin/tsc'),
    '--strict',
    '--noEmit',
    '--skipLibCheck',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    'smoke.mts',
    'smoke.cts',
  ],
  { cwd: fixture, stdio: 'pipe' },
);
await mkdir(path.join(root, 'artifacts'), { recursive: true });
const artifact = path.join('artifacts', tarball.filename);
await copyFile(path.join(root, tarball.filename), path.join(root, artifact));
console.log(
  JSON.stringify(
    {
      tarball: tarball.filename,
      bytes: tarball.size,
      unpackedBytes: tarball.unpackedSize,
      artifact,
      files: files.size,
      install: 'offline, scripts disabled, zero production dependencies',
      runtime: execFileSync(runtime, ['--version'], { encoding: 'utf8' }).trim(),
      smoke: ['ESM', 'CommonJS', 'NodeNext ESM declarations', 'NodeNext CommonJS declarations'],
      fixture,
    },
    null,
    2,
  ),
);
