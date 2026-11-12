import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';
import { planStrengthSession } from '../../support/strength';

test.use({ storageState: { cookies: [], origins: [] } });

test('a strength session is played to the end and becomes its activity', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const { eventId } = await planStrengthSession(request, athlete);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto(`/play/${eventId}`);
  await expect(page.getByRole('heading', { name: 'Leg day' })).toBeVisible();
  await expect(page.locator('[data-player-kit]')).toContainText('Barbell');
  await page.locator('[data-player-start]').click();

  // Set 1 of the squats: done with one rep less and more weight
  await expect(page.locator('[data-player-exercise]')).toHaveText(
    'Barbell full squat',
  );
  await expect(page.locator('[data-player-position]')).toHaveText('Set 1 of 2');
  await page.getByRole('button', { name: 'Reps done −' }).click();
  await page.getByRole('button', { name: 'Load +' }).click();
  await page.locator('[data-player-primary]').click();

  // The rest counts down, with what comes next
  await expect(page.locator('[data-player-rest]')).toBeVisible();
  await expect(page.locator('[data-player-next]')).toContainText('Set 2 of 2');
  await page.getByRole('button', { name: '+15 s' }).click();
  await expect(page.locator('[data-player-clock]')).toHaveText(/1:4\d/);
  await page.locator('[data-player-primary]').click();

  // Set 2, then the superset round by round
  await page.locator('[data-player-primary]').click();
  await page.locator('[data-player-primary]').click();
  await expect(page.locator('[data-player-exercise]')).toHaveText('Pull-up');
  await expect(page.locator('[data-player-position]')).toHaveText(
    'Round 1 of 2 · Superset',
  );
  await page.locator('[data-player-skip]').click();
  for (let i = 0; i < 4; i += 1) {
    await page.locator('[data-player-primary]').click();
  }

  await expect(page.locator('[data-player="finished"]')).toBeVisible();
  await page.getByRole('radio', { name: '7' }).click();
  await page.getByLabel('How did it go? (optional)').fill('Strong legs');
  await page.locator('[data-player-save]').click();
  await expect(page).toHaveURL(/\/dashboard\/activity\/\d+/);

  const headers = apiHeaders(undefined, athlete.accessToken);
  const planned = (await (
    await request.get(`${API_URL}/event/${eventId}`, { headers })
  ).json()) as { relatedActivity?: { eventId: number } };
  expect(planned.relatedActivity?.eventId).toBeTruthy();
  const activity = (await (
    await request.get(`${API_URL}/event/${planned.relatedActivity!.eventId}`, {
      headers,
    })
  ).json()) as {
    sport: string;
    rpe: number;
    description: string;
    strengthLog: {
      sets: {
        exerciseRef: string;
        reps: number;
        load: number;
        skipped: boolean;
      }[];
    };
  };
  expect(activity).toMatchObject({
    sport: 'STRENGTH',
    rpe: 0.7,
    description: 'Strong legs',
  });
  expect(activity.strengthLog.sets[0]).toMatchObject({
    exerciseRef: 'c:barbell-full-squat',
    reps: 4,
    load: 82.5,
    skipped: false,
  });
  // The first pull-ups were skipped
  expect(activity.strengthLog.sets[2]).toMatchObject({
    exerciseRef: 'c:pull-up',
    skipped: true,
  });
  expect(problems).toEqual([]);
});

test('the session details offer to play a strength session', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await planStrengthSession(request, athlete, 'Upper body');
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard/calendar');
  await page.locator('.calendar-event', { hasText: 'Upper body' }).click();
  const details = page.locator('[data-event-details]');
  await expect(
    details.locator('[data-strength-view] [data-session-exercise]'),
  ).toHaveCount(3);
  await details.locator('[data-play-session]').click();
  await expect(page).toHaveURL(/\/play\/\d+/);
  await expect(page.locator('[data-player="ready"]')).toBeVisible();
  expect(problems).toEqual([]);
});
