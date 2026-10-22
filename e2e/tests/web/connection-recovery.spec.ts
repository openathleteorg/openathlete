import { expect, test } from '@playwright/test';

// Deliberately abort one request while the browser remains online: the native
// startup/resume failure must recover without an online event or a manual tap.
test('recovers a failed startup request while connectivity remains online', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('**/user/me', async (route) => {
    attempts++;
    if (attempts === 1) await route.abort('failed');
    else await route.continue();
  });
  await page.goto('/dashboard/sync');
  await expect(
    page.getByRole('heading', { name: 'Cannot connect to your server' }),
  ).toBeVisible();
  await expect(page.locator('[data-sync-panel]')).toBeVisible({
    timeout: 10_000,
  });
  expect(attempts).toBeGreaterThanOrEqual(2);
  await expect(page).toHaveURL(/\/dashboard\/sync$/);
});

test('keeps the session after a refresh connection failure and retries it', async ({
  page,
}) => {
  // Keep the real saved refresh credential; force the startup access-token path
  // through renewal instead of inventing credentials or disabling authorization.
  await page.addInitScript(() => localStorage.removeItem('access_token'));
  let attempts = 0;
  await page.route('**/auth/refresh-token', async (route) => {
    attempts++;
    if (attempts === 1) await route.abort('failed');
    else await route.continue();
  });
  await page.goto('/dashboard/sync');
  await expect(
    page.getByRole('heading', { name: 'Cannot connect to your server' }),
  ).toBeVisible();
  await expect(page.locator('[data-sync-panel]')).toBeVisible({
    timeout: 10_000,
  });
  expect(attempts).toBeGreaterThanOrEqual(2);
  await expect(page).toHaveURL(/\/dashboard\/sync$/);
});
