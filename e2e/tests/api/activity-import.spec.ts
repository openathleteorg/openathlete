import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

// A synthetic 10-minute run recorded with the Garmin FIT SDK; no real data.
const FIT = readFileSync(
  path.join(import.meta.dirname, '../../fixtures/synthetic-run.fit'),
);

const upload = (accessToken: string, name: string, buffer: Buffer) =>
  ({
    headers: apiHeaders(undefined, accessToken),
    multipart: {
      file: { name, mimeType: 'application/octet-stream', buffer },
      name: 'E2E run',
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
