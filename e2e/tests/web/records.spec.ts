import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';
import { importRunWithRecords } from '../../support/records';

test.use({ storageState: { cookies: [], origins: [] } });

test('reads records across the years, and excludes an effort', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await importRunWithRecords(request, athlete);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard/records');

  // Pace along distance, heart rate along duration: never on one chart
  const pace = page.locator('[data-records-metric="SPEED"]');
  await expect(pace.locator('svg.recharts-surface').first()).toBeVisible();
  const kilometre = pace.locator('[data-record-row="1 km"]');
  // The time over the kilometre, then its pace
  await expect(kilometre).toContainText(/\d+:\d\d \d+:\d\d/);

  await page.getByRole('tab', { name: 'Heart Rate' }).click();
  await expect(
    page
      .locator('[data-records-metric="HEARTRATE"]')
      .locator('[data-record-row="5 min"]'),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Pace' }).click();

  // Training paces come from the strongest effort of the run
  const paces = page.locator('[data-training-paces]');
  await expect(paces.getByText(/^VDOT \d+\.\d/)).toBeVisible();
  await expect(
    paces.getByRole('row', { name: /^Threshold/ }).getByRole('cell'),
  ).toContainText(/\d+:\d\d/);

  // A record opens on its efforts, each leading to its activity
  await kilometre.click();
  const detail = page.getByRole('dialog');
  await expect(detail.getByText('Best efforts')).toBeVisible();
  const effort = detail.locator('[data-record-effort]').first();
  await expect(effort).toContainText('Records run');

  // Excluded, the only run leaves the page
  await effort.getByRole('button', { name: 'Exclude' }).click();
  await effort.getByRole('button', { name: /The whole activity/ }).click();
  await expect(effort.getByRole('button', { name: 'Restore' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('No records found')).toBeVisible();

  const response = await request.get(`${API_URL}/record?sport=RUNNING`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });
  expect(await response.json()).toEqual([]);

  // Nothing left on the page, yet it can still be undone
  await page
    .locator('[data-record-exclusions]')
    .getByRole('button', { name: 'Restore' })
    .click();
  await expect(page.locator('[data-record-row="1 km"]')).toBeVisible();

  expect(problems).toEqual([]);
});

test('restores an excluded effort', async ({ page, request }) => {
  const athlete = await createAthlete(request);
  await importRunWithRecords(request, athlete);
  await signIn(page, athlete);

  await page.goto('/dashboard/records');
  await page.locator('[data-record-row="1 km"]').click();
  const effort = page
    .getByRole('dialog')
    .locator('[data-record-effort]')
    .first();
  await effort.getByRole('button', { name: 'Exclude' }).click();
  await effort.getByRole('button', { name: 'This effort only' }).click();
  await page.keyboard.press('Escape');

  // Only this distance goes: the rest of the run still counts
  await expect(page.locator('[data-record-row="1 km"]')).toHaveCount(0);
  await expect(page.locator('[data-record-row="400 m"]')).toBeVisible();

  const exclusions = page.locator('[data-record-exclusions]');
  await exclusions.getByRole('button', { name: 'Restore' }).click();
  await expect(page.locator('[data-record-row="1 km"]')).toBeVisible();
});
