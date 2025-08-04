import { defineConfig, devices } from "@playwright/test";

const testsToOnlyRunOnce = ["cleaner.spec.ts", "dates.spec.ts"];

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
  workers: 4, //process.env.CI ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["line", { open: "never" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
    serviceWorkers: "allow",

    video: {
      mode: "retain-on-failure",
    },

    baseURL: "http://localhost:3003",
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
      testIgnore: testsToOnlyRunOnce,
    },
    {
      name: "chromium - webview size",
      use: { ...devices["Galaxy S24"] },
      testIgnore: testsToOnlyRunOnce,
    },
    {
      name: "chromium - with a backend",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:8013" },
      fullyParallel: false,
      workers: 1,
      testIgnore: testsToOnlyRunOnce,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: "npx @eeue56/gweld web/ 3003",
      url: "http://localhost:3003",
      reuseExistingServer: false,
      stdout: "ignore",
      stderr: "ignore",
    },
    {
      command: "npm run serve-backend",
      url: "http://localhost:8013",
      reuseExistingServer: false,
      // stdout: "ignore",
      // stderr: "ignore",
    },
  ],
});
