import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { importRunWithRecords } from '../../support/records';

test.use({ storageState: { cookies: [], origins: [] } });

test('the records page fits a phone screen', async ({ page, request }) => {
  const athlete = await createAthlete(request);
  await importRunWithRecords(request, athlete);
  await signIn(page, athlete);

  await page.goto('/dashboard/records');
  await expect(page.locator('[data-records-metric="SPEED"]')).toBeVisible();

  // Years wrap inside each row: the page never scrolls sideways
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  // Every year stays readable, and a record opens in a sheet
  const row = page.locator('[data-record-row="1 km"]');
  await expect(row.locator('[data-record-year]').first()).toBeVisible();
  await row.click();
  await expect(
    page.getByRole('dialog').getByText('Best efforts'),
  ).toBeVisible();
});
