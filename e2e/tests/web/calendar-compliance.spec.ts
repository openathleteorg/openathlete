import { expect, test } from '@playwright/test';

import { importRecentRun } from '../../support/activities';
import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const DAY = 24 * 3600 * 1000;

test('an activity dragged onto its planned session colours it as done', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  // Planned two days ago, run a day late: the automatic matching only looks
  // at the same day, so linking is up to the athlete
  const planned = new Date(Date.now() - 2 * DAY);
  planned.setUTCHours(12, 0, 0, 0);
  const session = await request.post(`${API_URL}/event`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    data: {
      type: 'TRAINING',
      name: 'Tempo run',
      sport: 'RUNNING',
      description: '',
      goalDuration: 30 * 60,
      goalRpe: 0.6,
      startDate: planned.toISOString(),
      endDate: new Date(planned.getTime() + 3600_000).toISOString(),
    },
  });
  expect(session.status(), await session.text()).toBe(201);
  await importRecentRun(request, athlete, 'RUNNING', 1, 30);

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar');
  // Early in the month, the session can belong to the previous one
  const browserMonth = (date: Date) =>
    date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
    });
  if (browserMonth(planned) !== browserMonth(new Date())) {
    await page.getByRole('button', { name: 'Previous month' }).click();
  }

  const sessionCard = page
    .locator('.calendar-event')
    .filter({ hasText: 'Tempo run' });
  const activityCard = page
    .locator('.calendar-event')
    .filter({ hasText: 'RUNNING session' });
  // Its day is over and no activity is linked yet
  await expect(sessionCard).toHaveAttribute('data-compliance', 'missed');
  await expect(activityCard).toBeVisible();

  // Raw mouse moves, in steps, as dnd-kit expects a real drag
  await page.waitForLoadState('networkidle');
  const from = (await activityCard.boundingBox())!;
  const to = (await sessionCard.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page.mouse.up();

  await expect(page.getByText('Activity linked to “Tempo run”')).toBeVisible();
  // 30 minutes done for 30 planned: done as planned, the session inside
  await expect(activityCard).toHaveAttribute('data-compliance', 'complete');
  await expect(activityCard).toContainText('Tempo run');

  // The link survives a reload
  await page.reload();
  if (browserMonth(planned) !== browserMonth(new Date())) {
    await page.getByRole('button', { name: 'Previous month' }).click();
  }
  await expect(activityCard).toHaveAttribute('data-compliance', 'complete');
  expect(problems).toEqual([]);
});

test('the weekly summary puts done and planned side by side', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  // A session in five days, as the browser sees it, after its own week's start
  const planned = new Date(Date.now() + 5 * DAY);
  planned.setUTCHours(16, 0, 0, 0);
  const session = await request.post(`${API_URL}/event`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    data: {
      type: 'TRAINING',
      name: 'Long run',
      sport: 'RUNNING',
      description: '',
      goalDuration: 90 * 60,
      goalDistance: 18_000,
      goalRpe: 0.5,
      startDate: planned.toISOString(),
      endDate: new Date(planned.getTime() + 5400_000).toISOString(),
    },
  });
  expect(session.status(), await session.text()).toBe(201);

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar?view=week');
  await page.getByRole('button', { name: 'Next week' }).click();
  // The week view may already hold it: go back until it shows
  const card = page.locator('.calendar-event').filter({ hasText: 'Long run' });
  await page.waitForLoadState('networkidle');
  if (!(await card.isVisible())) {
    await page.getByRole('button', { name: 'Previous week' }).click();
  }
  await expect(card).toBeVisible();

  const summary = page.locator('[data-week-summary]');
  await expect(summary).toContainText('1h30');
  await expect(summary).toContainText('18');
  // Without any AI key, the planned session still has a load to show
  await expect(summary.locator('[data-week-load]')).toContainText('/');
  await expect(summary.locator('[data-week-form]')).toContainText('projected');
  expect(problems).toEqual([]);
});

test('an A race shows its letter and counts down the weeks before it', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  // Three weeks ahead, mid-week, mid-day in the browser's time zone
  const raceDay = new Date(Date.now() + 21 * DAY);
  raceDay.setUTCHours(16, 0, 0, 0);
  const race = await request.post(`${API_URL}/event`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    data: {
      type: 'COMPETITION',
      name: 'Goal half marathon',
      sport: 'RUNNING',
      description: '',
      priority: 'A',
      startDate: raceDay.toISOString(),
      endDate: new Date(raceDay.getTime() + 5400_000).toISOString(),
    },
  });
  expect(race.status(), await race.text()).toBe(201);
  expect(await race.json()).toMatchObject({ priority: 'A' });

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar?view=month');

  // The upcoming races of the header carry the letter
  const upcoming = page.getByText('Goal half marathon').first();
  await expect(upcoming).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Priority A race' }).first(),
  ).toBeVisible();
  // This week's summary counts the weeks left: two or three, by weekday
  await expect(
    page.locator('[data-week-summary]').filter({ hasText: /A: [23] wk/ }),
  ).not.toHaveCount(0);
  expect(problems).toEqual([]);
});
