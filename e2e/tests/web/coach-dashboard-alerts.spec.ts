import { type APIRequestContext, expect, test } from '@playwright/test';

import {
  type TestUser,
  apiHeaders,
  createAthlete,
  linkCoach,
} from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

/** The athlete logs today's resting heart rate */
async function logRestingHr(
  request: APIRequestContext,
  athlete: TestUser,
  value: number,
) {
  const response = await request.post(`${API_URL}/metric`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    data: {
      type: 'HR_REST',
      value,
      date: new Date().toISOString().slice(0, 10),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
}

test('a coach watches a metric, picks columns and compares athletes', async ({
  page,
  request,
}) => {
  const coach = await createAthlete(request, {
    roles: ['ATHLETE', 'COACH'],
    firstName: 'Olga',
  });
  const [ines, jon] = [
    await createAthlete(request, { firstName: 'Ines' }),
    await createAthlete(request, { firstName: 'Jon' }),
  ];
  await linkCoach(request, coach, ines);
  await linkCoach(request, coach, jon);

  await signIn(page, coach);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/coach');
  await expect(page.locator('[data-coach-table]')).toBeVisible();

  // An alert above 58 bpm for Ines
  await page.locator('[data-coach-thresholds]').click();
  const thresholds = page.locator('[data-thresholds-dialog]');
  await thresholds.getByLabel(/Maximum/).fill('58');
  await thresholds.getByText('Ines Athlete').click();
  await thresholds
    .getByRole('button', { name: 'Set for 1 athlete(s)' })
    .click();
  await expect(page.getByText('Alert saved')).toBeVisible();
  await expect(thresholds.locator('[data-thresholds-list]')).toContainText(
    'Ines Athlete',
  );
  await page.keyboard.press('Escape');

  await logRestingHr(request, ines, 63);
  await logRestingHr(request, jon, 63);
  await page.reload();

  // Only Ines is flagged, with the cause, and the alert opens her metrics
  const alert = page.locator('[data-coach-alert="threshold"]');
  await expect(alert).toHaveCount(1);
  await expect(alert).toHaveText('Resting Heart Rate 63, above 58');

  // A column of the metric, kept with the account
  await page.locator('[data-coach-columns]').click();
  await page.getByRole('checkbox', { name: 'Resting Heart Rate' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-coach-column="HR_REST"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-coach-column="HR_REST"]')).toBeVisible();

  // Both athletes side by side
  await page.getByRole('checkbox', { name: 'Compare Ines Athlete' }).click();
  await page.getByRole('checkbox', { name: 'Compare Jon Athlete' }).click();
  await page.locator('[data-compare-athletes-button]').click();
  const compare = page.locator('[data-compare-athletes]');
  await expect(compare).toContainText('Ines Athlete');
  await expect(compare).toContainText('Jon Athlete');
  await page.keyboard.press('Escape');

  // The period before, next to each figure
  await page.locator('[data-compare-previous]').click();
  await expect(
    page.locator('[data-coach-row="Ines Athlete"]').getByText('='),
  ).not.toHaveCount(0);

  await alert.click();
  await expect(page).toHaveURL(/\/dashboard\/metrics\/\d+$/);
  expect(problems).toEqual([]);
});
