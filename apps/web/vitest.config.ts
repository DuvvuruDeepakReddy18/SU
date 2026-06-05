import { defineConfig, configDefaults } from 'vitest/config';

// The web app has no vitest unit tests yet, but `vitest run` would otherwise
// glob the Playwright specs in e2e/ (which use @playwright/test, not vitest)
// and crash. Keep them out of vitest — they run via `pnpm test:e2e`.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**', 'playwright.config.ts'],
  },
});
