// Flat config shared across the monorepo.
// Per-app configs extend this and add framework-specific rules.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/.turbo/**',
      '**/prisma/migrations/**',
      '**/coverage/**',
      // Static marketing landing — vanilla browser JS (GSAP/Lenis globals),
      // not part of the TS app and not for the app's lint rules.
      '**/public/landing/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // NestJS DI requires runtime class refs in constructor params; `import type`
      // would erase them and break Reflect-metadata. Leave as-is.
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  prettier,
);
