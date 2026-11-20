import { defineConfig, devices } from '@playwright/test';

import { AUTH_FILE, BILLING_WEB_URL, WEB_URL } from './support/env';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // testMatch runs against absolute paths: anchor on tests/ so a checkout
  // in a folder named like a project ("…-mobile/") selects nothing extra
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'api', testMatch: /tests\/api\/.*\.spec\.ts$/ },
    {
      name: 'desktop',
      testMatch: /tests\/web\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      testMatch: /tests\/mobile\/.*\.spec\.ts$/,
      // The iPhone viewport and touch input, rendered by Chromium
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
    {
      // An instance with billing (stripe-mock): Supporter perks are locked
      // for free accounts. Its own web app and API, same database
      name: 'billing',
      testMatch: /tests\/billing\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: BILLING_WEB_URL },
    },
    {
      name: 'billing-mobile',
      testMatch: /tests\/billing\/.*\.spec\.ts$/,
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        baseURL: BILLING_WEB_URL,
      },
    },
    {
      // The same phone tests on an Android phone: its own viewport, screen
      // density and user agent
      name: 'android',
      testMatch: /tests\/mobile\/.*\.spec\.ts$/,
      use: { ...devices['Pixel 8'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],
});
