import { expect, test } from '@playwright/test';

import { type TestUser, apiHeaders, createAthlete } from '../../support/api';
import { pageAs, signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const headers = (user: TestUser) => apiHeaders(undefined, user.accessToken);

test('athletes arrive by code in the chosen group, and a list is invited by email', async ({
  browser,
  page,
  request,
}) => {
  const owner = await createAthlete(request, {
    roles: ['ATHLETE', 'COACH'],
    firstName: 'Olga',
  });
  const athlete = await createAthlete(request, { firstName: 'Ana' });
  const club = await request.post(`${API_URL}/club`, {
    headers: headers(owner),
    data: { name: 'Road Club' },
  });
  const { clubId } = (await club.json()) as { clubId: number };
  const group = await request.post(`${API_URL}/athlete-groups`, {
    headers: headers(owner),
    data: { name: 'Beginners', clubId },
  });
  expect(group.status(), await group.text()).toBe(201);

  // The owner picks where athletes land, and reads the code
  await signIn(page, owner);
  let problems = trackPageProblems(page);
  await page.goto(`/dashboard/settings?tab=clubs&club=${clubId}`);
  const links = page.locator('[data-club-join-link="athlete"]');
  await links.getByRole('combobox', { name: 'Athletes land in' }).click();
  await page.getByRole('option', { name: 'Beginners' }).click();
  await expect(page.getByText('Saved')).toBeVisible();
  const code = (await page.locator('[data-club-join-code]').innerText()).trim();
  expect(code).toMatch(/^[A-Z0-9]{8}$/);

  // A list pasted in, invited by email
  await page.locator('[data-club-import-button]').click();
  const importer = page.locator('[data-club-import]');
  await importer
    .getByLabel('Member list')
    .fill(
      'First name;Last name;Email;Group\nZoe;Martin;zoe@example.com;Juniors\nMax;Durand;max@example.com;',
    );
  await expect(importer.getByText('People found: 2')).toBeVisible();
  await importer.getByRole('button', { name: 'Invite 2 people' }).click();
  await expect(
    page.getByText('Invitations sent: 2. Left out: 0.'),
  ).toBeVisible();
  await expect(page.locator('[data-club-invitations]')).toContainText(
    'zoe@example.com',
  );
  expect(problems).toEqual([]);

  // The athlete types the code, sees the club, and joins it
  const athletePage = await pageAs(browser, athlete);
  problems = trackPageProblems(athletePage);
  await athletePage.goto('/dashboard/settings?tab=clubs');
  await athletePage.locator('[data-club-code-input]').fill(code.toLowerCase());
  await athletePage.getByRole('button', { name: 'Continue' }).click();
  await expect(
    athletePage.getByRole('heading', {
      name: 'Join Road Club on OpenAthlete',
    }),
  ).toBeVisible();
  await athletePage.getByRole('button', { name: 'Join Road Club' }).click();
  await expect(athletePage.getByText('You joined Road Club')).toBeVisible();
  expect(problems).toEqual([]);

  const groups = (await (
    await request.get(`${API_URL}/athlete-groups?clubId=${clubId}`, {
      headers: headers(owner),
    })
  ).json()) as { name: string; athleteIds: number[] }[];
  expect(groups.find((g) => g.name === 'Beginners')?.athleteIds).toHaveLength(
    1,
  );
  // The list's group was created for it
  expect(groups.map((g) => g.name).sort()).toEqual(['Beginners', 'Juniors']);
});
