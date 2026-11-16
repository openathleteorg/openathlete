import { type APIRequestContext, expect, test } from '@playwright/test';

import {
  type TestUser,
  apiHeaders,
  createAthlete,
  linkCoach,
} from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

/** What each of the user's conversations says, last message only */
async function inbox(request: APIRequestContext, user: TestUser) {
  const response = await request.get(`${API_URL}/messages/threads`, {
    headers: apiHeaders(undefined, user.accessToken),
  });
  expect(response.status(), await response.text()).toBe(200);
  const threads = (await response.json()) as {
    participants: unknown[];
    messages: { content: string }[];
  }[];
  return threads.map((thread) => ({
    people: thread.participants.length,
    last: thread.messages.at(-1)?.content ?? null,
  }));
}

test('a coach writes to two athletes at once, then schedules and cancels a message', async ({
  page,
  request,
}) => {
  const coach = await createAthlete(request, {
    roles: ['ATHLETE', 'COACH'],
    firstName: 'Olga',
  });
  const [ana, ben] = [
    await createAthlete(request, { firstName: 'Ana' }),
    await createAthlete(request, { firstName: 'Ben' }),
  ];
  await linkCoach(request, coach, ana);
  await linkCoach(request, coach, ben);

  await signIn(page, coach);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/messages');

  await page.locator('[data-broadcast-button]').first().click();
  const dialog = page.locator('[data-broadcast-dialog]');
  await dialog.getByText('Ana Athlete').click();
  await dialog.getByText('Ben Athlete').click();
  await dialog.getByLabel('Message').fill('Sunday: long run at 9');
  await dialog.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Sent to 2 athlete(s)')).toBeVisible();

  // Each in a private conversation with the coach
  for (const athlete of [ana, ben]) {
    await expect
      .poll(() => inbox(request, athlete))
      .toEqual([{ people: 2, last: 'Sunday: long run at 9' }]);
  }

  // Later: it waits, and can be canceled
  await page.locator('[data-broadcast-button]').first().click();
  await dialog.getByText('Ana Athlete').click();
  await dialog.getByLabel('Message').fill('Good luck tomorrow!');
  await dialog.getByText('Send later').click();
  await dialog.getByRole('button', { name: 'Schedule' }).click();
  await expect(page.getByText(/It will be sent on/)).toBeVisible();
  expect(await inbox(request, ana)).toEqual([
    { people: 2, last: 'Sunday: long run at 9' },
  ]);

  await page.locator('[data-scheduled-messages-button]').first().click();
  const scheduled = page.locator('[data-scheduled-message]');
  await expect(scheduled).toContainText('Good luck tomorrow!');
  await scheduled.getByRole('button', { name: 'Cancel it' }).click();
  await expect(page.getByText('Message canceled')).toBeVisible();
  await expect(scheduled).toHaveCount(0);
  expect(problems).toEqual([]);
});
