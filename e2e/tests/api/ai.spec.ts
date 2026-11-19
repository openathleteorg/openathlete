import { type APIRequestContext, expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

/** The OpenAI-compatible service of docker-compose.yml, seen from the API. */
const FAKE_LLM_URL = 'http://fake-llm:8080/v1';

async function addFakeLlmKey(
  request: APIRequestContext,
  accessToken: string,
  apiKey = 'e2e-secret-key-1234',
) {
  const response = await request.post(`${API_URL}/ai/credentials`, {
    headers: apiHeaders(undefined, accessToken),
    data: { provider: 'custom', apiKey, baseUrl: FAKE_LLM_URL },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as { aiCredentialId: number };
}

/** The user allows their data to be sent to AI providers */
async function allowDataSharing(
  request: APIRequestContext,
  accessToken: string,
) {
  const response = await request.post(`${API_URL}/ai/consent`, {
    headers: apiHeaders(undefined, accessToken),
  });
  expect(response.status(), await response.text()).toBe(200);
}

async function generateEvent(request: APIRequestContext, accessToken: string) {
  return request.post(`${API_URL}/agent/ai/events/generate`, {
    headers: apiHeaders(undefined, accessToken),
    data: { prompt: '45 minutes easy run', date: '2026-10-05' },
  });
}

test('AI features are off until the user sets them up', async ({ request }) => {
  const athlete = await createAthlete(request);

  const access = await request.get(`${API_URL}/ai/access`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });
  const { tasks } = (await access.json()) as {
    tasks: Record<string, { available: boolean }>;
  };
  expect(Object.values(tasks).every((task) => !task.available)).toBe(true);

  const generation = await generateEvent(request, athlete.accessToken);
  expect(generation.status()).toBe(403);
  expect(await generation.json()).toMatchObject({ code: 'AI_NOT_CONFIGURED' });
});

test('lists providers, with custom endpoints on this instance', async ({
  request,
}) => {
  const athlete = await createAthlete(request);

  const response = await request.get(`${API_URL}/ai/providers`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });
  const providers = (await response.json()) as {
    id: string;
    models: { id: string }[];
  }[];

  expect(providers.slice(0, 3).map((provider) => provider.id)).toEqual([
    'openai',
    'anthropic',
    'google',
  ]);
  expect(providers.length).toBeGreaterThan(50);
  expect(
    providers.find((p) => p.id === 'openai')?.models.length,
  ).toBeGreaterThan(0);
  expect(providers.at(-1)?.id).toBe('custom');
});

test('generates a workout on the user’s own AI key', async ({ request }) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const { aiCredentialId } = await addFakeLlmKey(request, athlete.accessToken);

  const check = await request.post(
    `${API_URL}/ai/credentials/${aiCredentialId}/test`,
    { headers, data: { modelId: 'fake-coach' } },
  );
  expect(await check.json()).toEqual({ ok: true });

  const models = await request.put(`${API_URL}/ai/models`, {
    headers,
    data: {
      preferences: [{ task: 'DEFAULT', aiCredentialId, modelId: 'fake-coach' }],
    },
  });
  expect(models.ok()).toBe(true);

  const access = await request.get(`${API_URL}/ai/access`, { headers });
  expect(
    ((await access.json()) as { tasks: Record<string, unknown> }).tasks
      .EVENT_GENERATION,
  ).toEqual({
    available: true,
    source: 'own_key',
    provider: 'custom',
    modelId: 'fake-coach',
  });

  // Nothing leaves for the provider before the user allows it
  const refused = await generateEvent(request, athlete.accessToken);
  expect(refused.status()).toBe(403);
  expect(await refused.json()).toMatchObject({ code: 'AI_CONSENT_REQUIRED' });
  await allowDataSharing(request, athlete.accessToken);

  const generation = await generateEvent(request, athlete.accessToken);
  expect(generation.status(), await generation.text()).toBe(201);
  expect(await generation.json()).toMatchObject({
    type: 'TRAINING',
    name: 'Easy endurance run',
    workout: { steps: [{ stepType: 'STEADY', durationValue: 2700 }] },
  });

  // Counted for the user's information, never against an allowance
  const after = await request.get(`${API_URL}/ai/access`, { headers });
  const { usage } = (await after.json()) as {
    usage: {
      ownKeyTokens: number;
      hostedBudgetUsed: null;
    };
  };
  expect(usage.ownKeyTokens).toBeGreaterThanOrEqual(20);
  // No limit without Stripe; what the instance keys cost is never told
  expect(usage).toMatchObject({ hostedBudgetUsed: null });
  expect(usage).not.toHaveProperty('hostedTokens');
});

test('never returns stored keys', async ({ request }) => {
  const athlete = await createAthlete(request);
  const created = await request.post(`${API_URL}/ai/credentials`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    data: { provider: 'openai', apiKey: 'sk-e2e-should-stay-secret-9876' },
  });

  const listed = await request.get(`${API_URL}/ai/credentials`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });

  for (const body of [await created.text(), await listed.text()]) {
    expect(body).not.toContain('should-stay-secret');
    expect(body).toContain('••••9876');
  }
});

test('reports a key the provider rejects', async ({ request }) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const { aiCredentialId } = await addFakeLlmKey(
    request,
    athlete.accessToken,
    'rejected-key',
  );

  const check = await request.post(
    `${API_URL}/ai/credentials/${aiCredentialId}/test`,
    { headers, data: { modelId: 'fake-coach' } },
  );
  expect(await check.json()).toMatchObject({
    ok: false,
    code: 'AI_CREDENTIAL_REJECTED',
  });

  await request.put(`${API_URL}/ai/models`, {
    headers,
    data: {
      preferences: [{ task: 'DEFAULT', aiCredentialId, modelId: 'fake-coach' }],
    },
  });
  await allowDataSharing(request, athlete.accessToken);
  const generation = await generateEvent(request, athlete.accessToken);
  expect(generation.status()).toBe(422);
  expect(await generation.json()).toMatchObject({
    code: 'AI_CREDENTIAL_REJECTED',
  });
});

test('keys stay private to their owner', async ({ request }) => {
  const owner = await createAthlete(request);
  const other = await createAthlete(request);
  const { aiCredentialId } = await addFakeLlmKey(request, owner.accessToken);
  const otherHeaders = apiHeaders(undefined, other.accessToken);

  const listed = await request.get(`${API_URL}/ai/credentials`, {
    headers: otherHeaders,
  });
  expect(await listed.json()).toEqual([]);

  const useIt = await request.put(`${API_URL}/ai/models`, {
    headers: otherHeaders,
    data: {
      preferences: [{ task: 'DEFAULT', aiCredentialId, modelId: 'fake-coach' }],
    },
  });
  expect(useIt.status()).toBe(400);

  const testIt = await request.post(
    `${API_URL}/ai/credentials/${aiCredentialId}/test`,
    { headers: otherHeaders, data: { modelId: 'fake-coach' } },
  );
  expect(testIt.status()).toBe(404);

  const deleteIt = await request.delete(
    `${API_URL}/ai/credentials/${aiCredentialId}`,
    { headers: otherHeaders },
  );
  expect(deleteIt.status()).toBe(404);
});
