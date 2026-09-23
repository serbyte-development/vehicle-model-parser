import { defineConfig } from 'tsup';
import { copyFile } from 'node:fs/promises';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node20',
  dts: true,
  clean: true,
  sourcemap: true,
  noExternal: ['levenshtein-lte1'],
  async onSuccess() {
    await copyFile('node_modules/levenshtein-lte1/LICENSE.txt', 'dist/levenshtein-lte1.LICENSE.txt');
  },
});
