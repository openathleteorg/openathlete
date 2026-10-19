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
