import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';

// A fresh athlete: onboarding saved a maximum HR of 190 and a resting HR of 50.
test.use({ storageState: { cookies: [], origins: [] } });

test('creates heart-rate zones from the heart-rate reserve', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard/settings?tab=training_zones');
  await page.getByRole('button', { name: 'Create zones' }).click();
  const dialog = page.getByRole('dialog');

  // New zones start from the maximum heart rate the athlete entered.
  await expect(dialog.locator('#zones-hr-max')).toHaveValue('190');
  const previews = dialog.getByTestId('hr-zone-preview');
  await expect(previews).toHaveText([
    '0–94 bpm',
    '95–113 bpm',
    '114–132 bpm',
    '133–151 bpm',
    '152–170 bpm',
    '171–190 bpm',
  ]);

  await dialog.getByRole('button', { name: '% of heart-rate reserve' }).click();
  await expect(dialog.locator('#zones-hr-rest')).toHaveValue('50');
  // 50 + 60% × (190 − 50) = 134
  await expect(previews.nth(2)).toHaveText('134–147 bpm');

  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();

  // Zones are saved in bpm.
  const zone2 = page.getByRole('row', { name: /Zone 2/ });
  await expect(zone2).toContainText('134');
  await expect(zone2).toContainText('147');
  await expect(page.getByRole('row', { name: /Zone 0/ })).toContainText('50');
  expect(problems).toEqual([]);
});
