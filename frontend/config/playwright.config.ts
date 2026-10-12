import { defineConfig, devices } from "@playwright/test";
import { getOwnedBaseURL } from "../e2e/stack/lifecycle";

export default defineConfig({
  testDir: "../e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "../test-results",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    baseURL: getOwnedBaseURL(process.env),
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
