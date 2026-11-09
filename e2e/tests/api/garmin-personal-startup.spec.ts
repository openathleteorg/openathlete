import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

// Real API, database, auth and configuration; no Garmin key or network call.
// Run against the normal stack (off), then start the stack with
// E2E_GARMIN_PERSONAL_API_ENABLED=true and run this spec with the same variable.
test('Garmin Personal opt-in matches the booted API configuration', async ({
  request,
}) => {
  const enabled = process.env.E2E_GARMIN_PERSONAL_API_ENABLED === 'true';
  const instance = await request.get(`${API_URL}/instance`);
  expect(instance.ok()).toBe(true);
  expect((await instance.json()).garminPersonalApi).toBe(enabled);
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const status = await request.get(`${API_URL}/provider/garmin-personal`, {
    headers,
  });
  expect(status.status()).toBe(enabled ? 200 : 503);
  if (enabled) {
    expect(await status.json()).toMatchObject({
      connected: false,
      activeUntil: null,
      status: 'disconnected',
    });
    const today = new Date().toISOString().slice(0, 10);
    const sync = await request.post(
      `${API_URL}/provider/garmin-personal/sync`,
      {
        headers,
        data: { startDate: today, endDate: today },
      },
    );
    expect(sync.status()).toBe(400);
    // Also catches a missing queue injection: that would say PROVIDER_NOT_CONFIGURED.
    expect(await sync.json()).toMatchObject({ message: 'key_required' });
  } else {
    expect(await status.json()).toMatchObject({
      message: 'PROVIDER_NOT_CONFIGURED',
    });
  }
});
