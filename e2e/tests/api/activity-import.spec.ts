import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

// A synthetic 10-minute run recorded with the Garmin FIT SDK; no real data.
const FIT = readFileSync(
  path.join(import.meta.dirname, '../../fixtures/synthetic-run.fit'),
);

// A synthetic 10-minute GPX run with heart rate; no real data.
const GPX = readFileSync(
  path.join(import.meta.dirname, '../../fixtures/synthetic-run.gpx'),
);

const upload = (
  accessToken: string,
  name: string,
  buffer: Buffer,
  fields: Record<string, string> = {},
) =>
  ({
    headers: apiHeaders(undefined, accessToken),
    multipart: {
      file: { name, mimeType: 'application/octet-stream', buffer },
      name: 'E2E run',
      ...fields,
    },
  }) as const;

test('imports a FIT activity once for its athlete', async ({ request }) => {
  const athlete = await createAthlete(request);

  const first = await request.post(
    `${API_URL}/activity-import/fit`,
    upload(athlete.accessToken, 'run.fit', FIT),
  );
  expect(first.status(), await first.text()).toBe(201);
  const imported = await first.json();
  expect(imported).toMatchObject({
    name: 'E2E run',
    startDate: '2024-05-01T07:00:00.000Z',
    alreadyImported: false,
    processingQueued: true,
    warnings: [],
  });

  // The same file again returns the same activity instead of a copy.
  const again = await request.post(
    `${API_URL}/activity-import/fit`,
    upload(athlete.accessToken, 'run.fit', FIT),
  );
  expect(again.status()).toBe(201);
  expect(await again.json()).toMatchObject({
    eventId: imported.eventId,
    alreadyImported: true,
  });
});

test('refuses files that are not FIT activities', async ({ request }) => {
  const athlete = await createAthlete(request);
  const response = await request.post(
    `${API_URL}/activity-import/fit`,
    upload(athlete.accessToken, 'notes.fit', Buffer.from('not a FIT file')),
  );
  expect(response.status()).toBe(400);
});

test('requires authentication', async ({ request }) => {
  const response = await request.post(`${API_URL}/activity-import/fit`, {
    multipart: {
      file: {
        name: 'run.fit',
        mimeType: 'application/octet-stream',
        buffer: FIT,
      },
      name: 'E2E run',
    },
  });
  expect(response.status()).toBe(401);
});

test('imports a GPX activity with the sport the athlete chose', async ({
  request,
}) => {
  const athlete = await createAthlete(request);
  const response = await request.post(
    `${API_URL}/activity-import/gpx`,
    upload(athlete.accessToken, 'run.gpx', GPX, { sport: 'TRAIL_RUNNING' }),
  );
  expect(response.status(), await response.text()).toBe(201);
  expect(await response.json()).toMatchObject({
    name: 'E2E run',
    startDate: '2024-05-02T07:00:00.000Z',
    alreadyImported: false,
    warnings: [],
  });
});

test('refuses a planned GPX route', async ({ request }) => {
  const athlete = await createAthlete(request);
  const route = Buffer.from(
    '<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><rte><rtept lat="43.36" lon="-8.41"/><rtept lat="43.37" lon="-8.41"/></rte></gpx>',
  );
  const response = await request.post(
    `${API_URL}/activity-import/gpx`,
    upload(athlete.accessToken, 'route.gpx', route),
  );
  expect(response.status()).toBe(400);
  expect((await response.json()).message).toBe('GPX_NO_TIME');
});
