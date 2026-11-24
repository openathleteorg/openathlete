import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * The post-deploy smoke suite: a few read-only checks against a live
 * deployment (production by default). See README.md.
 */
export const BASE_URL =
  process.env.SMOKE_BASE_URL ?? 'https://app.openathlete.org';
export const AUTH_FILE = path.join(import.meta.dirname, '../.auth/smoke.json');

export default defineConfig({
  testDir: '.',
  // Production answers within seconds; a stuck page is a failure
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  // One retry absorbs a network blip between the runner and production
  retries: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'smoke-results/results.json' }],
    ['html', { open: 'never', outputFolder: 'smoke-results/report' }],
  ],
  outputDir: 'smoke-results/artifacts',
  use: {
    baseURL: BASE_URL,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'smoke-setup', testMatch: /login\.setup\.ts$/ },
    {
      name: 'smoke',
      testMatch: /\.smoke\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['smoke-setup'],
    },
  ],
});
