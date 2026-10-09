import { type APIRequestContext, expect, test } from '@playwright/test';

import { type TestAthlete, apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const DAY = 24 * 3600 * 1000;

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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

test('a trip moves the sessions it covers after it', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const monday = nextMonday();
  const tuesday = new Date(monday.getTime() + DAY);
  const wednesday = new Date(monday.getTime() + 2 * DAY);
  await plan(request, athlete, 'Before the trip', monday);
  await plan(request, athlete, 'Trip intervals', tuesday);

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar?view=week');
  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(
    page.locator('.calendar-event', { hasText: 'Trip intervals' }),
  ).toBeVisible();

  // Drag across Tuesday and Wednesday to create the period
  await page.waitForLoadState('networkidle');
  const from = (await page
    .locator(`[data-calendar-day="${dayKey(tuesday)}"]`)
    .boundingBox())!;
  const to = (await page
    .locator(`[data-calendar-day="${dayKey(wednesday)}"]`)
    .boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height - 12);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height - 12, {
    steps: 8,
  });
  await page.mouse.up();

  const form = page.getByRole('dialog');
  await form.getByRole('radio', { name: 'Travel' }).click();
  await expect(form.getByLabel('Cycle Name')).toHaveValue('Travel');
  await form.getByRole('button', { name: 'Create' }).click();

  // The sessions of the trip are listed, with where they would go
  const review = page.locator('[data-unavailable-review]');
  await expect(review).toContainText('Trip intervals');
  await expect(review).not.toContainText('Before the trip');
  await review
    .getByRole('radio', { name: /Move them after the period/ })
    .click();
  await review.locator('[data-unavailable-apply]').click();

  await expect(page.getByText('Items moved: 1')).toBeVisible();
  // Two days later: Thursday, the day after the trip
  const thursday = new Date(monday.getTime() + 3 * DAY);
  await expect(
    page
      .locator(`[data-calendar-day="${dayKey(thursday)}"]`)
      .locator('.calendar-event', { hasText: 'Trip intervals' }),
  ).toBeVisible();
  expect(problems).toEqual([]);
});
