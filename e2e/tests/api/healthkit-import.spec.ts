import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

test('imports HealthKit daily summaries through the production API', async ({
  request,
}) => {
  const athlete = await createAthlete(request);
  const data = {
    source: 'APPLE_HEALTH',
    timeZone: 'Europe/Berlin',
    metrics: [
      { type: 'HRV_SDNN', date: '2026-10-19', value: 42, unit: 'ms' },
      { type: 'SLEEP_DURATION', date: '2026-10-19', value: 7.5, unit: 'h' },
    ],
  };
  const headers = apiHeaders(undefined, athlete.accessToken);
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await request.post(`${API_URL}/metric/import`, {
      headers,
      data,
    });
    expect(response.status(), await response.text()).toBe(201);
    expect(await response.json()).toEqual({ imported: 2, skipped: 0 });
  }
  const unauthorized = await request.post(`${API_URL}/metric/import`, { data });
  expect(unauthorized.status()).toBe(401);
});

test('queues a Watch workout once, replays its receipt and isolates ownership', async ({
  request,
}) => {
  const info = await request.get(`${API_URL}/instance`);
  expect((await info.json()).healthkitWorkoutImport).toMatchObject({
    protocolVersion: 1,
  });
  const athlete = await createAthlete(request);
  const other = await createAthlete(request);
  const data = {
    ...JSON.parse(
      readFileSync(
        new URL(
          '../../../libs/shared/test-fixtures/healthkit-workout-v1.json',
          import.meta.url,
        ),
        'utf8',
      ),
    ),
    workoutUuid: randomUUID(),
  };
  const headers = apiHeaders(undefined, athlete.accessToken);
  const first = await request.post(`${API_URL}/activity-import/healthkit`, {
    headers,
    data,
  });
  expect(first.status(), await first.text()).toBe(201);
  const receipt = await first.json();
  expect(receipt).toMatchObject({
    status: 'created',
    processing: 'queued',
    revision: data.revision,
  });
  const retry = await request.post(`${API_URL}/activity-import/healthkit`, {
    headers,
    data,
  });
  expect(retry.status(), await retry.text()).toBe(201);
  expect(await retry.json()).toMatchObject({
    status: 'unchanged',
    receiptId: receipt.receiptId,
    eventActivityId: receipt.eventActivityId,
    processing: 'not_required',
  });
  const status = await request.get(
    `${API_URL}/activity-import/healthkit/receipts/${receipt.receiptId}`,
    { headers },
  );
  expect(status.status()).toBe(200);
  expect(await status.json()).toMatchObject({
    status: 'accepted',
    eventActivityId: receipt.eventActivityId,
  });
  const forbidden = await request.get(
    `${API_URL}/activity-import/healthkit/receipts/${receipt.receiptId}`,
    {
      headers: apiHeaders(undefined, other.accessToken),
    },
  );
  expect(forbidden.status()).toBe(404);
  const conflict = await request.post(`${API_URL}/activity-import/healthkit`, {
    headers,
    data: { ...data, name: 'Changed without a revision' },
  });
  expect(conflict.status()).toBe(409);
});
