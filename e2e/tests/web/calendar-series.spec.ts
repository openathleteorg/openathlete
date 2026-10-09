import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

/** Monday of the week after this one, in the browser's time zone */
function nextMonday() {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

test('a repeated session is created, then edited and deleted from an occurrence on', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  // Plan a training next Monday, repeated every week
  await page.goto('/dashboard/calendar?view=week');
  await page.getByRole('button', { name: 'Next week' }).click();
  const monday = nextMonday();
  const day = page.locator(`[data-calendar-day="${dayKey(monday)}"]`);
  await day.hover();
  await day.locator('[data-calendar-day-plan]').click();
  await page.getByRole('menuitem', { name: 'Plan a training' }).click();

  const form = page.getByRole('dialog');
  await form.getByLabel('Event Name').fill('Weekly tempo');
  await form.getByRole('combobox', { name: 'Sport' }).click();
  await page
    .getByRole('option', { name: /Running/ })
    .first()
    .click();
  await form.getByRole('combobox', { name: 'Repeat' }).click();
  await page.getByRole('option', { name: 'Every week' }).click();
  // Eight weeks by default: 8 more occurrences
  await expect(form.locator('[data-repeat-fields]')).toContainText(': 8');
  await form.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByText('Occurrences added: 8')).toBeVisible();

  const events = async () =>
    (
      (await (await request.get(`${API_URL}/event`, { headers })).json()) as {
        eventId: number;
        name: string;
        startDate: string;
      }[]
    ).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const all = await events();
  expect(all).toHaveLength(9);

  // Rename the third occurrence and the following ones
  const third = all[2];
  await page.goto('/dashboard/calendar?view=week');
  for (let week = 0; week < 3; week++) {
    await page.getByRole('button', { name: 'Next week' }).click();
  }
  await page
    .locator('.calendar-event', { hasText: 'Weekly tempo' })
    .click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await form.getByLabel('Event Name').fill('Threshold tempo');
  await form.getByRole('button', { name: 'Save', exact: true }).click();
  await page
    .locator('[data-series-scope]')
    .getByRole('button', { name: 'This session and the following ones' })
    .click();
  await expect(page.getByText('Sessions updated: 7')).toBeVisible();

  const renamed = await events();
  expect(renamed.map((event) => event.name)).toEqual([
    'Weekly tempo',
    'Weekly tempo',
    ...Array(7).fill('Threshold tempo'),
  ]);
  expect(renamed[2].eventId).toBe(third.eventId);

  // Delete the fifth and the following ones from its menu
  await page.getByRole('button', { name: 'Next week' }).click();
  await page.getByRole('button', { name: 'Next week' }).click();
  await page
    .locator('.calendar-event', { hasText: 'Threshold tempo' })
    .click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page
    .locator('[data-series-scope]')
    .getByRole('button', { name: 'This session and the following ones' })
    .click();
  await expect(page.getByText('Sessions deleted: 5')).toBeVisible();
  expect(await events()).toHaveLength(4);
  expect(problems).toEqual([]);
});
