import { expect, test } from '@playwright/test';

import { importRecentRun } from '../../support/activities';
import { createAthlete, createCoachWithAthlete } from '../../support/api';
import { signIn } from '../../support/browser';

test.use({ storageState: { cookies: [], origins: [] } });

test('an athlete finds an activity and a page, not someone else', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const stranger = await createAthlete(request);
  await importRecentRun(request, athlete, 'RUNNING', 1, 30);
  await importRecentRun(request, stranger, 'CYCLING', 1, 30);
  await signIn(page, athlete);
  await page.goto('/dashboard/statistics');

  await page.locator('[data-finder-open]:visible').click();
  const dialog = page.getByRole('dialog');

  await dialog.getByRole('combobox').fill('stati');
  await expect(
    dialog.getByRole('option', { name: 'Statistics' }),
  ).toBeVisible();

  await dialog.getByRole('combobox').fill('session');
  await expect(dialog.getByText('RUNNING session')).toBeVisible();
  await expect(dialog.getByText('CYCLING session')).toHaveCount(0);

  await dialog.getByText('RUNNING session').click();
  await expect(page).toHaveURL(/\/dashboard\/activity\/\d+/);
});

test('a coach finds an athlete and their activities with the keyboard', async ({
  page,
  request,
}) => {
  const { coach, athlete, athleteId } = await createCoachWithAthlete(request);
  await importRecentRun(request, athlete, 'RUNNING', 1, 30);
  await signIn(page, coach);
  await page.goto('/dashboard/coach');

  // The shortcut listens once the dashboard has mounted
  await expect(page.getByRole('button', { name: /Search/ })).toBeVisible();
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').fill('session');
  await expect(dialog.getByText('RUNNING session')).toBeVisible();

  await dialog.getByRole('combobox').fill('Test Athlete');
  await dialog.getByRole('option').first().click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/calendar/${athleteId}`));
});
