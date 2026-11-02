import { expect, test } from '@playwright/test';

import { API_URL, WEB_URL } from '../../support/env';

// Without API_PUBLIC_URL, the web image proxies the API under /api
test('reaches the API through its own origin', async ({ page }) => {
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith(`${WEB_URL}/api/`)) {
      apiCalls.push(request.url());
    }
  });

  await page.goto('/dashboard/calendar');
  await page.waitForLoadState('networkidle');

  await expect(
    page.locator('meta[name="openathlete-api-base-url"]'),
  ).toHaveAttribute('content', '/api');
  expect(apiCalls.some((url) => url.endsWith('/api/user/me'))).toBe(true);
});

// Self-hosted instances must not report to the hosted instance's analytics,
// error monitoring or session recording: those are opt-in build variables.
test('makes no third-party request', async ({ page }) => {
  const allowed = [new URL(WEB_URL).origin];
  const thirdParty = new Set<string>();
  page.on('request', (request) => {
    const { origin, protocol } = new URL(request.url());
    if (protocol.startsWith('http') && !allowed.includes(origin)) {
      thirdParty.add(origin);
    }
  });

  await page.goto('/dashboard/calendar');
  await page.waitForLoadState('networkidle');
  await page.goto('/dashboard/statistics');
  await page.waitForLoadState('networkidle');

  expect([...thirdParty]).toEqual([]);
});

// A bare instance has no Google sign-in, email or device connector: the app
// must not offer what would only fail. Single sign-on is the E2E stack's
// fake-oidc provider.
test('hides what the instance has not set up', async ({ page, request }) => {
  const instance = await request.get(`${API_URL}/instance`);
  expect(await instance.json()).toEqual({
    googleSignIn: false,
    garminPersonalApi: false,
    email: false,
    providers: [],
    signup: 'open',
    oidc: { name: 'Fake IdP' },
  });

  await page.goto('/dashboard/settings?tab=connectors');
  await expect(page.locator('[data-connectors-unavailable]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect' })).toHaveCount(0);
  // Files remain the way in
  await expect(page.locator('[data-import-fit-trigger]')).toBeVisible();
});

test('signs in without a Google button on a bare instance', async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto('/auth/login');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.getByText('Google')).toHaveCount(0);
  await context.close();
});

test('explains how to reset a password without email', async ({ browser }) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto('/auth/password-reset-request');

  // The link goes to the server logs: the administrator passes it on
  await expect(page.locator('[data-reset-without-email]')).toBeVisible();
  await page.locator('input[name="email"]').fill('someone@example.com');
  await page.getByRole('button', { name: 'Request a reset link' }).click();
  await expect(page.getByText('Ask the instance administrator')).toBeVisible();
  await context.close();
});
