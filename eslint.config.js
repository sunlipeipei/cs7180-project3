import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['src/generated/**'],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'app/api/**/*.ts'],
    ignores: ['src/generated/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'warn',
    },
  },
  {
    files: ['app/api/**/*.ts', 'src/**/*.ts'],
    ignores: ['src/lib/auth.ts', 'src/lib/auth.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@clerk/nextjs/server'],
              importNames: ['auth', 'currentUser'],
              message:
                "Use 'src/lib/auth' (getAuth/getCurrentUser) instead of importing auth/currentUser directly from @clerk/nextjs/server.",
            },
          ],
        },
      ],
    },
  },
];
