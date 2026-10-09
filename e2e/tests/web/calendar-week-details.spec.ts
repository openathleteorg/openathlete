import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

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

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

test('the week view shows each day total, detailed sessions and the week summary beside them', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const monday = nextMonday();
  const plan = async (
    name: string,
    hour: number,
    seconds: number,
    meters: number,
  ) => {
    const start = new Date(monday);
    start.setHours(hour, 0, 0, 0);
    const response = await request.post(`${API_URL}/event`, {
      headers,
      data: {
        type: 'TRAINING',
        name,
        sport: 'RUNNING',
        description: `${name}: keep it relaxed and focus on cadence`,
        goalDuration: seconds,
        goalDistance: meters,
        goalRpe: 0.4,
        startDate: start.toISOString(),
        endDate: new Date(start.getTime() + seconds * 1000).toISOString(),
      },
    });
    expect(response.status(), await response.text()).toBe(201);
  };
  // Listed by time, whatever the creation order
  await plan('Evening jog', 18, 1800, 5000);
  await plan('Morning run', 7, 3600, 10000);

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar?view=week');
  await page.getByRole('button', { name: 'Next week' }).click();

  const day = page.locator(`[data-calendar-day="${dayKey(monday)}"]`);
  await expect(day.locator('[data-day-total]')).toHaveText('1h30 · 15 km');
  await expect(day.locator('.calendar-event')).toHaveText([
    /Morning run/,
    /Evening jog/,
  ]);
  const morning = day.locator('.calendar-event', { hasText: 'Morning run' });
  await expect(morning.locator('[data-event-description]')).toContainText(
    'focus on cadence',
  );
  await expect(morning).toContainText('Effort 4/10');

  // At 1280 px the summary sits beside the days
  const summary = page.getByRole('complementary', { name: 'Done / planned' });
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('1h30');
  expect(problems).toEqual([]);
});
