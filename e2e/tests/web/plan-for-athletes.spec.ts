import { type APIRequestContext, expect, test } from '@playwright/test';

import { type TestUser, apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const headers = (user: TestUser) => apiHeaders(undefined, user.accessToken);

/** Monday of the week after this one, in the browser's time zone */
function nextMonday() {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + 7);
  monday.setHours(12, 0, 0, 0);
  return monday;
}

async function sessionsOf(request: APIRequestContext, athlete: TestUser) {
  const response = await request.get(
    `${API_URL}/event?startDate=${new Date(Date.now() - 86400_000).toISOString()}&endDate=${new Date(Date.now() + 30 * 86400_000).toISOString()}`,
    { headers: headers(athlete) },
  );
  expect(response.status(), await response.text()).toBe(200);
  return ((await response.json()) as { name: string }[]).map((e) => e.name);
}

test("a coach copies an athlete's week to a group, then undoes it", async ({
  page,
  request,
}) => {
  const coach = await createAthlete(request, {
    roles: ['ATHLETE', 'COACH'],
    firstName: 'Olga',
  });
  const [ana, ben, cleo] = [
    await createAthlete(request, { firstName: 'Ana' }),
    await createAthlete(request, { firstName: 'Ben' }),
    await createAthlete(request, { firstName: 'Cleo' }),
  ];

  // A club, its three athletes, and a group of two
  const club = await request.post(`${API_URL}/club`, {
    headers: headers(coach),
    data: { name: 'Track Club' },
  });
  const { clubId } = (await club.json()) as { clubId: number };
  const links = await request.get(`${API_URL}/club/${clubId}/join-links`, {
    headers: headers(coach),
  });
  const { athlete: link } = (await links.json()) as {
    athlete: { token: string };
  };
  for (const athlete of [ana, ben, cleo]) {
    const join = await request.post(
      `${API_URL}/club-join/${link.token}/accept`,
      { headers: headers(athlete) },
    );
    expect(join.status(), await join.text()).toBe(200);
  }
  const detail = (await (
    await request.get(`${API_URL}/club/${clubId}`, { headers: headers(coach) })
  ).json()) as { members: { email: string; athleteId: number }[] };
  const idOf = (user: TestUser) =>
    detail.members.find((member) => member.email === user.email)!.athleteId;
  const group = await request.post(`${API_URL}/athlete-groups`, {
    headers: headers(coach),
    data: { name: 'Sprinters', clubId },
  });
  const { athleteGroupId } = (await group.json()) as {
    athleteGroupId: number;
  };
  await request.post(`${API_URL}/athlete-groups/${athleteGroupId}/athletes`, {
    headers: headers(coach),
    data: { athleteIds: [idOf(ben), idOf(cleo)] },
  });

  // Ana's session next Monday, planned by the coach
  const monday = nextMonday();
  const created = await request.post(`${API_URL}/event`, {
    headers: headers(coach),
    data: {
      type: 'TRAINING',
      name: 'Hill repeats',
      sport: 'RUNNING',
      description: '',
      goalDuration: 3600,
      athleteId: idOf(ana),
      startDate: monday.toISOString(),
      endDate: new Date(monday.getTime() + 3600_000).toISOString(),
    },
  });
  expect(created.status(), await created.text()).toBe(201);

  await signIn(page, coach);
  const problems = trackPageProblems(page);
  await page.goto(`/dashboard/calendar/${idOf(ana)}?view=week`);
  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(
    page.locator('.calendar-event').filter({ hasText: 'Hill repeats' }),
  ).toBeVisible();

  await page.locator('[data-week-actions]').click();
  await page.getByRole('menuitem', { name: 'Copy to other athletes' }).click();
  const dialog = page.locator('[data-plan-for-athletes]');
  await dialog
    .getByRole('button', { name: '+ Track Club · Sprinters' })
    .click();
  await expect(dialog.getByText('Athletes selected: 2')).toBeVisible();
  await dialog.getByRole('button', { name: 'Review' }).click();
  await expect(dialog.locator('[data-plan-preview] li')).toHaveCount(2);
  await dialog.getByRole('button', { name: 'Plan for 2 athlete(s)' }).click();
  await expect(page.getByText('Planned for 2 athlete(s)')).toBeVisible();

  await expect.poll(() => sessionsOf(request, ben)).toContain('Hill repeats');
  await expect.poll(() => sessionsOf(request, cleo)).toContain('Hill repeats');

  // One undo takes the whole operation back
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => sessionsOf(request, ben)).toEqual([]);
  await expect.poll(() => sessionsOf(request, cleo)).toEqual([]);
  expect(await sessionsOf(request, ana)).toEqual(['Hill repeats']);
  expect(problems).toEqual([]);
});
