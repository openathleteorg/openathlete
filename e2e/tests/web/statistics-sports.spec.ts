import { type Page, expect, test } from '@playwright/test';

import {
  apiHeaders,
  createAthlete,
  createCoachWithAthlete,
} from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL, WEB_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';
import {
  type Session,
  importSession,
  setHeartRateProfile,
  waitForIntensity,
} from '../../support/training';

test.use({ storageState: { cookies: [], origins: [] } });

/** Easy 65 minutes at a steady heart rate, drifting a little */
const steadyHeartrate = (minute: number) => 125 + minute * 0.08;
/** A hard outing: up to the top zones */
const hardHeartrate = (minute: number) => (minute % 8 < 4 ? 180 : 130);

const weeks = (count: number, session: (week: number) => Session[]) =>
  Array.from({ length: count }, (_, week) => session(week)).flat();

const run = (week: number): Session[] => [
  {
    sport: 'RUNNING',
    daysAgo: week * 7 + 1,
    minutes: 65,
    speed: 3 + week * 0.02,
    heartrate: steadyHeartrate,
    climb: 1.5,
  },
  {
    sport: 'RUNNING',
    daysAgo: week * 7 + 3,
    minutes: 16 + week * 3,
    speed: 4,
    heartrate: hardHeartrate,
  },
];

const ride = (week: number): Session[] => [
  {
    sport: 'CYCLING',
    daysAgo: week * 7 + 2,
    minutes: 90,
    speed: 8,
    heartrate: steadyHeartrate,
    watts: () => 190,
  },
  {
    sport: 'CYCLING',
    daysAgo: week * 7 + 4,
    minutes: 25,
    speed: 10,
    heartrate: hardHeartrate,
    watts: (minute) => (minute < 5 ? 340 : minute < 12 ? 300 : 270),
  },
];

const swim = (week: number): Session[] => [
  {
    sport: 'SWIMMING',
    daysAgo: week * 7 + 5,
    minutes: 40,
    speed: 1.1,
    heartrate: () => 135,
  },
];

const ski = (week: number): Session[] => [
  {
    sport: 'NORDIC_SKI',
    daysAgo: week * 7 + 2,
    minutes: 80,
    speed: 4,
    heartrate: steadyHeartrate,
    climb: 8,
  },
  {
    sport: 'BACKCOUNTRY_SKI',
    daysAgo: week * 7 + 6,
    minutes: 120,
    speed: 1.2,
    heartrate: () => 135,
    climb: 10,
  },
];

const PROFILES: {
  name: string;
  sessions: Session[];
  sport: string;
  label: string;
  /** Cards of the trends section, in `data-trend` */
  trends: string[];
  noTrends: string[];
  critical?: 'speed' | 'power';
  steady: boolean;
}[] = [
  {
    name: 'runner',
    sessions: weeks(6, run),
    sport: 'RUNNING',
    label: 'Running',
    trends: ['speed', 'gap', 'heartrate', 'verticalSpeed', 'distance'],
    noTrends: ['weightedPower'],
    critical: 'speed',
    steady: true,
  },
  {
    name: 'cyclist',
    sessions: weeks(6, ride),
    sport: 'CYCLING',
    label: 'Cycling',
    trends: ['speed', 'heartrate', 'power'],
    noTrends: ['gap'],
    critical: 'power',
    steady: true,
  },
  {
    name: 'swimmer',
    sessions: weeks(6, swim),
    sport: 'SWIMMING',
    label: 'Swimming',
    trends: ['speed', 'heartrate', 'distance'],
    noTrends: ['gap', 'power', 'verticalSpeed'],
    steady: false,
  },
  {
    name: 'triathlete',
    sessions: [...weeks(4, run), ...weeks(4, ride), ...weeks(4, swim)],
    sport: 'CYCLING',
    label: 'Cycling',
    trends: ['speed', 'power'],
    noTrends: ['gap'],
    critical: 'power',
    steady: true,
  },
  {
    name: 'skier',
    sessions: weeks(4, ski),
    sport: 'NORDIC_SKI',
    label: 'Nordic Ski',
    trends: ['heartrate'],
    noTrends: ['gap'],
    steady: false,
  },
];

async function prepare(
  page: Page,
  request: Parameters<typeof importSession>[0],
  sessions: Session[],
) {
  const athlete = await createAthlete(request);
  const me = await request.get(`${API_URL}/athlete/me`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });
  const { athleteId } = (await me.json()) as { athleteId: number };
  await setHeartRateProfile(request, athlete);
  for (const session of sessions)
    await importSession(request, athlete, session);
  await waitForIntensity(
    request,
    athlete,
    athleteId,
    sessions.reduce((sum, { minutes }) => sum + minutes, 0),
  );
  await signIn(page, athlete);
}

/** Scrolls to the sections of a view, which load as they near the screen */
async function open(page: Page, query: string) {
  await page.goto(`/dashboard/statistics?${query}`);
  const sections = page.locator('section[aria-labelledby]');
  await sections.first().waitFor();
  for (const section of await sections.all()) {
    await section.scrollIntoViewIfNeeded();
  }
  await page.waitForLoadState('networkidle');
}

for (const profile of PROFILES) {
  test(`statistics read well for a ${profile.name}`, async ({
    page,
    request,
  }, info) => {
    test.setTimeout(90_000);
    const problems = trackPageProblems(page);
    await prepare(page, request, profile.sessions);

    const scope = `sport=${profile.sport}&compare=previous`;
    await open(page, scope);
    await expect(page.locator('[data-stat-tile]').first()).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Sport' })).toContainText(
      profile.label,
    );

    await open(page, `${scope}&view=load`);
    await expect(page.locator('[data-intensity]')).toBeVisible();
    await expect(page.locator('[data-default-zones]')).toBeVisible();
    await expect(page.locator('[data-tsb-chart]')).toBeVisible();
    await expect(page.getByText('Load comes from heart rate')).toHaveCount(0);
    await expect(page.locator('[data-steady="efficiency"]')).toHaveCount(
      profile.steady ? 1 : 0,
    );

    await open(page, `${scope}&view=trends`);
    for (const trend of profile.trends) {
      await expect(page.locator(`[data-trend="${trend}"]`)).toBeVisible();
    }
    for (const trend of profile.noTrends) {
      await expect(page.locator(`[data-trend="${trend}"]`)).toHaveCount(0);
    }

    await open(page, `${scope}&view=capacities&capacity=performance`);
    if (profile.critical) {
      await expect(
        page.locator(`[data-critical="${profile.critical}"]`),
      ).toBeVisible();
    } else {
      await expect(page.locator('[data-critical]')).toHaveCount(0);
    }

    await open(page, `${scope}&view=capacities`);
    await expect(page.locator('[data-capacity-profile]')).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows).toBe(false);
    if (process.env.STATS_SHOTS) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `${process.env.STATS_SHOTS}/${info.project.name}-${profile.name}.png`,
        fullPage: true,
      });
    }
    expect(problems).toEqual([]);
  });
}

test('a swimmer works out their critical swim speed from a test', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  await prepare(page, request, weeks(2, swim));
  await open(page, 'sport=SWIMMING&view=capacities&capacity=performance');
  const card = page.locator('[data-critical-swim]');
  await card.getByLabel('200 m').fill('3:00');
  await card.getByLabel('400 m').fill('6:20');
  await expect(card).toContainText('1:40');
});

test('sports read together as a group, and sections collapse', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  await prepare(page, request, [
    ...run(0),
    { ...run(1)[0], sport: 'TRAIL_RUNNING' },
  ]);
  await page.goto('/dashboard/statistics');
  await page.getByRole('combobox', { name: 'Sport' }).click();
  await page.getByRole('option', { name: 'Running and trail' }).click();
  await expect(page).toHaveURL(/group=RUNNING/);
  await expect(page.locator('[data-stat-tile]').nth(3)).toContainText('3');

  const trends = page.getByRole('button', { name: 'Collapse Volume' });
  await trends.click();
  await expect(page.locator('[data-volume]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Expand Volume' }).click();
  await expect(page.locator('[data-volume]')).toBeVisible();
});

test('the page compares two periods section by section', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  await prepare(page, request, weeks(14, run));
  const scope = 'sport=RUNNING&period=weeks12&compare=previous';
  await open(page, scope);
  await expect(page.locator('[data-volume]')).toContainText('Compared period');
  await open(page, `${scope}&view=load`);
  await expect(page.locator('[data-intensity-compared]')).toBeVisible();
});

test('a runner reads their capacities, from terrain to coherence', async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  // Altitude rolls, so the outing meets several slopes
  const hilly = (daysAgo: number): Session => ({
    sport: 'TRAIL_RUNNING',
    daysAgo,
    minutes: 70,
    speed: 2.5,
    heartrate: steadyHeartrate,
    climb: (minute) => [8, 12, 16, 24, -8, -14][minute % 6],
  });
  await prepare(page, request, [
    ...weeks(4, run),
    hilly(6),
    hilly(13),
    hilly(20),
    hilly(27),
  ]);
  const problems = trackPageProblems(page);

  const trail = 'sport=TRAIL_RUNNING&view=capacities';
  await open(page, `${trail}&capacity=terrain`);
  await expect(page.locator('[data-terrain="climb"]')).toBeVisible();
  await expect(page.locator('[data-quick-read]')).toContainText('Limit');

  await open(page, `${trail}&capacity=endurance`);
  await expect(page.locator('[data-durability]')).toBeVisible();

  await open(page, 'sport=RUNNING&view=capacities&capacity=physiology');
  await expect(page.locator('[data-cardiac-cost="speed"]')).toBeVisible();

  await open(page, 'sport=RUNNING&view=capacities&capacity=performance');
  await expect(page.locator('[data-coherence]')).toBeVisible();

  await open(page, 'sport=RUNNING&view=capacities');
  await expect(page.locator('[data-capacity-profile]')).toContainText(
    'capacities can be read',
  );
  expect(problems).toEqual([]);
});

test('a year in review sums the year up, and shares only on demand', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  await prepare(page, request, weeks(3, run));
  const problems = trackPageProblems(page);
  await open(page, 'view=review');
  const review = page.locator('[data-year-review]');
  await expect(review).toContainText('Longest streak');
  // Headless Chromium has no share sheet: the image is saved instead
  const download = page.waitForEvent('download');
  await page.locator('[data-year-share]').click();
  expect((await download).suggestedFilename()).toBe('openathlete-year.png');
  expect(problems).toEqual([]);
});

test('figures export as CSV, and predictions come as ranges', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  await prepare(page, request, weeks(4, run));
  await open(page, 'sport=RUNNING&view=trends');
  const download = page.waitForEvent('download');
  await page.locator('[data-export="trends"]').click();
  expect((await download).suggestedFilename()).toBe('openathlete-trends.csv');

  await open(page, 'sport=RUNNING&view=load');
  await expect(page.locator('[data-recovery-series="resting"]')).toBeVisible();
});

test('a view opens on the main sport, without a dead end', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  await prepare(page, request, [...run(0), ...swim(0)]);
  await page.goto('/dashboard/statistics');
  await page.getByRole('tab', { name: 'Trends' }).click();
  await expect(page).toHaveURL(/view=trends/);
  await expect(page.getByRole('tab', { name: 'Running' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('tab', { name: 'Swimming' }).click();
  await expect(page).toHaveURL(/sport=SWIMMING/);
});

test('a coach reads the statistics of their athlete', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  const { coach, athlete, athleteId } = await createCoachWithAthlete(request);
  await setHeartRateProfile(request, athlete);
  for (const session of run(0)) await importSession(request, athlete, session);
  await waitForIntensity(request, athlete, athleteId);
  await signIn(page, coach);
  const problems = trackPageProblems(page);

  await page.goto(`/dashboard/statistics/${athleteId}?sport=RUNNING&view=load`);
  await expect(page.locator('[data-intensity]')).toBeVisible();
  expect(problems).toEqual([]);
});

for (const [locale, section] of [
  ['fr', 'Régularité'],
  ['it', 'Regolarità'],
  ['es', 'Regularidad'],
  ['pt-BR', 'Regularidade'],
]) {
  test(`every statistics text exists in ${locale}`, async ({
    page,
    request,
    context,
  }) => {
    test.setTimeout(60_000);
    await prepare(page, request, weeks(2, run));
    await context.addCookies([
      { name: 'OA_LOCALE', value: locale, url: WEB_URL },
    ]);
    await open(page, 'sport=RUNNING');
    await expect(
      page.getByRole('heading', { name: section, exact: true }),
    ).toBeVisible();
    // Paraglide falls back on the key's name when a message is missing
    for (const query of [
      'view=load',
      'view=trends',
      'view=capacities',
      'view=capacities&capacity=terrain',
      'view=capacities&capacity=endurance',
      'view=capacities&capacity=physiology',
      'view=capacities&capacity=performance',
      'view=review',
    ]) {
      await open(page, `sport=RUNNING&${query}`);
      await expect(page.locator('body')).not.toContainText(
        /statistics_|metric_/,
      );
    }
  });
}
