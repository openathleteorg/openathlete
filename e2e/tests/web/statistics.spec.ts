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

  await page.locator('#intensity').scrollIntoViewIfNeeded();
  await expect(page.getByText('at least three heart rate zones')).toBeVisible();

  const tsb = page.locator('[data-tsb-chart]');
  await tsb.scrollIntoViewIfNeeded();
  await expect(tsb).toBeVisible();
  await expect(page.getByText('Daily load')).toBeVisible();
  await expect(page.getByText('Estimate').first()).toBeVisible();

  // A sport brings its trends, and the choice stays in the URL
  await expect(page.getByText('Choose a sport').first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Sport' }).click();
  await page.getByRole('option', { name: 'Running', exact: true }).click();
  await expect(page).toHaveURL(/sport=RUNNING/);
  const pace = page.locator('[data-trend="speed"]');
  await pace.scrollIntoViewIfNeeded();
  // One run: a single point, without a line to draw
  await expect(pace.locator('circle[r="3"]').first()).toBeVisible();

  const performance = page.locator('#performance');
  await performance.scrollIntoViewIfNeeded();
  await expect(performance.getByText('New records')).toBeVisible();

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
