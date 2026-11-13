import { type APIRequestContext, expect, test } from '@playwright/test';

import { type TestUser, apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

async function joinLinkOf(request: APIRequestContext, coach: TestUser) {
  const response = await request.get(`${API_URL}/coach-join-link`, {
    headers: apiHeaders(undefined, coach.accessToken),
  });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as { token: string; url: string };
}

async function coachedEmails(request: APIRequestContext, coach: TestUser) {
  const response = await request.get(`${API_URL}/athlete/coached`, {
    headers: apiHeaders(undefined, coach.accessToken),
  });
  expect(response.status(), await response.text()).toBe(200);
  const athletes = (await response.json()) as { user?: { email: string } }[];
  return athletes.map((athlete) => athlete.user?.email);
}

test('one join link links any athlete to the coach, until it is reset', async ({
  request,
}) => {
  const coach = await createAthlete(request, {
    roles: ['COACH'],
    firstName: 'Ana',
  });
  const [first, second] = [
    await createAthlete(request),
    await createAthlete(request),
  ];
  const link = await joinLinkOf(request, coach);
  expect(link.url).toMatch(new RegExp(`/join/${link.token}$`));
  expect((await joinLinkOf(request, coach)).token).toBe(link.token);

  // The public page sees a name, never the email
  const info = await request.get(`${API_URL}/coach-join-link/${link.token}`, {
    headers: apiHeaders(),
  });
  expect(info.status()).toBe(200);
  expect(await info.json()).toEqual({ coachName: 'Ana A.' });

  for (const athlete of [first, second, first]) {
    const accept = await request.post(
      `${API_URL}/coach-join-link/${link.token}/accept`,
      { headers: apiHeaders(undefined, athlete.accessToken) },
    );
    expect(accept.status(), await accept.text()).toBe(200);
  }
  expect((await coachedEmails(request, coach)).sort()).toEqual(
    [first.email, second.email].sort(),
  );

  const own = await request.post(
    `${API_URL}/coach-join-link/${link.token}/accept`,
    { headers: apiHeaders(undefined, coach.accessToken) },
  );
  expect(own.status()).toBe(400);

  // Every account can coach: another one gets a link of its own
  const otherLink = await joinLinkOf(request, first);
  expect(otherLink.token).not.toBe(link.token);

  const rotate = await request.post(`${API_URL}/coach-join-link/rotate`, {
    headers: apiHeaders(undefined, coach.accessToken),
  });
  expect(rotate.status(), await rotate.text()).toBe(200);
  const old = await request.get(`${API_URL}/coach-join-link/${link.token}`, {
    headers: apiHeaders(),
  });
  expect(old.status()).toBe(404);
});

test('an athlete who opens the link signed out is linked once signed in', async ({
  page,
  request,
}) => {
  const coach = await createAthlete(request, {
    roles: ['COACH'],
    firstName: 'Ana',
  });
  const athlete = await createAthlete(request);
  const { token } = await joinLinkOf(request, coach);

  // Signed out, the app asks the API for a session and gets a 401: only
  // what follows the sign-in counts
  await page.goto(`/join/${token}`);
  await expect(
    page.getByRole('heading', {
      name: 'Ana A. invites you to train with them on OpenAthlete',
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Create an account' }),
  ).toBeVisible();

  // Signing in (here with the API's tokens) brings them to the dashboard,
  // which spends the remembered link
  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard');
  await expect(page.getByText('Ana A. is now your coach')).toBeVisible();
  await expect
    .poll(() => coachedEmails(request, coach))
    .toEqual([athlete.email]);
  expect(problems).toEqual([]);
});

test('a signed-in athlete joins only once they confirm', async ({
  page,
  request,
}) => {
  const coach = await createAthlete(request, {
    roles: ['COACH'],
    firstName: 'Ana',
  });
  const athlete = await createAthlete(request);
  const { token } = await joinLinkOf(request, coach);
  await signIn(page, athlete);

  await page.goto(`/join/${token}`);
  const join = page.getByRole('button', { name: 'Join Ana A.' });
  await expect(join).toBeVisible();
  // Opening the link shares nothing yet
  expect(await coachedEmails(request, coach)).toEqual([]);

  await join.click();
  await expect(page.getByText('Ana A. is now your coach')).toBeVisible();
  await expect
    .poll(() => coachedEmails(request, coach))
    .toEqual([athlete.email]);
});

test('an unknown join link says so', async ({ page }) => {
  await page.goto('/join/not-a-real-token-at-all');
  await expect(
    page.getByRole('heading', { name: 'This link no longer works' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Go to OpenAthlete' }),
  ).toBeVisible();
});
