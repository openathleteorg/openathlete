import { type Page, expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

/** Monday of the week `weeks` after this one, in the browser's time zone */
function monday(weeks: number) {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
  const date = new Date(now);
  date.setDate(now.getDate() - ((now.getDay() + 6) % 7) + 7 * weeks);
  date.setHours(0, 0, 0, 0);
  return date;
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Drags the pointer from the cycle cell of one week row to another's */
async function dragCycles(page: Page, from: string, to: string, edge?: 'end') {
  const source = edge
    ? page
        .locator(`[data-season-week="${from}"] [data-season-cycle-end]`)
        .first()
    : page.locator(`[data-season-week="${from}"] [data-season-cycles]`);
  const target = page.locator(
    `[data-season-week="${to}"] [data-season-cycles]`,
  );
  // The pointer does not scroll: both rows must be on screen
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  const a = (await source.boundingBox())!;
  const b = (await target.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
  await page.mouse.up();
}

test('the season shows races and volume by week, and cycles are drawn and resized on it', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const raceDay = new Date(monday(3));
  raceDay.setDate(raceDay.getDate() + 6);
  raceDay.setHours(9, 0, 0, 0);
  const race = await request.post(`${API_URL}/event`, {
    headers,
    data: {
      type: 'COMPETITION',
      name: 'City half marathon',
      sport: 'RUNNING',
      description: '',
      goalDuration: 5400,
      priority: 'A',
      startDate: raceDay.toISOString(),
      endDate: new Date(raceDay.getTime() + 5400_000).toISOString(),
    },
  });
  expect(race.status(), await race.text()).toBe(201);

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar?view=season');
  const season = page.locator('[data-calendar-season]');
  const raceWeek = season.locator(`[data-season-week="${dayKey(monday(3))}"]`);
  await expect(raceWeek).toContainText('City half marathon');
  await expect(raceWeek).toContainText('0min / 1h30');

  // Drag down the cycle column over three weeks: a cycle over them
  await dragCycles(page, dayKey(monday(1)), dayKey(monday(3)));
  const form = page.getByRole('dialog');
  await form.getByLabel('Cycle Name').fill('Specific block');
  await form.getByRole('button', { name: 'Create' }).click();
  await expect(
    season.locator(`[data-season-week="${dayKey(monday(1))}"]`),
  ).toContainText('Specific block');
  await expect(
    season.locator(
      `[data-season-week="${dayKey(monday(3))}"] [data-season-cycle]`,
    ),
  ).toHaveCount(1);

  // One more week by dragging its bottom edge
  await dragCycles(page, dayKey(monday(3)), dayKey(monday(4)), 'end');
  await expect(
    season.locator(
      `[data-season-week="${dayKey(monday(4))}"] [data-season-cycle]`,
    ),
  ).toHaveCount(1);
  await expect
    .poll(async () => {
      const cycles = await (
        await request.get(`${API_URL}/cycle`, { headers })
      ).json();
      const block = cycles.find(
        (cycle: { name: string }) => cycle.name === 'Specific block',
      );
      return block && new Date(block.endDate) > monday(4);
    })
    .toBe(true);

  // A week label opens that week
  await raceWeek.getByRole('button', { name: /^W\d+/ }).click();
  await expect(page.locator('[data-calendar-week]')).toBeVisible();
  await expect(page.locator('[data-calendar-week]')).toContainText(
    'City half marathon',
  );
  expect(problems).toEqual([]);
});
