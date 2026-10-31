import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';

// The view is saved with the account: an account of its own leaves others alone
test.use({ storageState: { cookies: [], origins: [] } });

test('weekly calendar keeps all seven days and navigation reachable on mobile', async ({
  page,
  request,
}) => {
  await signIn(page, await createAthlete(request));
  await page.goto('/dashboard/calendar?view=week');
  const week = page.locator('[data-calendar-week]');
  await expect(week.locator('[data-calendar-day]')).toHaveCount(7);
  await week.locator('[data-calendar-day]').last().scrollIntoViewIfNeeded();
  await expect(week.locator('[data-calendar-day]').last()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('tab', { name: 'Month', exact: true }).click();
  await expect(week).toHaveCount(0);
});
