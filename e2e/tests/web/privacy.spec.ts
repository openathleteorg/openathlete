import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';

test.use({ storageState: { cookies: [], origins: [] } });

test('downloads the account data from the settings', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  await page.goto('/dashboard/settings?tab=profile');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my data' }).click();

  expect((await download).suggestedFilename()).toMatch(
    /^openathlete-export-\d{4}-\d{2}-\d{2}\.json$/,
  );
});

// A self-hosted build has no tracker, so there is nothing to consent to
test('asks no tracking consent on a self-hosted instance', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  await page.goto('/dashboard/calendar');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Your privacy')).toHaveCount(0);
  await page.goto('/dashboard/settings?tab=profile');
  await expect(page.getByText('Usage analytics')).toHaveCount(0);
});
