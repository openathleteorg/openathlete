import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import {
  importSession,
  setHeartRateProfile,
  waitForIntensity,
} from '../../support/training';

test.use({ storageState: { cookies: [], origins: [] } });

test('statistics fit a phone, with figures that open by touch', async ({
  page,
  request,
}, info) => {
  test.setTimeout(60_000);
  const athlete = await createAthlete(request);
  const me = await request.get(`${API_URL}/athlete/me`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });
  const { athleteId } = (await me.json()) as { athleteId: number };
  await setHeartRateProfile(request, athlete);
  for (const daysAgo of [1, 4, 8, 11, 15]) {
    await importSession(request, athlete, {
      sport: 'RUNNING',
      daysAgo,
      minutes: 50,
      speed: 3,
      heartrate: (minute) => 125 + minute * 0.1,
      climb: 2,
    });
  }
  await waitForIntensity(request, athlete, athleteId);
  await signIn(page, athlete);

  await page.goto('/dashboard/statistics?sport=RUNNING');
  await expect(page.locator('[data-stat-tile]').first()).toBeVisible();
  for (const id of ['volume', 'regularity', 'load', 'intensity', 'trends']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  }
  await page.waitForLoadState('networkidle');

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);

  const about = page.getByRole('button', { name: 'About GAP' });
  await about.scrollIntoViewIfNeeded();
  const box = await about.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await about.tap();
  await expect(page.getByText('Measured on a treadmill')).toBeVisible();

  if (process.env.STATS_SHOTS) {
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `${process.env.STATS_SHOTS}/${info.project.name}.png`,
      fullPage: true,
    });
  }
});
