import { expect, test } from '@playwright/test';

import { apiHeaders, createNewUser } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

/** A day about two months ahead, as the date field takes it */
function raceDay() {
  const day = new Date(Date.now() + 60 * 24 * 3600 * 1000);
  return day.toISOString().slice(0, 10);
}

test('an athlete answers in a few taps and finds their race on the calendar', async ({
  page,
  request,
}) => {
  const user = await createNewUser(request);
  await signIn(page, user);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard\/onboarding/);
  await expect(
    page.getByRole('heading', { name: 'Welcome to OpenAthlete' }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Train/ }).click();

  await expect(
    page.getByRole('heading', { name: 'Which sports do you practise?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Running', exact: true }).click();
  await page.getByRole('button', { name: 'Trail Running' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('button', { name: /^Prepare a race/ }).click();
  await page.getByRole('button', { name: 'Marathon', exact: true }).click();
  await page.getByLabel('Race date').fill(raceDay());
  await page.getByRole('button', { name: 'Continue' }).click();

  // The test instance has no device connector: the step lets them through
  await expect(
    page.getByRole('heading', { name: 'Connect your watch' }),
  ).toBeVisible();
  await page.getByRole('button', { name: "I don't have a watch" }).click();

  await page.getByRole('button', { name: '3 to 6 hours' }).click();

  // Back keeps the answers, forward again
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(
    page.getByRole('button', { name: '3 to 6 hours' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '3 to 6 hours' }).click();

  await page.getByRole('button', { name: 'Reddit' }).click();

  await expect(
    page.getByRole('heading', { name: 'Your space is ready' }),
  ).toBeVisible();
  await expect(page.getByText('Marathon ·')).toBeVisible();

  const me = await request.get(`${API_URL}/user/me`, {
    headers: apiHeaders(undefined, user.accessToken),
  });
  expect(await me.json()).toMatchObject({
    onboardingCompleted: true,
    practicedSports: ['RUNNING', 'TRAIL_RUNNING'],
    trainingGoal: 'RACE',
    weeklyTrainingHours: 'FROM_3_TO_6',
    acquisitionSource: 'REDDIT',
  });

  await page.getByRole('button', { name: 'Open my calendar' }).click();
  await expect(page).toHaveURL(/\/dashboard\/calendar/);
  expect(problems).toEqual([]);
});

test('a coach gets a join link to share during the onboarding', async ({
  page,
  request,
}) => {
  const user = await createNewUser(request);
  await signIn(page, user);

  await page.goto('/dashboard/onboarding');
  await page.getByRole('button', { name: /^Coach athletes/ }).click();
  await page.getByRole('button', { name: '6 to 20' }).click();

  await expect(
    page.getByRole('heading', { name: 'Invite your athletes' }),
  ).toBeVisible();
  await expect(page.getByText(/\/join\//)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your coach space is ready' }),
  ).toBeVisible();

  const me = await request.get(`${API_URL}/user/me`, {
    headers: apiHeaders(undefined, user.accessToken),
  });
  expect(await me.json()).toMatchObject({
    onboardingCompleted: true,
    coachTeamSize: 'FROM_6_TO_20',
  });
});
