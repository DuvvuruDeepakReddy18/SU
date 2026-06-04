import { defineConfig, configDefaults } from 'vitest/config';

// Default test run = fast, dependency-free unit specs under src/. The e2e
// specs under test/ boot the whole app (needs Postgres + Redis) and run via
// the separate `pnpm test:e2e` script / vitest.e2e.config.ts.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    exclude: [...configDefaults.exclude, 'test/**'],
    coverage: { reporter: ['text', 'html'] },
  },
});
