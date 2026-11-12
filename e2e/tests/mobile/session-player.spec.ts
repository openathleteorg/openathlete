import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';
import { planStrengthSession } from '../../support/strength';

test.use({ storageState: { cookies: [], origins: [] } });

test('the player fills the phone screen and resumes after a reload', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const { eventId } = await planStrengthSession(request, athlete);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto(`/play/${eventId}`);
  await page.locator('[data-player-start]').tap();
  await expect(page.locator('[data-player-work]')).toBeVisible();

  // Nothing wider than the phone, and the main button in reach
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const primary = page.locator('[data-player-primary]');
  await expect(primary).toBeInViewport();
  const box = (await primary.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);

  await primary.tap();
  await expect(page.locator('[data-player-rest]')).toBeVisible();

  // A reload keeps the session, paused where it was
  await page.reload();
  await expect(page.locator('[data-player="paused"]')).toBeVisible();
  await expect(page.locator('[data-player-rest]')).toBeVisible();
  await primary.tap();
  await expect(page.locator('[data-player="running"]')).toBeVisible();
  expect(problems).toEqual([]);
});
