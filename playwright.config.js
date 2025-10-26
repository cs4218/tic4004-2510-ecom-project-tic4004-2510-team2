import { defineConfig, devices } from '@playwright/test';

// Ref: https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Look for test files in the directory, relative to this configuration file.
  testDir: './playwright-tests',
  // Run all tests in parallel.
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: [['html', { open: 'always', outputFolder: 'playwright-report' }], ['list']],
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://localhost:3000',
    // Collect trace when retrying the failed test.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // video: 'retain-on-failure',
  },
  // Configure projects for major browsers.
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'WebKit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  // Run your local dev server before starting the tests.
  webServer: {
    command: 'npm start --prefix client',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // env: {
    //   BROWSER: 'none',
    //   PORT: '3000',
    // },
  },
});
