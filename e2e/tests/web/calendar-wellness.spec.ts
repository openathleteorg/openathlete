import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const todayKey = () => {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

test('an athlete without wellness data costs no wellness query', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const days = page.waitForRequest((req) =>
    req.url().includes('/training-load/days'),
  );
  await page.goto('/dashboard/calendar');
  expect(new URL((await days).url()).searchParams.get('wellness')).toBe(
    'false',
  );
  await expect(page.locator('[data-calendar-day]').first()).toBeVisible();
  await expect(page.locator('[data-day-wellness]')).toHaveCount(0);
});

test("the day's sleep and resting heart rate show under it, until turned off", async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  // Midday, so the measurement stays on today in the browser's time zone
  const date = new Date(`${todayKey()}T12:00:00-04:00`).toISOString();
  for (const [type, value] of [
    ['SLEEP_DURATION', 7.5],
    ['HR_REST', 48],
  ] as const) {
    const response = await request.post(`${API_URL}/metric`, {
      headers,
      data: { type, value, date },
    });
    expect(response.status(), await response.text()).toBe(201);
  }

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar');
  const row = page
    .locator(`[data-calendar-day="${todayKey()}"]`)
    .locator('[data-day-wellness]');
  await expect(row).toContainText('7h30');
  await expect(row).toContainText('48');
  await expect(row.getByText('Resting heart rate: 48 bpm')).toBeAttached();

  await page.getByRole('button', { name: 'Display' }).click();
  await page.getByRole('checkbox', { name: 'Wellness and form' }).click();
  await expect(page.locator('[data-day-wellness]')).toHaveCount(0);
  expect(problems).toEqual([]);
});
