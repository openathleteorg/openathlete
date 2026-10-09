import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const GPX = readFileSync(
  path.join(import.meta.dirname, '../../fixtures/synthetic-run.gpx'),
  'utf8',
);

test('a GPX file dropped on a day is imported', async ({ page, request }) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar');

  // What the browser hands over when a file is dragged from the computer
  const files = await page.evaluateHandle((content) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([content], 'morning.gpx', { type: 'application/gpx+xml' }),
    );
    return transfer;
  }, GPX);
  const day = page.locator('[data-calendar-day]').nth(10).locator('..');
  // Drops are accepted once the calendar knows it is the athlete's own
  await expect(async () => {
    await day.dispatchEvent('dragover', { dataTransfer: files });
    await expect(day).toHaveAttribute('data-file-drop', 'true', {
      timeout: 500,
    });
  }).toPass();
  await day.dispatchEvent('drop', { dataTransfer: files });

  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('input[name="name"]')).toHaveValue(
    'Synthetic run',
  );
  await dialog.locator('button[type="submit"]').click();
  const result = dialog.locator('[data-import-result="ok"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('Synthetic run');
  expect(problems).toEqual([]);
});
