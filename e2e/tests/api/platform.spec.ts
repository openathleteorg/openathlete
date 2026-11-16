import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

test('reports healthy', async ({ request }) => {
  const response = await request.get(`${API_URL}/health`);
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({ status: 'ok' });
});

test('sends security headers', async ({ request }) => {
  const response = await request.get(`${API_URL}/health`);
  const headers = response.headers();

  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['x-powered-by']).toBeUndefined();
});

test('serves the API reference', async ({ request }) => {
  const response = await request.get(`${API_URL}/docs`);
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('swagger-ui');
});

test('refuses to connect a device service the instance has not set up', async ({
  request,
}) => {
  const athlete = await createAthlete(request);
  const response = await request.get(`${API_URL}/provider/strava/uri`, {
    headers: apiHeaders(undefined, athlete.accessToken),
  });
  expect(response.status()).toBe(503);
  expect(await response.text()).toContain('PROVIDER_NOT_CONFIGURED');
});

// Zod 3 validates every element of an array: oversized bodies and arrays
// stop before validation (GHSA-mrhx-c7xc-m3w5)
test('refuses oversized JSON bodies and arrays', async ({ request }) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);

  const tooLarge = await request.post(`${API_URL}/event`, {
    headers,
    data: { padding: 'x'.repeat(1_100_000) },
  });
  expect(tooLarge.status()).toBe(413);

  const tooLong = await request.post(`${API_URL}/event`, {
    headers,
    data: { steps: new Array(10_001).fill(0) },
  });
  expect(tooLong.status()).toBe(413);
});

test('accepts large Garmin notifications, as its review requires', async ({
  request,
}) => {
  const response = await request.post(`${API_URL}/provider/garmin/webhook`, {
    data: { activities: [], padding: 'x'.repeat(2_000_000) },
  });
  expect(response.status()).toBe(200);
});

test('accepts pushed Garmin activity details past the JSON limit', async ({
  request,
}) => {
  // Garmin's review sends activity details of up to 100 MB
  const body = JSON.stringify({
    activityDetails: [],
    padding: 'x'.repeat(15 * 1024 * 1024),
  });
  const response = await request.post(
    `${API_URL}/provider/garmin/webhook/activity-details`,
    { data: body, headers: { 'Content-Type': 'application/json' } },
  );
  expect(response.status()).toBe(200);
});
