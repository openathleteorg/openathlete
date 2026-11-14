import { expect, test } from '@playwright/test';

import { createAthlete, linkCoach } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

test('a coach with many athletes finds one, then moves between their pages', async ({
  page,
  request,
}) => {
  const coach = await createAthlete(request, {
    roles: ['ATHLETE', 'COACH'],
    firstName: 'Olga',
  });
  const names = ['Ana', 'Ben', 'Cleo', 'Dan', 'Eva', 'Finn', 'Gus', 'Hugo'];
  for (const firstName of names) {
    await linkCoach(
      request,
      coach,
      await createAthlete(request, { firstName }),
    );
  }

  await signIn(page, coach);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/coach');
  const nav = page.locator('[data-coach-athlete-nav]');

  // One line per athlete, no tree of pages
  await expect(nav.getByRole('link')).toHaveCount(names.length);
  await nav.getByRole('searchbox').fill('cle');
  await expect(nav.getByRole('link')).toHaveCount(1);
  await nav.getByRole('link', { name: 'Cleo Athlete' }).click();
  await expect(page).toHaveURL(/\/dashboard\/calendar\/\d+$/);
  const athleteId = page.url().split('/').pop();

  // Their pages are tabs above the calendar
  const tabs = page.locator('[data-athlete-tabs]');
  await expect(tabs).toContainText('Cleo Athlete');
  await tabs.getByRole('link', { name: 'Metrics' }).click();
  await expect(page).toHaveURL(`/dashboard/metrics/${athleteId}`);
  await expect(tabs.getByRole('link', { name: 'Metrics' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  // The unfinished Summary page opens the calendar
  await page.goto(`/dashboard/summary/${athleteId}`);
  await expect(page).toHaveURL(`/dashboard/calendar/${athleteId}`);
  expect(problems).toEqual([]);
});
