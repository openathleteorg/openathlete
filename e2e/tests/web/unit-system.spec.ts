import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';

test.use({ storageState: { cookies: [], origins: [] } });

test('the profile keeps the unit system the user chose', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  await page.goto('/dashboard/settings?tab=profile');

  await page.getByRole('combobox', { name: 'Unit system' }).click();
  await page.getByRole('option', { name: 'Imperial (mi, lb)' }).click();
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith('/user') &&
      response.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  expect((await saved).ok()).toBe(true);

  const headers = apiHeaders(undefined, athlete.accessToken);
  const me = await (
    await request.get(`${API_URL}/user/me`, { headers })
  ).json();
  expect(me.unitSystem).toBe('IMPERIAL');

  // Back on the profile: the choice is what the form shows, not the session's
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Unit system' }),
  ).toContainText('Imperial');
});
