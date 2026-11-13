import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { apiHeaders, createAthlete, login } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';

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

test('brings visitors back to the page they asked for', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);

  await page.goto('/dashboard/settings?tab=ai');
  await expect(page).toHaveURL(/\/auth\/login/);
  await page.fill('input[name="email"]', athlete.email);
  await page.fill('input[name="password"]', athlete.password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard\/settings\?tab=ai/);
});

test('follows a returnTo link, but never to another site', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);

  await page.goto('/auth/login?returnTo=//evil.example/steal');
  await page.fill('input[name="email"]', athlete.email);
  await page.fill('input[name="password"]', athlete.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
  expect(new URL(page.url()).host).not.toBe('evil.example');

  // Already signed in: a website link goes straight to its page
  await page.goto('/auth/create-account?returnTo=/dashboard/settings?tab=ai');
  await expect(page).toHaveURL(/\/dashboard\/settings\?tab=ai/);
});

test('takes a new account to the onboarding after another one logged out', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  await page.goto('/dashboard/calendar');

  await page.getByRole('button', { name: athlete.email }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/auth\/login/);

  // Same tab, no reload: the app keeps what it had in memory
  await page.getByRole('link', { name: 'Sign up' }).click();
  // The login form, with its own email field, stays until this page loads
  await expect(
    page.getByRole('heading', { name: 'Create an account' }),
  ).toBeVisible();
  await page.fill('input[name="email"]', `new-${athlete.email}`);
  await page.fill('input[name="firstName"]', 'New');
  await page.fill('input[name="lastName"]', 'Account');
  await page.fill('input[name="password"]', athlete.password);
  await page.click('button[type="submit"]');

  await expect(
    page.getByRole('heading', { name: 'Welcome to OpenAthlete' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Train/ })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/onboarding/);
});

test('records where a new account came from, as the website link says', async ({
  page,
  request,
}) => {
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'E2e-Test-Passw0rd!';
  // A website link after a visit that started on a Reddit campaign
  await page.goto(
    '/auth/create-account?utm_source=reddit&utm_medium=cta&utm_campaign=launch' +
      '&oa_ref=www.reddit.com&oa_landing=%2Ffr%2Fcoaches&oa_page=%2Ffr%2Fpricing&oa_cta=home_hero',
  );
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="firstName"]', 'From');
  await page.fill('input[name="lastName"]', 'Reddit');
  await page.fill('input[name="password"]', password);

  const recorded = page.waitForResponse(
    (response) =>
      response.url().endsWith('/user/me/signup-attribution') &&
      response.request().method() === 'PUT',
  );
  await page.click('button[type="submit"]');
  await expect(
    page.getByRole('heading', { name: 'Welcome to OpenAthlete' }),
  ).toBeVisible();
  expect((await recorded).status()).toBe(204);

  const { accessToken } = await login(request, email, password);
  const exported = await request.get(`${API_URL}/user/me/export`, {
    headers: apiHeaders(undefined, accessToken),
  });
  const { user } = (await exported.json()) as {
    user: { signupAttribution: unknown };
  };
  expect(user.signupAttribution).toEqual({
    utmSource: 'reddit',
    utmMedium: 'cta',
    utmCampaign: 'launch',
    referrer: 'www.reddit.com',
    landingPage: '/fr/coaches',
    sitePage: '/fr/pricing',
    cta: 'home_hero',
  });
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

test('shows the password while logging in', async ({ page, request }) => {
  const athlete = await createAthlete(request);

  await page.goto('/auth/login');
  await page.fill('input[name="email"]', athlete.email);
  const password = page.locator('input[name="password"]');
  await password.fill(athlete.password);
  await expect(password).toHaveAttribute('type', 'password');

  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue(athlete.password);

  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
});
