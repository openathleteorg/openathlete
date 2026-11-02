import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';

// The view is saved with the account: an account of its own leaves others alone
test.use({ storageState: { cookies: [], origins: [] } });

test('switches to week view, navigates, and remembers the selected view', async ({
  page,
  request,
}) => {
  await signIn(page, await createAthlete(request));
  await page.goto('/dashboard/calendar');
  await page.getByRole('tab', { name: 'Week', exact: true }).click();
  const week = page.locator('[data-calendar-week]');
  await expect(week).toBeVisible();
  await expect(week.locator('[data-calendar-day]')).toHaveCount(7);
  const first = await week
    .locator('[data-calendar-day]')
    .first()
    .getAttribute('data-calendar-day');
  await page.getByRole('button', { name: 'Next week', exact: true }).click();
  await expect(week.locator('[data-calendar-day]').first()).not.toHaveAttribute(
    'data-calendar-day',
    first!,
  );
  await page
    .getByRole('button', { name: 'Previous week', exact: true })
    .click();
  await expect(week.locator('[data-calendar-day]').first()).toHaveAttribute(
    'data-calendar-day',
    first!,
  );
  await page.reload();
  await expect(
    page.getByRole('tab', { name: 'Week', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Month', exact: true }).click();
  await expect(week).toHaveCount(0);
});

test('opens week view from a direct calendar link', async ({
  page,
  request,
}) => {
  await signIn(page, await createAthlete(request));
  await page.goto('/dashboard/calendar?view=week');
  await expect(
    page.locator('[data-calendar-week] [data-calendar-day]'),
  ).toHaveCount(7);
});
