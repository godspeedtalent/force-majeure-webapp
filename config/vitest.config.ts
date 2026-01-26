import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    root: rootDir,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
});
