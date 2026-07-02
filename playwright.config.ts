import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';

// Priority: .env.e2e.local → .env.local → .env
dotenvConfig({ path: '.env.e2e.local', override: false });
dotenvConfig({ path: '.env.local', override: false });
dotenvConfig({ path: '.env', override: false });

// Allow CLERK_PUBLISHABLE_KEY (used by @clerk/testing) to fall back to
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (used by @clerk/nextjs).
process.env.CLERK_PUBLISHABLE_KEY ??= process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  projects: [
    // Step 1: authenticate once and save browser storage state.
    {
      name: 'clerk setup',
      testMatch: /global\.setup\.ts/,
    },
    // Step 2: run authenticated tests with the saved session.
    {
      name: 'authenticated chromium',
      testMatch: /.*\.auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.clerk/admin.json',
      },
      dependencies: ['clerk setup'],
    },
    // Fallback: unauthenticated chromium (existing tests).
    {
      name: 'chromium',
      testMatch: /^(?!.*\.auth\.spec\.ts).*$/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
