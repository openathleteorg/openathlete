import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';

test.use({ storageState: { cookies: [], origins: [] } });

// The page starts a first conversation for a user who has none; an empty
// "Unread" view must not count as none
test('the unread filter creates no conversation', async ({ page, request }) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const threads = async () => {
    const response = await request.get(`${API_URL}/messages/threads`, {
      headers: apiHeaders(undefined, athlete.accessToken),
    });
    return ((await response.json()) as unknown[]).length;
  };

  await page.goto('/dashboard/messages');
  await expect(page.getByText('1 conversation')).toBeVisible();

  await page.getByRole('button', { name: 'Unread' }).click();
  await expect(page.getByText('No unread conversations')).toBeVisible();
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'All' }).click();
  await expect(page.getByText('1 conversation')).toBeVisible();
  expect(await threads()).toBe(1);
});

// A user alone on the instance writes in the conversation the page started
// for them, with nobody else in it: they must be able to delete it (#134)
test('the last conversation can be deleted', async ({ page, request }) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  await signIn(page, athlete);
  const threads = async () => {
    const response = await request.get(`${API_URL}/messages/threads`, {
      headers,
    });
    return (await response.json()) as { messageThreadId: number }[];
  };

  await page.goto('/dashboard/messages');
  await expect(page.getByText('1 conversation')).toBeVisible();
  const [first] = await threads();
  const sent = await request.post(`${API_URL}/messages/messages`, {
    headers,
    data: { messageThreadId: first.messageThreadId, content: 'Into the void' },
  });
  expect(sent.ok()).toBe(true);

  await page.reload();
  await expect(page.getByText('Into the void')).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  // The page starts a new, empty conversation in its place
  await expect(page.getByText('Into the void')).toHaveCount(0);
  await expect(page.getByText('1 conversation')).toBeVisible();
  await expect
    .poll(async () => (await threads()).map((t) => t.messageThreadId))
    .not.toContain(first.messageThreadId);
});
