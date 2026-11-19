import { type Page, expect, test } from '@playwright/test';

import { importRecentRun } from '../../support/activities';
import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const DAY_MS = 24 * 3600 * 1000;

/**
 * Moves today's date, as `new Date()` reads it, to `day`. Date.now() keeps
 * the real time: the app checks its tokens against it, and a whole clock
 * moved a month ahead would find them expired and sign out.
 */
async function fakeToday(page: Page, day: string) {
  await page.addInitScript((target) => {
    const RealDate = Date;
    const shift = new RealDate(target).getTime() - RealDate.now();
    window.Date = new Proxy(RealDate, {
      construct: (target, args: unknown[]) =>
        args.length === 0
          ? new target(RealDate.now() + shift)
          : Reflect.construct(target, args),
    });
  }, day);
}

/**
 * The year the runs land in, and how many days ago to import them: in the
 * first days of January they go to the year that just ended, so the review
 * always has its 10 activities.
 */
function reviewYear() {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / DAY_MS,
  );
  return dayOfYear > 12
    ? { year: now.getUTCFullYear(), firstDaysAgo: 1 }
    : { year: now.getUTCFullYear() - 1, firstDaysAgo: dayOfYear + 1 };
}

test('announces the year review in December, then keeps it in the sidebar', async ({
  page,
  request,
}) => {
  const { year, firstDaysAgo } = reviewYear();
  const athlete = await createAthlete(request, { firstName: 'Camille' });
  for (let i = 0; i < 10; i++) {
    await importRecentRun(request, athlete, 'RUNNING', firstDaysAgo + i, 30);
  }
  await fakeToday(page, `${year}-12-20T10:00:00`);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard');
  const announcement = page.getByRole('dialog', {
    name: `Your ${year} in review is here`,
  });
  await announcement.getByRole('button', { name: 'See my year' }).click();

  const story = page.getByRole('dialog', { name: `${year} in review` });
  await expect(story).toBeVisible();
  await expect(story.getByText('Camille').first()).toBeVisible();
  await story.getByRole('button', { name: 'Next' }).click();
  await page.keyboard.press('Escape');
  await expect(story).toBeHidden();

  // Seen on the account: the announcement stays away, the sidebar keeps it
  await page.reload();
  const entry = page.locator('[data-year-review-entry="sidebar"]');
  await expect(entry).toBeVisible();
  // The announcement would come up 1.2 s after the dashboard
  await page.waitForTimeout(2000);
  await expect(announcement).toBeHidden();
  await entry.click();
  await expect(story).toBeVisible();

  expect(problems).toEqual([]);
});

test('hides the year review outside its season', async ({ page, request }) => {
  const athlete = await createAthlete(request);
  for (let i = 0; i < 10; i++) {
    await importRecentRun(request, athlete, 'RUNNING', i + 1, 30);
  }
  await fakeToday(page, `${new Date().getUTCFullYear()}-06-15T10:00:00`);
  await signIn(page, athlete);

  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  await expect(page.locator('[data-year-review-entry]')).toHaveCount(0);
});
