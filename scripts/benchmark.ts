import { cpus, platform, arch } from 'node:os';
import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const bundle = new URL('../dist/index.js', import.meta.url);
const { findVehicles } = (await import(bundle.href)) as typeof import('../src/index.js');

// Generate outside the timed sections, using fixed PRNG state and no input cache.
let state = 730219;
function randomWord(): string {
  let word = '';
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  const length = 5 + (state % 16);
  for (let i = 0; i < length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    word += String.fromCharCode(97 + (state % 26));
  }
  return word;
}
function textOfSize(bytes: number, varied: boolean): string {
  const chunks: string[] = [];
  let size = 0;
  while (size < bytes) {
    const chunk = varied ? `Quote my ${randomWord()} for tint. ` : 'Please clean the seats and remove the dust. ';
    chunks.push(chunk);
    size += chunk.length;
  }
  return chunks.join('').slice(0, bytes);
}
function measure(name: string, text: string, repeats: number): void {
  const timings: number[] = [];
  let mentions = 0;
  findVehicles(text);
  for (let i = 0; i < repeats; i++) {
    const start = performance.now();
    mentions = findVehicles(text).length;
    timings.push(performance.now() - start);
  }
  timings.sort((a, b) => a - b);
  console.log(
    JSON.stringify({
      name,
      bytes: Buffer.byteLength(text),
      repeats,
      mentions,
      medianMs: +timings[Math.floor(timings.length / 2)].toFixed(3),
      p95Ms: +timings[Math.min(timings.length - 1, Math.floor(timings.length * 0.95))].toFixed(3),
    }),
  );
}
console.log(
  JSON.stringify({
    node: process.version,
    platform: platform(),
    arch: arch(),
    cpu: cpus()[0]?.model,
    seed: 730219,
    note: 'Warm timings; generated input construction is excluded. Cold import uses built ESM in fresh processes.',
  }),
);
const cold: number[] = [];
for (let i = 0; i < 5; i++) {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `const t=performance.now(); await import(${JSON.stringify(bundle.href)}); console.log(performance.now()-t);`,
    ],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) throw new Error(`Build first (npm run build). ${fileURLToPath(bundle)}: ${result.stderr}`);
  cold.push(Number(result.stdout.trim()));
}
console.log(JSON.stringify({ name: 'cold-import', repeats: 5, milliseconds: cold.map((ms) => +ms.toFixed(3)) }));
measure(
  'typical-positive',
  'Hi, I have a Toyota 4runner with branch scratches. Please quote PPF for it and my silverdo.',
  1000,
);
measure(
  'typical-negative',
  'Please focus on the wheels and the edge of the film. Call me after lunch for the total.',
  1000,
);
for (const bytes of [10_000, 100_000, 1_000_000]) {
  measure('repeated-negative', textOfSize(bytes, false), bytes < 1_000_000 ? 10 : 3);
  measure('varied-contextual-vocabulary', textOfSize(bytes, true), bytes < 1_000_000 ? 10 : 3);
}
measure('single-arbitrary-token', 'x'.repeat(1_000_000), 3);
measure('dense-positive', 'Toyota Camry '.repeat(Math.floor(1_000_000 / 13)), 3);
console.log(JSON.stringify({ memory: process.memoryUsage() }));
