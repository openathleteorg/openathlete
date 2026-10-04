import { expect, test } from '@playwright/test';
import path from 'node:path';

// A synthetic 10-minute run recorded with the Garmin FIT SDK; no real data.
const FIT = path.join(import.meta.dirname, '../../fixtures/synthetic-run.fit');
const GPX = path.join(import.meta.dirname, '../../fixtures/synthetic-run.gpx');

test('imports FIT files from Settings > Connectors', async ({ page }) => {
  await page.goto('/dashboard/settings?tab=connectors');
  await page.locator('[data-import-fit-trigger]').click();

  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type="file"]').setInputFiles(FIT);
  await expect(dialog.locator('input[name="name"]')).toHaveValue(
    'synthetic-run',
  );
  await dialog.locator('button[type="submit"]').click();

  // The shared athlete may already have it from an earlier run.
  const result = dialog.locator('[data-import-result="ok"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('synthetic-run');
  await expect(result.getByRole('button')).toBeVisible();
});

test('imports a GPX file with its track name and a sport', async ({ page }) => {
  await page.goto('/dashboard/settings?tab=connectors');
  await page.locator('[data-import-fit-trigger]').click();

  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type="file"]').setInputFiles(GPX);
  // The name comes from the track, not the file.
  await expect(dialog.locator('input[name="name"]')).toHaveValue(
    'Synthetic run',
  );
  await dialog.locator('select[name="sport"]').selectOption('RUNNING');
  await dialog.locator('button[type="submit"]').click();

  const result = dialog.locator('[data-import-result="ok"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('Synthetic run');
});
