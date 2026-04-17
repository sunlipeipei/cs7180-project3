import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.integration.test.ts', 'app/**/*.integration.test.ts'],
    exclude: ['node_modules', '.next'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    sequence: { concurrent: false }, // serialize DB tests
  },
});
