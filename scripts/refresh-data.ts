// Explicit maintainer command. Install and ordinary builds never call this file.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const commit = '79018e2dbcc03899bf3434d959b445644fb49b76';
const repository = 'https://github.com/abhionlyone/us-car-models-data';
const directory = new URL('../data/source/', import.meta.url);
const names = [...Array.from({ length: 35 }, (_, i) => `${1992 + i}.csv`), 'LICENSE', 'README.md'];
type FileEntry = { path: string; sha256: string; bytes: number };
type Manifest = { commit: string; files: FileEntry[] };
let previous: Manifest | undefined;
try {
  previous = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8')) as Manifest;
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
if (previous && previous.commit !== commit) throw new Error('Manifest commit differs from the pinned refresh script');
await mkdir(directory, { recursive: true });
const files: FileEntry[] = [];
for (const name of names) {
  const response = await fetch(`https://raw.githubusercontent.com/abhionlyone/us-car-models-data/${commit}/${name}`);
  if (!response.ok) throw new Error(`Source fetch failed: ${name}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const expected = previous?.files.find((file) => file.path === name);
  if (previous && (!expected || expected.sha256 !== sha256 || expected.bytes !== bytes.length)) {
    throw new Error(`Pinned checksum mismatch: ${name}`);
  }
  await writeFile(new URL(name, directory), bytes);
  files.push({ path: name, sha256, bytes: bytes.length });
}
await writeFile(
  new URL('manifest.json', directory),
  JSON.stringify(
    {
      schemaVersion: 1,
      repository,
      author: 'abhionlyone and contributors',
      commit,
      license: 'CC-BY-4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      transformations:
        'Original files are byte-for-byte copies. The generated catalog deduplicates model/make pairs across years and discards year/body_styles.',
      expected: { files: 35, rows: 11543, makes: 66, models: 1410, pairs: 1459, rows2025: 28, rows2026: 3 },
      files,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Verified and vendored ${files.length} pinned source files at ${fileURLToPath(directory)}`);
