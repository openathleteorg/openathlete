import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { setPlan } from '../../support/billing';
import { signIn } from '../../support/browser';
import { BILLING_API_URL } from '../../support/env';
import { importSession } from '../../support/training';

/** A new athlete with two runs: the statistics need activities to show */
async function athleteWithRuns(request: Parameters<typeof importSession>[0]) {
  const athlete = await createAthlete(request);
  for (const daysAgo of [2, 5]) {
    await importSession(request, athlete, {
      sport: 'RUNNING',
      daysAgo,
      minutes: 45,
      speed: 3,
      heartrate: (minute) => 130 + minute * 0.1,
      climb: 4,
    });
  }
  return athlete;
}

// The instance with billing (stripe-mock): what a free account and a
// Supporter see of the perks, on desktop and on a phone

test('a free account discovers the Lab and the comparison behind a lock', async ({
  page,
  request,
}) => {
  const athlete = await athleteWithRuns(request);
  const current = await request.get(`${BILLING_API_URL}/subscription/current`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });
  const subscription = (await current.json()) as {
    billingEnabled: boolean;
    features: Record<string, { available: boolean; reason: string }>;
  };
  expect(subscription.billingEnabled).toBe(true);
  expect(subscription.features.lab).toMatchObject({
    available: false,
    reason: 'locked',
  });

  // The Lab endpoints send a teaser, never the data
  const me = await request.get(`${BILLING_API_URL}/athlete/me`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });
  const { athleteId } = (await me.json()) as { athleteId: number };
  const terrain = await request.get(`${BILLING_API_URL}/statistics/terrain`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    params: {
      athleteId,
      sport: 'RUNNING',
      from: new Date(Date.now() - 84 * 86_400_000).toISOString(),
      to: new Date().toISOString(),
    },
  });
  expect(await terrain.json()).toMatchObject({ locked: true });

  await signIn(page, athlete);
  // A shared comparison link opens without the comparison, without an error
  await page.goto('/dashboard/statistics?compare=previous');
  const tabs = page.getByRole('tablist').first();
  await expect(tabs.locator('[aria-label="Supporter"]')).toHaveCount(2);

  await page.goto('/dashboard/statistics?view=capacities');
  const preview = page.locator('[data-lab-preview]');
  await expect(preview).toBeVisible();
  // The paywall opens on a click only
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await preview.locator('[data-locked-feature] button').first().click();
  await expect(page.getByRole('dialog')).toContainText('The Lab');
});

test('a Supporter has the Lab, without any lock', async ({ page, request }) => {
  const athlete = await athleteWithRuns(request);
  setPlan(athlete.email, 'supporter');
  await signIn(page, athlete);

  await page.goto('/dashboard/statistics?view=capacities');
  await expect(page.getByRole('tablist').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-lab-preview]')).toHaveCount(0);
  await expect(page.locator('[data-supporter-lock]')).toHaveCount(0);
});
