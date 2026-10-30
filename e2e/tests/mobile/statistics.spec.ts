import { type Page, expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import {
  importSession,
  setHeartRateProfile,
  waitForIntensity,
} from '../../support/training';

test.use({ storageState: { cookies: [], origins: [] } });

const VIEWS = [
  '',
  'view=load',
  'view=trends',
  'view=capacities',
  'view=capacities&capacity=terrain',
  'view=capacities&capacity=endurance',
  'view=capacities&capacity=physiology',
  'view=capacities&capacity=performance',
  'view=review',
];
const WIDTHS = [320, 360, 390, 768, 1024];

async function open(page: Page, query: string) {
  await page.goto(`/dashboard/statistics?sport=RUNNING&${query}`);
  const sections = page.locator('section[aria-labelledby]');
  await sections.first().waitFor();
  for (const section of await sections.all()) {
    await section.scrollIntoViewIfNeeded();
  }
  await page.waitForLoadState('networkidle');
}

async function prepare(
  page: Page,
  request: Parameters<typeof importSession>[0],
) {
  const athlete = await createAthlete(request);
  const me = await request.get(`${API_URL}/athlete/me`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });
  const { athleteId } = (await me.json()) as { athleteId: number };
  await setHeartRateProfile(request, athlete);
  for (const daysAgo of [1, 4, 8, 11, 15, 18]) {
    await importSession(request, athlete, {
      sport: 'RUNNING',
      daysAgo,
      minutes: 70,
      speed: 3,
      heartrate: (minute) => 125 + minute * 0.1,
      climb: 5,
    });
  }
  await waitForIntensity(request, athlete, athleteId, 6 * 70);
  await signIn(page, athlete);
}

test('every statistics view fits every width', async ({ page, request }) => {
  test.setTimeout(180_000);
  await prepare(page, request);

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    for (const query of VIEWS) {
      await open(page, query);
      const overflow = await page.evaluate(() => {
        const limit = window.innerWidth;
        // What scrolls on purpose, sideways, may be wider than the screen
        const inScroller = (element: Element) =>
          !!element.closest('.overflow-x-auto');
        const beyond = [...document.querySelectorAll('main *')].filter(
          (element) =>
            !inScroller(element) &&
            !element.closest('svg') &&
            element.getBoundingClientRect().right > limit + 1,
        );
        return {
          page: document.documentElement.scrollWidth > limit,
          beyond: beyond.slice(0, 3).map((element) => element.className),
        };
      });
      expect(overflow, `${width}px ${query}`).toEqual({
        page: false,
        beyond: [],
      });
    }
  }
});

test('touch targets are large enough on a phone', async ({ page, request }) => {
  test.setTimeout(90_000);
  await prepare(page, request);
  await page.setViewportSize({ width: 390, height: 844 });

  for (const query of VIEWS) {
    await open(page, query);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('main button, main a, main [role="tab"]')]
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            name: element.getAttribute('aria-label') ?? element.textContent,
            height: box.height,
            visible: box.width > 0,
          };
        })
        .filter(({ height, visible }) => visible && height < 36),
    );
    expect(small, query).toEqual([]);
  }
});

test('the views stay within reach while scrolling a phone', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  await prepare(page, request);
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '');
  const tabs = page.getByRole('tablist', { name: 'Sections' });
  await page.locator('[data-activity-calendar]').scrollIntoViewIfNeeded();
  await expect(tabs.getByRole('tab', { name: 'Load' })).toBeInViewport();
});

test('filters open in a sheet on a phone, and figures by touch', async ({
  page,
  request,
}, info) => {
  test.setTimeout(60_000);
  await prepare(page, request);
  await page.setViewportSize({ width: 390, height: 844 });

  await open(page, 'view=trends');
  await page.locator('[data-statistics-filters]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  const about = page.getByRole('button', { name: 'About GAP' });
  await about.scrollIntoViewIfNeeded();
  const box = await about.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await about.tap();
  await expect(page.getByText('Measured on a treadmill')).toBeVisible();

  if (process.env.STATS_SHOTS) {
    await page.keyboard.press('Escape');
    for (const [name, query] of [
      ['overview', ''],
      ['load', 'view=load'],
      ['profile', 'view=capacities'],
      ['terrain', 'view=capacities&capacity=terrain'],
      ['perf', 'view=capacities&capacity=performance'],
    ]) {
      await open(page, query);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `${process.env.STATS_SHOTS}/${info.project.name}-${name}.png`,
      });
    }
  }
});
