import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';

// These tests start logged out
test.use({ storageState: { cookies: [], origins: [] } });

test('explains the password rule on sign up', async ({ page }) => {
  await page.goto('/auth/create-account');
  await page.fill('input[name="email"]', 'too-short@example.com');
  await page.fill('input[name="firstName"]', 'Too');
  await page.fill('input[name="lastName"]', 'Short');
  await page.fill('input[name="password"]', 'short');
  await page.click('button[type="submit"]');

  await expect(page.getByRole('alert')).toContainText(
    'between 8 and 128 characters',
  );
});

test('says when the email already has an account', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);

  await page.goto('/auth/create-account');
  await page.fill('input[name="email"]', athlete.email);
  await page.fill('input[name="firstName"]', 'Same');
  await page.fill('input[name="lastName"]', 'Email');
  await page.fill('input[name="password"]', athlete.password);
  await page.click('button[type="submit"]');

  await expect(
    page.getByText('An account with this email already exists'),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/create-account/);
});

test('logs in and lands on the dashboard', async ({ page, request }) => {
  const athlete = await createAthlete(request);

  await page.goto('/auth/login');
  await page.fill('input[name="email"]', athlete.email);
  await page.fill('input[name="password"]', athlete.password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/);
});

test('says when the password is wrong', async ({ page, request }) => {
  const athlete = await createAthlete(request);

  await page.goto('/auth/login');
  await page.fill('input[name="email"]', athlete.email);
  await page.fill('input[name="password"]', `${athlete.password}-wrong`);
  await page.click('button[type="submit"]');

  await expect(
    page.getByText('The email or password is incorrect'),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('sends logged out visitors to the login page', async ({ page }) => {
  await page.goto('/dashboard/calendar');

  await expect(page).toHaveURL(/\/auth\/login/);
});
