import { expect, test } from '@playwright/test';

import { trackPageProblems } from '../../support/page-health';

test('moves between the tabs of the app', async ({ page }) => {
  const problems = trackPageProblems(page);
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/dashboard\/today/);
  const tab = (id: string) => page.locator(`[data-app-tab="${id}"]`);

  await tab('calendar').tap();
  await expect(page).toHaveURL(/\/dashboard\/calendar/);
  await expect(tab('calendar')).toHaveAttribute('aria-current', 'page');

  await tab('progress').tap();
  await expect(page).toHaveURL(/\/dashboard\/statistics/);

  await page.getByRole('link', { name: 'Records' }).tap();
  await expect(page).toHaveURL(/\/dashboard\/records/);
  await expect(tab('progress')).toHaveAttribute('aria-current', 'page');

  // A tab comes back on the screen it was left on
  await tab('me').tap();
  await tab('progress').tap();
  await expect(page).toHaveURL(/\/dashboard\/records/);
  expect(problems).toEqual([]);
});

test('settings open from the Me tab and come back to it', async ({ page }) => {
  await page.goto('/dashboard/profile');

  await page.locator('[data-settings-link="equipment"]').tap();
  await expect(page).toHaveURL(/tab=equipment/);
  // A pushed screen has its way back instead of the tabs
  await expect(page.locator('[data-app-tab-bar]')).toHaveCount(0);

  await page.locator('[data-app-back]').tap();
  await expect(page).toHaveURL(/\/dashboard\/profile/);
  await expect(page.locator('[data-app-tab-bar]')).toBeVisible();
});

test('the finder opens from the top bar, full screen', async ({ page }) => {
  await page.goto('/dashboard/today');

  await page.locator('[data-app-finder]').tap();
  const finder = page.getByRole('dialog');
  await expect(finder).toHaveAttribute('data-sheet', 'full');
  await expect(finder.getByRole('combobox')).toBeVisible();
});

test('the install view lists the stores to come and the web app', async ({
  page,
}) => {
  await page.goto('/dashboard/profile');

  await page.getByRole('button', { name: 'Install app' }).tap();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('[data-install-channel]')).toHaveCount(3);
  await expect(dialog.getByText('Coming soon')).toHaveCount(2);
});

test('fits the screen without horizontal scrolling', async ({ page }) => {
  for (const name of [
    'today',
    'calendar',
    'statistics',
    'records',
    'metrics',
    'messages',
    'profile',
  ]) {
    await page.goto(`/dashboard/${name}`);
    await page.waitForLoadState('networkidle');

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows, name).toBe(false);
  }
});
