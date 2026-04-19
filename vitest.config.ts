import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // More specific aliases must come first — Vite matches in order.
      { find: '@/components', replacement: path.resolve(__dirname, 'components') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    exclude: ['node_modules', '.next', '.claude/worktrees/**', '**/*.integration.test.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'components',
          include: ['components/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'node',
          exclude: ['node_modules', '.next', '.claude/worktrees/**', '**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          // Route-group dirs contain literal parens which fast-glob treats as groups;
          // use wildcard segments instead of the literal "(app)" directory name.
          // Scoped to the `(app)` route group so we do not swallow API-route tests.
          name: 'app-components',
          include: [
            'app/*/profile/**/*.test.{ts,tsx}',
            'app/*/tailor/**/*.test.{ts,tsx}',
            'app/*/dashboard/**/*.test.{ts,tsx}',
          ],
          exclude: ['node_modules', '.next', 'app/api/**'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          // API route handlers — run under node so undici's fetch primitives
          // (FormData, multipart parsing, Request.body streaming) behave the
          // same way they will at runtime on Vercel.
          name: 'api',
          include: ['app/api/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
    ],
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
