import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

test('exports the account data as a JSON download', async ({ request }) => {
  const athlete = await createAthlete(request);

  const response = await request.get(`${API_URL}/user/me/export`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-disposition']).toMatch(
    /attachment; filename="openathlete-export-\d{4}-\d{2}-\d{2}\.json"/,
  );
  const text = await response.text();
  const data = JSON.parse(text) as {
    format: string;
    user: { email: string };
    athlete: { metrics: unknown[] };
    events: unknown[];
  };
  expect(data.format).toBe('openathlete-export-v1');
  expect(data.user.email).toBe(athlete.email);
  expect(data.athlete.metrics.length).toBeGreaterThan(0);
  expect(text).not.toContain('"password"');
});

test('requires authentication', async ({ request }) => {
  const response = await request.get(`${API_URL}/user/me/export`, {
    headers: apiHeaders(),
  });
  expect(response.status()).toBe(401);
});
