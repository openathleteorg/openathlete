import { expect, test } from '@playwright/test';

import { trackPageProblems } from '../../support/page-health';

test('navigates through the drawer menu', async ({ page }) => {
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar');

  const menu = page.locator('[data-mobile-menu-trigger]');
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');

  await page.getByRole('link', { name: 'Statistics' }).click();

  await expect(page).toHaveURL(/\/dashboard\/statistics/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  expect(problems).toEqual([]);
});

test('fits the screen without horizontal scrolling', async ({ page }) => {
  for (const name of ['calendar', 'statistics', 'sync', 'settings']) {
    await page.goto(`/dashboard/${name}`);
    await page.waitForLoadState('networkidle');

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows, name).toBe(false);
  }
});

test('keeps Apple Health controls exclusive to the native app', async ({
  page,
}) => {
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/settings?tab=connectors');
  await expect(
    page.getByRole('tabpanel', { name: 'Connectors' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Read Watch activities' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Send activities', exact: true }),
  ).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('opens the separate sync page from the menu and imports files', async ({
  page,
}) => {
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar');
  await expect(page.locator('[data-sync-panel]')).toHaveCount(0);
  const menu = page.locator('[data-mobile-menu-trigger]');
  await menu.click();
  const drawer = page.getByRole('dialog');
  const urls = await drawer
    .locator('a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const metrics = urls.indexOf('/dashboard/metrics');
  expect(urls.slice(metrics, metrics + 3)).toEqual([
    '/dashboard/metrics',
    '/dashboard/sync',
    '/dashboard/messages',
  ]);
  await drawer
    .getByRole('link', { name: 'Sync & import', exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard\/sync$/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  const panel = page.locator('[data-sync-panel]');
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Import file', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('input[type="file"]')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.goto('/dashboard/settings?tab=connectors');
  await expect(page.locator('[data-import-fit-trigger]')).toHaveCount(0);
  expect(problems).toEqual([]);
});
