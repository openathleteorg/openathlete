import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

test('an activity is logged by hand with its duration, distance and elevation', async ({
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const start = new Date('2026-10-05T17:00:00Z');
  const activity = (data: object) =>
    request.post(`${API_URL}/event`, {
      headers,
      data: {
        type: 'ACTIVITY',
        name: 'Pool swim',
        sport: 'SWIMMING',
        startDate: start.toISOString(),
        endDate: new Date(start.getTime() + 2700_000).toISOString(),
        ...data,
      },
    });

  const created = await activity({ distance: 2000, rpe: 0.5 });
  expect(created.status(), await created.text()).toBe(201);
  expect(await created.json()).toMatchObject({
    type: 'ACTIVITY',
    name: 'Pool swim',
    sport: 'SWIMMING',
    movingTime: 2700,
    distance: 2000,
    elevationGain: 0,
    rpe: 0.5,
  });

  // Not the 500 it used to be
  const backwards = await activity({
    endDate: new Date(start.getTime() - 60_000).toISOString(),
  });
  expect(backwards.status()).toBe(400);
  const foreignEquipment = await activity({ equipmentId: 999_999 });
  expect(foreignEquipment.status()).toBe(400);
});
