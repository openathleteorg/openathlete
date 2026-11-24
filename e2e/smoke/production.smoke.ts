import { expect, test } from '@playwright/test';

import { ERROR_BOUNDARY_TEXT, trackLiveProblems } from './health';

const LANDING_URL = process.env.SMOKE_LANDING_URL ?? 'https://openathlete.org';
const API_URL = process.env.SMOKE_API_URL ?? 'https://api.openathlete.org';

// Read-only checks: nothing here creates, edits or deletes anything.

test('the landing page answers', async ({ request }) => {
  const response = await request.get(LANDING_URL);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('OpenAthlete');
});

test('the API health route answers ok', async ({ request }) => {
  const response = await request.get(`${API_URL}/health`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'ok' });
});

test('the app shell loads', async ({ browser, baseURL }) => {
  // Signed out: the login page, rendered by the app itself
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  const problems = trackLiveProblems(page);

  await page.goto('/auth/login');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('body')).not.toHaveText(ERROR_BOUNDARY_TEXT);
  expect(problems).toEqual([]);
  await context.close();
});

for (const name of ['dashboard', 'dashboard/calendar']) {
  test(`/${name} renders without errors`, async ({ page }) => {
    const problems = trackLiveProblems(page);

    await page.goto(`/${name}`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('body')).not.toHaveText(ERROR_BOUNDARY_TEXT);
    expect(problems).toEqual([]);
  });
}

test('the calendar shows its days', async ({ page }) => {
  await page.goto('/dashboard/calendar?view=month');
  await expect(page.locator('[data-calendar-day]').first()).toBeVisible();
});
