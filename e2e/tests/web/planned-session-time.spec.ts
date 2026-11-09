import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';

test.use({ storageState: { cookies: [], origins: [] } });

// A start time set through MCP used to be hidden in the web app, and reset
// to 12:00 when the session was moved to another day (#119)
test('a planned session keeps its start time when moved to another day', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  await signIn(page, athlete);

  // 07:00 next Monday in the browser's time zone (America/New_York)
  const { start, end, monday } = await page.evaluate(() => {
    const day = new Date();
    day.setDate(day.getDate() + ((8 - day.getDay()) % 7 || 7));
    day.setHours(7, 0, 0, 0);
    return {
      start: day.toISOString(),
      end: new Date(day.getTime() + 3600_000).toISOString(),
      monday: day.getDate(),
    };
  });
  const created = await request.post(`${API_URL}/event`, {
    headers,
    data: {
      type: 'TRAINING',
      name: 'Dawn run',
      sport: 'RUNNING',
      description: '',
      goalDuration: 3600,
      startDate: start,
      endDate: end,
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { eventId } = (await created.json()) as { eventId: number };

  await page.goto('/dashboard/calendar?view=week');
  await page.getByRole('button', { name: 'Next week' }).click();
  await page.getByText('Dawn run').first().click();
  const details = page.getByRole('dialog');
  await expect(details.locator('[data-session-start]')).toContainText('07:00');

  await details.getByRole('button', { name: 'Edit', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Edit the training' });
  await form.getByRole('button', { name: /07:00/ }).click();
  // Tuesday, the day after
  const tuesday = await page.evaluate(
    (iso) => new Date(new Date(iso).getTime() + 86_400_000).getDate(),
    start,
  );
  await page
    .locator('button[name="day"]:not(.day-outside)')
    .getByText(String(tuesday), { exact: true })
    .click();
  await page.keyboard.press('Escape');
  await expect(form.getByRole('button', { name: /07:00/ })).toBeVisible();
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form).toBeHidden();

  const saved = await request.get(`${API_URL}/event/${eventId}`, { headers });
  const { startDate } = (await saved.json()) as { startDate: string };
  const local = await page.evaluate((iso) => {
    const date = new Date(iso);
    return {
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }, startDate);
  expect(local).toEqual({ day: tuesday, hour: 7, minute: 0 });
  expect(monday).not.toBe(tuesday);
});
