import { type APIRequestContext, expect, test } from '@playwright/test';

import { type TestUser, apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const headers = (user: TestUser) => apiHeaders(undefined, user.accessToken);

/** A template of the user's own library, made from a session */
async function ownTemplate(
  request: APIRequestContext,
  user: TestUser,
  name: string,
) {
  const start = new Date(Date.now() + 2 * 86400_000);
  const session = await request.post(`${API_URL}/event`, {
    headers: headers(user),
    data: {
      type: 'TRAINING',
      name,
      sport: 'RUNNING',
      description: '',
      goalDuration: 3600,
      startDate: start.toISOString(),
      endDate: new Date(start.getTime() + 3600_000).toISOString(),
    },
  });
  expect(session.status(), await session.text()).toBe(201);
  const { eventId } = (await session.json()) as { eventId: number };
  const template = await request.post(`${API_URL}/event-template`, {
    headers: headers(user),
    data: { eventId },
  });
  expect(template.status(), await template.text()).toBe(201);
}

async function libraryOf(
  request: APIRequestContext,
  user: TestUser,
  clubId?: number,
) {
  const response = await request.get(
    `${API_URL}/event-template${clubId ? `?clubId=${clubId}` : ''}`,
    { headers: headers(user) },
  );
  return {
    status: response.status(),
    names:
      response.status() === 200
        ? ((await response.json()) as { event: { name: string } }[]).map(
            (template) => template.event.name,
          )
        : [],
  };
}

test("a coach shares a template with the club, whose assistant uses it but can't change it", async ({
  page,
  request,
}) => {
  const owner = await createAthlete(request, {
    roles: ['ATHLETE', 'COACH'],
    firstName: 'Olga',
  });
  const assistant = await createAthlete(request, { firstName: 'Ada' });
  const outsider = await createAthlete(request, { firstName: 'Sam' });
  const club = await request.post(`${API_URL}/club`, {
    headers: headers(owner),
    data: { name: 'Trail Club' },
  });
  const { clubId } = (await club.json()) as { clubId: number };
  const links = (await (
    await request.get(`${API_URL}/club/${clubId}/join-links`, {
      headers: headers(owner),
    })
  ).json()) as { staff: { token: string } };
  await request.post(`${API_URL}/club-join/${links.staff.token}/accept`, {
    headers: headers(assistant),
  });
  const members = (await (
    await request.get(`${API_URL}/club/${clubId}`, { headers: headers(owner) })
  ).json()) as { members: { userId: number; email: string }[] };
  const adaId = members.members.find((m) => m.email === assistant.email)!;
  await request.patch(`${API_URL}/club/${clubId}/members/${adaId.userId}`, {
    headers: headers(owner),
    data: { role: 'ASSISTANT' },
  });
  await ownTemplate(request, owner, 'Hill sprints');

  // Olga shares her template from the library panel
  await signIn(page, owner);
  let problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar');
  await page.getByRole('button', { name: 'Template Library' }).click();
  await page.locator('[data-template="Hill sprints"]').hover();
  await page.locator('[data-template-share-to-club]').click();
  await page.getByRole('button', { name: 'Trail Club' }).click();
  await expect(
    page.getByText('Copied into the Trail Club library'),
  ).toBeVisible();

  await page.locator('[data-library-switch]').click();
  await page.getByRole('option', { name: 'Trail Club library' }).click();
  await expect(page.locator('[data-template="Hill sprints"]')).toBeVisible();
  expect(problems).toEqual([]);

  // Her own library still has hers; the club's has the copy
  expect((await libraryOf(request, owner)).names).toEqual(['Hill sprints']);
  expect((await libraryOf(request, owner, clubId)).names).toEqual([
    'Hill sprints',
  ]);

  // Ada sees it, without the buttons that would change it
  await page.context().clearCookies();
  await signIn(page, assistant);
  problems = trackPageProblems(page);
  await page.goto('/dashboard/calendar');
  await page.getByRole('button', { name: 'Template Library' }).click();
  await page.locator('[data-library-switch]').click();
  await page.getByRole('option', { name: 'Trail Club library' }).click();
  const template = page.locator('[data-template="Hill sprints"]');
  await expect(template).toBeVisible();
  await template.hover();
  await expect(page.locator('[data-template-share-to-club]')).toHaveCount(0);
  expect(problems).toEqual([]);
  const [shared] = (await (
    await request.get(`${API_URL}/event-template?clubId=${clubId}`, {
      headers: headers(assistant),
    })
  ).json()) as { eventTemplateId: number }[];
  const remove = await request.delete(
    `${API_URL}/event-template/${shared.eventTemplateId}`,
    { headers: headers(assistant) },
  );
  expect(remove.status()).toBe(403);

  // Outside the club, the library does not exist
  expect((await libraryOf(request, outsider, clubId)).status).toBe(404);
});
