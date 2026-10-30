import { expect, test } from '@playwright/test';

import { importRecentRun } from '../../support/activities';
import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

test('statistics read the last weeks, by section, with filters in the URL', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await importRecentRun(request, athlete, 'RUNNING', 1, 30);
  await importRecentRun(request, athlete, 'CYCLING', 3, 60);
  await importRecentRun(request, athlete, 'CYCLING', 40, 90);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard/statistics');

  const tiles = page.locator('[data-stat-tile]');
  await expect(tiles).toHaveCount(5);
  await expect(tiles.first()).toContainText('Time in motion');

  // Each pie names its sports without hovering
  const volume = page.locator('[data-volume]');
  await volume.scrollIntoViewIfNeeded();
  await expect(
    page.locator('[data-sport-legend="CYCLING"]').first(),
  ).toContainText('%');
  await expect(volume.locator('.recharts-rectangle').first()).toBeVisible();

  const calendar = page.locator('[data-activity-calendar]');
  await calendar.scrollIntoViewIfNeeded();
  await expect(calendar.locator('[title]').first()).toBeAttached();

  await page.getByRole('tab', { name: 'Load' }).click();
  await expect(page).toHaveURL(/view=load/);
  await expect(page.locator('[data-tsb-chart]')).toBeVisible();
  await expect(page.getByText('Daily load')).toBeVisible();
  await expect(page.getByText('Estimate').first()).toBeVisible();

  // A sport stays in the URL, from one view to the next
  await page.getByRole('combobox', { name: 'Sport' }).click();
  await page.getByRole('option', { name: 'Running', exact: true }).click();
  await expect(page).toHaveURL(/sport=RUNNING/);
  await page.getByRole('tab', { name: 'Trends' }).click();
  await expect(
    page.locator('[data-trend="speed"]').locator('circle[r="3"]').first(),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Sport' })).toContainText(
    'Running',
  );

  expect(problems).toEqual([]);
});

test('the former Progression page leads to the statistics', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);

  await page.goto('/dashboard/progression');
  await expect(page).toHaveURL(/\/dashboard\/statistics$/);
});
