import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  // service workers are flakey, so we gotta have retries
  retries: process.env.CI ? 2 : 0,
  timeout: 20000,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { open: "never" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    serviceWorkers: "allow",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium - system time",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium - latin america time",
      use: { ...devices["Desktop Chrome"], timezoneId: "America/Lima" },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "python3 -m http.server -d web/ 3003",
    url: "http://localhost:3003",
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "ignore",
  },
});
