import { type APIRequestContext, expect } from '@playwright/test';
import { randomInt, randomUUID } from 'node:crypto';

import { API_URL } from './env';

export interface TestUser {
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

export type TestAthlete = TestUser;

/**
 * A private address for X-Forwarded-For. The API trusts it from the Docker
 * network, so each caller gets its own rate limit budget instead of sharing
 * the 10 logins per minute of the test runner's IP.
 */
export function randomClientIp(): string {
  return `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
}

export function apiHeaders(ip = randomClientIp(), accessToken?: string) {
  return {
    'X-Forwarded-For': ip,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export async function login(
  request: APIRequestContext,
  email: string,
  password: string,
  ip = randomClientIp(),
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await request.post(`${API_URL}/auth/login`, {
    headers: apiHeaders(ip),
    data: { email, password },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };
}

/** Signs up a new user who has not been through the onboarding yet. */
export async function createNewUser(
  request: APIRequestContext,
): Promise<TestUser> {
  const ip = randomClientIp();
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'E2e-Test-Passw0rd!';
  const signup = await request.post(`${API_URL}/user`, {
    headers: apiHeaders(ip),
    data: { email, password, firstName: 'New', lastName: 'Comer' },
  });
  expect(signup.status(), await signup.text()).toBe(201);
  const tokens = await login(request, email, password, ip);
  return { email, password, ...tokens };
}

/** Signs up a new user and completes the onboarding with the given roles. */
async function createUser(
  request: APIRequestContext,
  roles: ('ATHLETE' | 'COACH')[],
  { firstName = 'Test', lastName = 'Athlete' } = {},
): Promise<TestUser> {
  const ip = randomClientIp();
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'E2e-Test-Passw0rd!';

  const signup = await request.post(`${API_URL}/user`, {
    headers: apiHeaders(ip),
    data: { email, password, firstName, lastName },
  });
  expect(signup.status(), await signup.text()).toBe(201);

  const { accessToken, refreshToken } = await login(
    request,
    email,
    password,
    ip,
  );

  const onboarding = await request.post(`${API_URL}/user/complete-onboarding`, {
    headers: apiHeaders(ip, accessToken),
    data: {
      roles,
      ...(roles.includes('ATHLETE') && {
        gender: 'MALE',
        hrMax: 190,
        hrRest: 50,
      }),
    },
  });
  expect(onboarding.status(), await onboarding.text()).toBe(201);

  return { email, password, accessToken, refreshToken };
}

/** Signs up a new user and completes the athlete onboarding. */
export function createAthlete(
  request: APIRequestContext,
  {
    roles = ['ATHLETE'],
    firstName = 'Test',
  }: { roles?: ('ATHLETE' | 'COACH')[]; firstName?: string } = {},
): Promise<TestAthlete> {
  return createUser(request, roles, { firstName });
}

/** The coach invites the athlete, who accepts: the coach then sees them. */
export async function linkCoach(
  request: APIRequestContext,
  coach: TestUser,
  athlete: TestUser,
) {
  const invite = await request.post(`${API_URL}/athlete/invite/athlete`, {
    headers: apiHeaders(undefined, coach.accessToken),
    data: { email: athlete.email },
  });
  expect(invite.status(), await invite.text()).toBe(201);

  const athleteHeaders = apiHeaders(undefined, athlete.accessToken);
  const pending = await request.get(`${API_URL}/athlete/invitations/pending`, {
    headers: athleteHeaders,
  });
  expect(pending.status(), await pending.text()).toBe(200);
  const [invitation] = (await pending.json()) as {
    athleteInvitationId: number;
  }[];
  const accept = await request.post(
    `${API_URL}/athlete/invitations/${invitation.athleteInvitationId}/accept`,
    { headers: athleteHeaders },
  );
  expect(accept.status(), await accept.text()).toBe(201);
}

/**
 * A coach and an athlete linked the way people do it: the coach invites the
 * athlete, who accepts. athleteId is the athlete profile the coach manages.
 */
export async function createCoachWithAthlete(request: APIRequestContext) {
  const athlete = await createAthlete(request);
  const coach = await createUser(request, ['COACH'], { lastName: 'Coach' });
  await linkCoach(request, coach, athlete);

  const coached = await request.get(`${API_URL}/athlete/coached`, {
    headers: apiHeaders(undefined, coach.accessToken),
  });
  expect(coached.status(), await coached.text()).toBe(200);
  const [{ athleteId }] = (await coached.json()) as { athleteId: number }[];

  return { coach, athlete, athleteId };
}
