import { type APIRequestContext, expect, test } from '@playwright/test';

import {
  type TestUser,
  apiHeaders,
  createAthlete,
  createCoachWithAthlete,
} from '../../support/api';
import { API_URL } from '../../support/env';

// What one account may do to another it has no coaching link with

const headersOf = (user: TestUser) => apiHeaders(undefined, user.accessToken);

async function me(request: APIRequestContext, user: TestUser) {
  const [profile, athlete] = await Promise.all([
    request.get(`${API_URL}/user/me`, { headers: headersOf(user) }),
    request.get(`${API_URL}/athlete/me`, { headers: headersOf(user) }),
  ]);
  return {
    profile: (await profile.json()) as Record<string, unknown>,
    userId: ((await profile.json()) as { userId: number }).userId,
    athleteId: ((await athlete.json()) as { athleteId: number }).athleteId,
  };
}

/** A planned session with a two-step workout, on the user's calendar. */
async function planWorkout(request: APIRequestContext, user: TestUser) {
  const start = new Date(Date.now() + 3 * 24 * 3600_000);
  const response = await request.post(`${API_URL}/event`, {
    headers: headersOf(user),
    data: {
      type: 'TRAINING',
      name: 'Intervals',
      sport: 'RUNNING',
      description: '',
      startDate: start.toISOString(),
      endDate: new Date(start.getTime() + 3600_000).toISOString(),
      workout: {
        steps: [
          { stepType: 'WARMUP', durationType: 'TIME', durationValue: 600 },
          { stepType: 'STEADY', durationType: 'TIME', durationValue: 1200 },
        ],
      },
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as {
    eventId: number;
    workout: { steps: { workoutStepId: number; orderIndex: number }[] };
  };
}

const noSecrets = (body: string) => {
  expect(body).not.toContain('"password"');
  expect(body).not.toContain('"pushToken"');
};

test('no response carries a password hash or a push token', async ({
  request,
}) => {
  const { coach, athlete } = await createCoachWithAthlete(request);
  noSecrets(JSON.stringify((await me(request, athlete)).profile));

  const coaches = await request.get(`${API_URL}/athlete/coaches`, {
    headers: headersOf(athlete),
  });
  expect(coaches.status()).toBe(200);
  const list = (await coaches.json()) as Record<string, unknown>[];
  expect(list).toHaveLength(1);
  expect(Object.keys(list[0]).sort()).toEqual([
    'email',
    'firstName',
    'lastName',
    'userId',
  ]);
  expect(list[0].email).toBe(coach.email);
});

test('conversations only start between coaches and their athletes', async ({
  request,
}) => {
  const { coach, athlete } = await createCoachWithAthlete(request);
  const stranger = await createAthlete(request);
  const [coachIds, athleteIds, strangerIds] = await Promise.all([
    me(request, coach),
    me(request, athlete),
    me(request, stranger),
  ]);
  const start = (user: TestUser, participantUserIds: number[]) =>
    request.post(`${API_URL}/messages/threads`, {
      headers: headersOf(user),
      data: { participantUserIds },
    });

  for (const ids of [
    [strangerIds.userId, athleteIds.userId],
    [strangerIds.userId, coachIds.userId],
    // An id nobody has answers the same, rather than with a 500
    [strangerIds.userId, 2_000_000_000],
  ]) {
    const response = await start(stranger, ids);
    expect(response.status(), await response.text()).toBe(403);
    expect(await response.text()).not.toContain(athlete.email);
  }

  const thread = await start(athlete, [athleteIds.userId, coachIds.userId]);
  expect(thread.status(), await thread.text()).toBe(201);
  const body = await thread.text();
  // Names, but no addresses: the app never shows them in a conversation
  expect(body).toContain('"firstName"');
  expect(body).not.toContain(coach.email);
  expect(body).not.toContain(athlete.email);

  const alone = await start(stranger, [strangerIds.userId]);
  expect(alone.status(), await alone.text()).toBe(201);
});

test("a template never reaches another athlete's calendar", async ({
  request,
}) => {
  const owner = await createAthlete(request);
  const stranger = await createAthlete(request);
  const { athleteId } = await me(request, owner);

  const session = await planWorkout(request, stranger);
  const template = await request.post(`${API_URL}/event-template`, {
    headers: headersOf(stranger),
    data: { eventId: session.eventId },
  });
  expect(template.status(), await template.text()).toBe(201);
  const { eventTemplateId } = (await template.json()) as {
    eventTemplateId: number;
  };

  const day = new Date(Date.now() + 5 * 24 * 3600_000);
  const use = await request.post(
    `${API_URL}/event-template/${eventTemplateId}/use`,
    {
      headers: headersOf(stranger),
      data: {
        startDate: day.toISOString(),
        endDate: new Date(day.getTime() + 3600_000).toISOString(),
        athleteId,
      },
    },
  );
  expect(use.status(), await use.text()).toBe(403);

  const calendar = await request.get(`${API_URL}/event`, {
    headers: headersOf(owner),
  });
  expect(((await calendar.json()) as unknown[]).length).toBe(0);
});

test("a workout's steps are reordered only through its own session", async ({
  request,
}) => {
  const owner = await createAthlete(request);
  const stranger = await createAthlete(request);
  const target = await planWorkout(request, owner);
  const own = await planWorkout(request, stranger);
  const [step] = target.workout.steps;

  const reorder = await request.patch(
    `${API_URL}/event/${own.eventId}/workout/reorder`,
    {
      headers: headersOf(stranger),
      data: { stepOrders: [{ stepId: step.workoutStepId, order: 5 }] },
    },
  );
  expect(reorder.status(), await reorder.text()).toBe(400);

  const after = await request.get(`${API_URL}/event/${target.eventId}`, {
    headers: headersOf(owner),
  });
  const { workout } = (await after.json()) as typeof target;
  expect(workout.steps.map((s) => s.orderIndex)).toEqual(
    target.workout.steps.map((s) => s.orderIndex),
  );
});

test("an athlete's plans stay private to them and their coaches", async ({
  request,
}) => {
  const { coach, athlete, athleteId } = await createCoachWithAthlete(request);
  const stranger = await createAthlete(request);
  const path = `${API_URL}/subscription/athlete/${athleteId}/feature-access/ai-generation`;

  for (const user of [athlete, coach]) {
    const allowed = await request.get(path, { headers: headersOf(user) });
    expect(allowed.status(), await allowed.text()).toBe(200);
  }
  const refused = await request.get(path, { headers: headersOf(stranger) });
  expect(refused.status()).toBe(403);
});

test('nobody can ask whether an email has an account', async ({ request }) => {
  const athlete = await createAthlete(request);
  const response = await request.get(
    `${API_URL}/auth/email-exists?email=${encodeURIComponent(athlete.email)}`,
    { headers: apiHeaders() },
  );
  expect(response.status()).toBe(404);
});
