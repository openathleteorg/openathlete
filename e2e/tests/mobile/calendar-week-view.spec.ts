import { type Locator, expect, test } from '@playwright/test';

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

/** A one-finger swipe across the element, `dx` pixels sideways */
async function swipe(target: Locator, dx: number) {
  const box = await target.boundingBox();
  if (!box) throw new Error('nothing to swipe on');
  const start = { identifier: 0, clientX: box.x + box.width / 2, clientY: 200 };
  const end = { ...start, clientX: start.clientX + dx };
  await target.dispatchEvent('touchstart', {
    touches: [start],
    changedTouches: [start],
    targetTouches: [start],
  });
  await target.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [end],
    targetTouches: [],
  });
}

test('arrows, swipes and Today step through weeks on mobile', async ({
  page,
  request,
}) => {
  await signIn(page, await createAthlete(request));
  await page.goto('/dashboard/calendar?view=week');
  const range = page.locator('[data-calendar-week-range]');
  const thisWeek = (await range.textContent()) ?? '';
  await expect(page.locator('[data-calendar-today]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Next week' }).tap();
  await expect(range).not.toHaveText(thisWeek);
  const nextWeek = (await range.textContent()) ?? '';
  await page.getByRole('button', { name: 'Previous week' }).tap();
  await expect(range).toHaveText(thisWeek);

  // A swipe to the left shows the next week, to the right the previous one
  const days = page.locator('[data-calendar-week]');
  await swipe(days, -160);
  await expect(range).toHaveText(nextWeek);
  await swipe(days, 160);
  await expect(range).toHaveText(thisWeek);

  await page.getByRole('button', { name: 'Previous week' }).tap();
  await page.getByRole('button', { name: 'Previous week' }).tap();
  await page.locator('[data-calendar-today]').tap();
  await expect(range).toHaveText(thisWeek);
});
