import { type APIRequestContext, expect, test } from '@playwright/test';

import { type TestAthlete, apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const DAY = 24 * 3600 * 1000;

/** A session on `day` (local to the browser), mid-day so it stays that day */
async function plan(
  request: APIRequestContext,
  athlete: TestAthlete,
  name: string,
  day: Date,
) {
  const start = new Date(day);
  start.setHours(12, 0, 0, 0);
  const response = await request.post(`${API_URL}/event`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    data: {
      type: 'TRAINING',
      name,
      sport: 'RUNNING',
      description: '',
      goalDuration: 3600,
      startDate: start.toISOString(),
      endDate: new Date(start.getTime() + 3600_000).toISOString(),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
}

/** Monday of the week after this one, in the browser's time zone */
function nextMonday() {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

test('a week is copied onto the next one, undone, and shifted by a day', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const monday = nextMonday();
  await plan(request, athlete, 'Week intervals', monday);
  await plan(
    request,
    athlete,
    'Week long run',
    new Date(monday.getTime() + 5 * DAY),
  );

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar?view=week');
  await page.getByRole('button', { name: 'Next week' }).click();
  const cards = page.locator('.calendar-event');
  await expect(cards.filter({ hasText: 'Week intervals' })).toBeVisible();

  // Copy this week, paste it on the next one
  await page.locator('[data-week-actions]').click();
  await page.getByRole('menuitem', { name: 'Copy the week' }).click();
  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(cards).toHaveCount(0);
  await page.locator('[data-week-actions]').click();
  await page.getByRole('menuitem', { name: 'Paste the week here' }).click();

  await expect(page.getByText('Items pasted: 2')).toBeVisible();
  await expect(cards.filter({ hasText: 'Week intervals' })).toBeVisible();
  await expect(cards.filter({ hasText: 'Week long run' })).toBeVisible();

  // Undo removes the copies
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(cards).toHaveCount(0);

  // Back on the original week, shift its sessions a day later
  await page.getByRole('button', { name: 'Previous week' }).click();
  await page.locator('[data-week-actions]').click();
  await page.getByRole('menuitem', { name: 'Shift the sessions' }).click();
  await page.getByRole('menuitem', { name: 'One day later' }).click();

  await expect(page.getByText('Items moved: 2')).toBeVisible();
  const tuesday = new Date(monday.getTime() + DAY);
  const tuesdayKey = `${tuesday.getFullYear()}-${String(tuesday.getMonth() + 1).padStart(2, '0')}-${String(tuesday.getDate()).padStart(2, '0')}`;
  await expect(
    page
      .locator(`[data-calendar-day="${tuesdayKey}"]`)
      .locator('.calendar-event', { hasText: 'Week intervals' }),
  ).toBeVisible();
  expect(problems).toEqual([]);
});
