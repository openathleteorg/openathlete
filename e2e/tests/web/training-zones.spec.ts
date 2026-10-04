import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';

// A fresh athlete: sign-up gave them the five default heart-rate zones in bpm,
// and onboarding saved a maximum HR of 190 and a resting HR of 50.
test.use({ storageState: { cookies: [], origins: [] } });

test('sets heart-rate zones from the heart-rate reserve', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard/settings?tab=training_zones');
  await page.getByRole('button', { name: 'Edit zones' }).click();
  const dialog = page.getByRole('dialog');

  await dialog.getByRole('button', { name: '% of heart-rate reserve' }).click();
  // The editor reads both heart rates from the athlete's metrics.
  await expect(dialog.locator('#zones-hr-max')).toHaveValue('190');
  await expect(dialog.locator('#zones-hr-rest')).toHaveValue('50');

  await dialog
    .getByRole('button', { name: 'Apply default percentages' })
    .click();
  // 50 + 50% × (190 − 50) = 120, 50 + 60% × 140 = 134, and so on
  await expect(dialog.getByTestId('hr-zone-preview')).toHaveText([
    '120–133 bpm',
    '134–147 bpm',
    '148–161 bpm',
    '162–175 bpm',
    '176–190 bpm',
  ]);

  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();

  // Zones are saved in bpm.
  const zone2 = page.getByRole('row', { name: /Zone 2/ });
  await expect(zone2).toContainText('134');
  await expect(zone2).toContainText('147');
  await expect(page.getByRole('row', { name: /Zone 1/ })).toContainText('120');
  expect(problems).toEqual([]);
});
