import { type Page, expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { createAthlete } from '../../support/api';

// The E2E stack signs in through fake-oidc (see fake-oidc/server.mjs)
test.use({ storageState: { cookies: [], origins: [] } });

async function signInWithSso(page: Page, email: string) {
  await page.goto('/auth/login');
  await page.locator('[data-oidc-sign-in]').click();
  await page.waitForURL(/localhost:19000\/authorize/);
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('creates the account on a first sign-in', async ({ page }) => {
  await signInWithSso(page, `sso-${randomUUID()}@example.com`);
  // A new account starts with the onboarding
  await page.waitForURL(/\/dashboard|\/onboarding/);
  expect(
    await page.evaluate(() => {
      const owner = localStorage.getItem('auth_session');
      const record = owner && localStorage.getItem(`auth_record:${owner}`);
      return record ? JSON.parse(record).accessToken : null;
    }),
  ).toBeTruthy();
  // The one-time code does not stay in the address bar
  expect(page.url()).not.toContain('code=');
});

test('signs in the account of the same address', async ({ page, request }) => {
  const athlete = await createAthlete(request);
  await signInWithSso(page, athlete.email.toUpperCase());
  await page.waitForURL(/\/dashboard/);
  await expect(page.locator('[data-sso-error]')).toHaveCount(0);
});

test('refuses an address the provider did not verify', async ({ page }) => {
  await signInWithSso(page, 'unverified@example.com');
  await expect(
    page.locator('[data-sso-error="email_unverified"]'),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('auth_session')),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem('access_token')),
  ).toBeNull();
});
