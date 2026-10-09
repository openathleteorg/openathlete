import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

test('an activity done without a device is logged from the day menu', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar');

  const day = page.locator('[data-calendar-day]').nth(9);
  await day.hover();
  await day.locator('[data-calendar-day-plan]').click();
  await page.getByRole('menuitem', { name: 'Add an activity' }).click();

  const form = page.getByRole('dialog');
  await form.getByLabel('Event Name').fill('Hill walk');
  await form.getByLabel('Distance').fill('8');
  await form.getByRole('button', { name: 'Create', exact: true }).click();

  const card = page.locator('.calendar-event', { hasText: 'Hill walk' });
  await expect(card).toContainText('8 km');
  await expect(card).toContainText('1h');
  expect(problems).toEqual([]);
});
