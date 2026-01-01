// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from file if needed.
 * For Next.js, .env is usually loaded automatically, but explicit loading
 * ensures vars match in pure E2E execution context.
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });


// Ensure critical UI env vars are present for local/CI consistency
process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '525512345678';

const PORT = process.env.PORT || 3007;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Match only .spec.ts files to avoid conflict with Vitest unit tests (.test.ts) */
  testMatch: '**/*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Capture screenshot on failure to help debug "White Screen" issues quickly */
    screenshot: 'only-on-failure',

    /* Record video on retry, useful for CI debugging */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. Essential for Marketing Smoke Tests. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // Optimization: Use 'start' instead of 'dev' for CI performance/stability.
    // Ensure 'npm run build' is executed before running tests in CI pipeline.
    command: 'pnpm run start',
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120 * 1000, // Give Next.js enough time to boot up (2 mins)
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      PORT: PORT.toString(),
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      // Enable E2E mock data (e.g., test folio WEB-00000000-0000)
      ENABLE_E2E_MOCKS: 'true',
    },
  },
});
