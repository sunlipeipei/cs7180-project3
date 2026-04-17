import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    exclude: ['node_modules', '.next', '**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'app/api/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__tests__/**', 'src/generated/**'],
      thresholds: {
        'src/profile/': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
