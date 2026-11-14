import { expect, test } from '@playwright/test';

import { type TestUser, apiHeaders, createAthlete } from '../../support/api';
import { pageAs, signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const headers = (user: TestUser) => apiHeaders(undefined, user.accessToken);

test("a club session reaches its group's calendars, and the coach sees who comes", async ({
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
    data: { name: 'Track Club' },
  });
  const { clubId } = (await club.json()) as { clubId: number };
  const links = (await (
    await request.get(`${API_URL}/club/${clubId}/join-links`, {
      headers: headers(owner),
    })
  ).json()) as { athlete: { token: string } };
  await request.post(`${API_URL}/club-join/${links.athlete.token}/accept`, {
    headers: headers(athlete),
  });
  const detail = (await (
    await request.get(`${API_URL}/club/${clubId}`, { headers: headers(owner) })
  ).json()) as { members: { email: string; athleteId: number }[] };
  const anaId = detail.members.find(
    (m) => m.email === athlete.email,
  )!.athleteId;
  const group = (await (
    await request.post(`${API_URL}/athlete-groups`, {
      headers: headers(owner),
      data: { name: 'Sprinters', clubId },
    })
  ).json()) as { athleteGroupId: number };
  await request.post(
    `${API_URL}/athlete-groups/${group.athleteGroupId}/athletes`,
    { headers: headers(owner), data: { athleteIds: [anaId] } },
  );

  // The coach plans the weekly session from the club's page
  await signIn(page, owner);
  let problems = trackPageProblems(page);
  await page.goto(`/dashboard/settings?tab=clubs&club=${clubId}`);
  await page.locator('[data-club-session-new]').click();
  const dialog = page.locator('[data-club-session-dialog]');
  await dialog.getByLabel('Name').fill('Track Tuesday');
  await dialog.getByLabel('Place').fill('City stadium');
  await dialog.getByRole('combobox', { name: 'For' }).click();
  await page.getByRole('option', { name: 'Sprinters' }).click();
  const today = await page.evaluate(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  });
  await dialog.getByLabel('First day').fill(today);
  await dialog.getByLabel('Start time').fill('23:00');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByText("Session saved: it is in the athletes' calendars"),
  ).toBeVisible();
  const session = page.locator('[data-club-session="Track Tuesday"]');
  await expect(
    session.locator(`[data-club-session-occurrence="${today}"]`),
  ).toContainText('0 coming / 1');
  expect(problems).toEqual([]);

  // Ana finds it in her calendar, with the place, and says she comes
  const anaPage = await pageAs(browser, athlete);
  problems = trackPageProblems(anaPage);
  await anaPage.goto('/dashboard/calendar?view=week');
  await anaPage
    .locator('.calendar-event')
    .filter({ hasText: 'Track Tuesday' })
    .first()
    .click();
  const panel = anaPage.locator('[data-club-session-panel]');
  await expect(panel).toContainText('Session of Track Club');
  await expect(panel).toContainText('City stadium');
  await panel.getByRole('button', { name: "I'm coming" }).click();
  await expect(
    panel.getByRole('button', { name: "I'm coming" }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(problems).toEqual([]);

  await page.reload();
  await expect(
    session.locator(`[data-club-session-occurrence="${today}"]`),
  ).toContainText('1 coming / 1');
});
