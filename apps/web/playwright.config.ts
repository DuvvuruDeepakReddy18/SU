import { defineConfig, devices } from '@playwright/test';

// Public-page smoke tests. These boot the Next.js app and assert the
// unauthenticated surfaces (landing, login, the three signups, support, reset)
// render correctly — catching broken routes, missing CTAs, and build breakage
// without needing the API/DB up. Authenticated flows belong in API e2e, which
// is deterministic.
const PORT = 3000;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build + start so it matches production. In CI env comes from the workflow
    // (plain scripts); locally the *:local scripts load ../../.env. Reuse a
    // running `pnpm dev` locally so the suite is fast to iterate on.
    command: process.env.CI ? 'pnpm build && pnpm start' : 'pnpm build:local && pnpm start:local',
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
});
