import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

test('serves the calendar feed to its token until it is regenerated', async ({
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const start = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  const planned = await request.post(`${API_URL}/event`, {
    headers,
    data: {
      type: 'TRAINING',
      name: 'Feed tempo',
      sport: 'RUNNING',
      description: '',
      startDate: start.toISOString(),
      endDate: new Date(start.getTime() + 3600_000).toISOString(),
    },
  });
  expect(planned.status(), await planned.text()).toBe(201);

  const secret = await request.get(`${API_URL}/event/ical/secret`, { headers });
  expect(secret.status()).toBe(200);
  const token = await secret.text();
  // The same link on every visit of the settings
  const again = await request.get(`${API_URL}/event/ical/secret`, { headers });
  expect(await again.text()).toBe(token);

  // Calendar apps call it without any bearer token
  const feedUrl = (calendar: string) =>
    `${API_URL}/event/ical?calendar=${encodeURIComponent(calendar)}`;
  const feed = await request.get(feedUrl(token), { headers: apiHeaders() });
  expect(feed.status()).toBe(200);
  expect(feed.headers()['content-type']).toContain('text/calendar');
  expect(await feed.text()).toContain('SUMMARY:Feed tempo');

  const regenerated = await request.post(`${API_URL}/event/ical/secret`, {
    headers,
  });
  expect(regenerated.status()).toBe(201);
  const fresh = await regenerated.text();
  expect(fresh).not.toBe(token);

  const revoked = await request.get(feedUrl(token), { headers: apiHeaders() });
  expect(revoked.status()).toBe(401);
  const renewed = await request.get(feedUrl(fresh), { headers: apiHeaders() });
  expect(renewed.status()).toBe(200);
});

test('refuses an unknown calendar feed token', async ({ request }) => {
  const response = await request.get(
    `${API_URL}/event/ical?calendar=${'a'.repeat(43)}`,
    { headers: apiHeaders() },
  );
  expect(response.status()).toBe(401);
});
