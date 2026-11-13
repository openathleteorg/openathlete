import { type APIRequestContext, expect, test } from '@playwright/test';

import { type TestUser, apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const headers = (user: TestUser) => apiHeaders(undefined, user.accessToken);

async function createClub(
  request: APIRequestContext,
  owner: TestUser,
  name: string,
) {
  const response = await request.post(`${API_URL}/club`, {
    headers: headers(owner),
    data: { name },
  });
  expect(response.status(), await response.text()).toBe(201);
  const { clubId } = (await response.json()) as { clubId: number };
  const links = await request.get(`${API_URL}/club/${clubId}/join-links`, {
    headers: headers(owner),
  });
  expect(links.status(), await links.text()).toBe(200);
  const { athlete, staff } = (await links.json()) as Record<
    'athlete' | 'staff',
    { token: string; url: string }
  >;
  return { clubId, athleteToken: athlete.token, staffToken: staff.token };
}

async function join(request: APIRequestContext, user: TestUser, token: string) {
  const response = await request.post(`${API_URL}/club-join/${token}/accept`, {
    headers: headers(user),
  });
  expect(response.status(), await response.text()).toBe(200);
}

async function coachedEmails(request: APIRequestContext, coach: TestUser) {
  const response = await request.get(`${API_URL}/athlete/coached`, {
    headers: headers(coach),
  });
  expect(response.status(), await response.text()).toBe(200);
  const athletes = (await response.json()) as { user?: { email: string } }[];
  return athletes.map((athlete) => athlete.user?.email).sort();
}

async function memberOf(
  request: APIRequestContext,
  viewer: TestUser,
  clubId: number,
) {
  const response = await request.get(`${API_URL}/club/${clubId}`, {
    headers: headers(viewer),
  });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as {
    members: {
      userId: number;
      email: string | null;
      role: string;
      athleteId: number | null;
    }[];
  };
}

test('a club gives its coaches its athletes, and an assistant only their groups', async ({
  request,
}) => {
  const owner = await createAthlete(request, {
    roles: ['COACH'],
    firstName: 'Olga',
  });
  const coach = await createAthlete(request, { firstName: 'Carl' });
  const assistant = await createAthlete(request, { firstName: 'Ada' });
  const [ana, ben] = [
    await createAthlete(request, { firstName: 'Ana' }),
    await createAthlete(request, { firstName: 'Ben' }),
  ];
  const { clubId, athleteToken, staffToken } = await createClub(
    request,
    owner,
    'Running Club',
  );

  // The public page names the club and its staff, never their emails
  const info = await request.get(`${API_URL}/club-join/${athleteToken}`, {
    headers: apiHeaders(),
  });
  expect(await info.json()).toEqual({
    clubName: 'Running Club',
    role: 'ATHLETE',
    staff: [{ name: 'Olga A.', role: 'OWNER' }],
  });

  await join(request, coach, staffToken);
  await join(request, assistant, staffToken);
  for (const athlete of [ana, ben, ana]) {
    await join(request, athlete, athleteToken);
  }
  expect(await coachedEmails(request, owner)).toEqual(
    [ana.email, ben.email].sort(),
  );
  expect(await coachedEmails(request, coach)).toEqual(
    [ana.email, ben.email].sort(),
  );

  // Made an assistant, Ada coaches the athletes of her group only
  const club = await memberOf(request, owner, clubId);
  const idOf = (email: string) =>
    club.members.find((member) => member.email === email)!;
  const role = await request.patch(
    `${API_URL}/club/${clubId}/members/${idOf(assistant.email).userId}`,
    { headers: headers(owner), data: { role: 'ASSISTANT' } },
  );
  expect(role.status(), await role.text()).toBe(200);
  expect(await coachedEmails(request, assistant)).toEqual([]);

  const group = await request.post(`${API_URL}/athlete-groups`, {
    headers: headers(owner),
    data: { name: 'Track', clubId },
  });
  expect(group.status(), await group.text()).toBe(201);
  const { athleteGroupId } = (await group.json()) as {
    athleteGroupId: number;
  };
  for (const [path, method, data] of [
    ['athletes', 'post', { athleteIds: [idOf(ana.email).athleteId] }],
    ['staff', 'put', { userIds: [idOf(assistant.email).userId] }],
  ] as const) {
    const response = await request[method](
      `${API_URL}/athlete-groups/${athleteGroupId}/${path}`,
      { headers: headers(owner), data },
    );
    expect(response.status(), await response.text()).toBe(200);
  }
  expect(await coachedEmails(request, assistant)).toEqual([ana.email]);

  // An athlete sees the staff, not the other athletes nor any email
  const seenByAna = await memberOf(request, ana, clubId);
  expect(seenByAna.members.map((member) => member.role).sort()).toEqual([
    'ASSISTANT',
    'ATHLETE',
    'COACH',
    'OWNER',
  ]);
  expect(seenByAna.members.every((member) => member.email === null)).toBe(true);
  const groups = await request.get(
    `${API_URL}/athlete-groups?clubId=${clubId}`,
    { headers: headers(ana) },
  );
  expect(groups.status()).toBe(403);

  // The club, not the athlete's coach list, ends a club's link
  const coachUserId = idOf(coach.email).userId;
  const removeCoach = await request.delete(
    `${API_URL}/athlete/coach/${coachUserId}`,
    { headers: headers(ben) },
  );
  expect(removeCoach.status()).toBe(409);
  const leave = await request.delete(
    `${API_URL}/club/${clubId}/members/${idOf(ben.email).userId}`,
    { headers: headers(ben) },
  );
  expect(leave.status(), await leave.text()).toBe(204);
  expect(await coachedEmails(request, coach)).toEqual([ana.email]);

  // Outsiders cannot even tell the club exists
  const outsider = await request.get(`${API_URL}/club/${clubId}`, {
    headers: headers(ben),
  });
  expect(outsider.status()).toBe(404);
});

test('a coach creates a club, sorts its athletes in groups and filters the dashboard', async ({
  page,
  request,
}) => {
  const owner = await createAthlete(request, {
    roles: ['ATHLETE', 'COACH'],
    firstName: 'Olga',
  });
  const [ines, jon] = [
    await createAthlete(request, { firstName: 'Ines' }),
    await createAthlete(request, { firstName: 'Jon' }),
  ];
  await signIn(page, owner);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard/settings?tab=clubs');
  await page.getByRole('button', { name: 'Create a club' }).click();
  await page.getByLabel('Club name').fill('Trail Club');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByText('Trail Club is created')).toBeVisible();
  await expect(page.locator('[data-club-detail="Trail Club"]')).toBeVisible();

  // Both links are ready to share
  const athleteLink = page.locator(
    '[data-club-join-link="athlete"] [data-club-join-link-url]',
  );
  await expect(athleteLink).toContainText('/club-join/');
  const token = (await athleteLink.innerText()).trim().split('/').pop()!;
  await join(request, ines, token);
  await join(request, jon, token);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Athletes (2)' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'New group' }).click();
  await page.getByLabel('Group name').fill('Juniors');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  // A new group asks for its athletes straight away
  await page.getByRole('dialog').getByText('Ines Athlete').click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(
    page.locator('[data-athlete-group="Juniors"]').getByText('Athletes: 1'),
  ).toBeVisible();

  await page.goto('/dashboard/coach');
  const table = page.locator('[data-coach-table]');
  await expect(table.getByText('Jon Athlete')).toBeVisible();
  await page.locator('[data-group-filter]').click();
  await page.getByRole('option', { name: 'Trail Club · Juniors' }).click();
  await expect(table.getByText('Ines Athlete')).toBeVisible();
  await expect(table.getByText('Jon Athlete')).toBeHidden();
  expect(problems).toEqual([]);
});

test('an athlete who opens a club link signed out joins once signed in', async ({
  page,
  request,
}) => {
  const owner = await createAthlete(request, {
    roles: ['COACH'],
    firstName: 'Olga',
  });
  const athlete = await createAthlete(request);
  const { athleteToken } = await createClub(request, owner, 'Swim Club');

  await page.goto(`/club-join/${athleteToken}`);
  await expect(
    page.getByRole('heading', { name: 'Join Swim Club on OpenAthlete' }),
  ).toBeVisible();
  // Before anything is shared, the athlete sees who will see their training
  await expect(page.getByText('Olga A.')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Create an account' }),
  ).toBeVisible();

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard');
  await expect(page.getByText('You joined Swim Club')).toBeVisible();
  await expect
    .poll(() => coachedEmails(request, owner))
    .toEqual([athlete.email]);
  expect(problems).toEqual([]);
});
