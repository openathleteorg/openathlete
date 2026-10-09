import { expect, test } from '@playwright/test';

import { apiHeaders, createCoachWithAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

test('the coach sees an unread comment on a session, reads it and replies', async ({
  page,
  request,
}) => {
  const { coach, athlete, athleteId } = await createCoachWithAthlete(request);
  const athleteHeaders = apiHeaders(undefined, athlete.accessToken);
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const planned = await request.post(`${API_URL}/event`, {
    headers: athleteHeaders,
    data: {
      type: 'TRAINING',
      name: 'Long run',
      sport: 'RUNNING',
      description: '',
      goalDuration: 5400,
      startDate: start.toISOString(),
      endDate: new Date(start.getTime() + 5400_000).toISOString(),
    },
  });
  expect(planned.status(), await planned.text()).toBe(201);
  const { eventId } = await planned.json();
  const comment = await request.post(
    `${API_URL}/messages/events/${eventId}/comments`,
    { headers: athleteHeaders, data: { content: 'Can I run it on trails?' } },
  );
  expect(comment.status(), await comment.text()).toBe(201);

  await signIn(page, coach);
  await page.addInitScript(() => {
    localStorage.setItem('current_space', 'COACH');
  });
  const problems = trackPageProblems(page);
  await page.goto(`/dashboard/calendar/${athleteId}`);
  const card = page.locator('.calendar-event', { hasText: 'Long run' });
  await expect(card.locator('[data-comment-count="1"]')).toHaveAttribute(
    'data-comment-unread',
    '1',
  );

  await card.click();
  const comments = page.locator('[data-event-comments]');
  await expect(comments).toContainText('Can I run it on trails?');
  await comments
    .getByRole('textbox', { name: 'Write a comment' })
    .fill('Yes, keep it easy');
  await comments.getByRole('button', { name: 'Send' }).click();
  await expect(comments).toContainText('Yes, keep it easy');
  await expect(comments.getByRole('textbox')).toHaveValue('');

  // Read by the coach; unread for the athlete now
  await page.keyboard.press('Escape');
  await expect(card.locator('[data-comment-count="2"]')).toBeVisible();
  await expect(card.locator('[data-comment-unread]')).toHaveCount(0);
  const forAthlete = await (
    await request.get(`${API_URL}/messages/events/${eventId}/comments`, {
      headers: athleteHeaders,
    })
  ).json();
  expect(forAthlete.unread).toBe(1);
  expect(problems).toEqual([]);
});
