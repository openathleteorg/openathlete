import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

test('sessions show their workout profile, and the display settings follow the account', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const planned = await request.post(`${API_URL}/event`, {
    headers,
    data: {
      type: 'TRAINING',
      name: 'Hill repeats',
      sport: 'RUNNING',
      description: '',
      goalDuration: 3000,
      goalDistance: 10000,
      startDate: start.toISOString(),
      endDate: new Date(start.getTime() + 3000_000).toISOString(),
      workout: {
        steps: [
          { stepType: 'WARMUP', durationType: 'TIME', durationValue: 900 },
          {
            stepType: 'REPEAT',
            durationType: 'OPEN',
            repeatBlock: {
              repetitions: 6,
              childSteps: [
                {
                  stepType: 'INTERVAL_ACTIVE',
                  durationType: 'TIME',
                  durationValue: 120,
                },
                {
                  stepType: 'INTERVAL_REST',
                  durationType: 'TIME',
                  durationValue: 120,
                },
              ],
            },
          },
          { stepType: 'COOLDOWN', durationType: 'TIME', durationValue: 600 },
        ],
      },
    },
  });
  expect(planned.status(), await planned.text()).toBe(201);

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar');
  const card = page.locator('.calendar-event', { hasText: 'Hill repeats' });
  await expect(card.locator('[data-workout-profile] polygon')).toHaveCount(14);
  await expect(card).toContainText('10 km');

  await page.getByRole('button', { name: 'Display' }).click();
  const settings = page.locator('[data-calendar-display-settings]');
  await settings.getByLabel('Distance').first().click();
  await expect(card).not.toContainText('10 km');
  await settings.getByRole('radio', { name: 'Compact' }).click();
  await expect(
    settings.getByRole('radio', { name: 'Compact' }),
  ).toHaveAttribute('aria-checked', 'true');

  // Saved with the account: still applied after a reload
  await expect
    .poll(async () => {
      const me = await (
        await request.get(`${API_URL}/user/me`, { headers })
      ).json();
      return me.calendarDisplay?.card?.distance;
    })
    .toBe(false);
  await page.reload();
  await expect(card).toBeVisible();
  await expect(card).not.toContainText('10 km');
  await expect(card.locator('[data-workout-profile]')).toBeVisible();
  expect(problems).toEqual([]);
});
