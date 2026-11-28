import { expect, test } from '@playwright/test';

import { importRecentRun } from '../../support/activities';
import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

// Yesterday asks the forecast API, ten days ago the archive: both come from
// the fake-open-meteo service, which has 15 °C, 60 % and 10 km/h every hour
for (const daysAgo of [1, 10]) {
  test(`the worker adds weather to a run from ${daysAgo} days ago`, async ({
    request,
  }) => {
    const athlete = await createAthlete(request);
    const headers = apiHeaders(undefined, athlete.accessToken);
    const { eventId } = await importRecentRun(
      request,
      athlete,
      'RUNNING',
      daysAgo,
      30,
    );

    await expect
      .poll(
        async () =>
          (
            await request.get(`${API_URL}/event/${eventId}/weather`, {
              headers,
            })
          ).json(),
        { timeout: 30_000 },
      )
      .toMatchObject({
        provider: 'openmeteo',
        samples: expect.arrayContaining([
          expect.objectContaining({
            temperatureC: 15,
            humidityPct: 60,
            windSpeed10mKmh: 10,
            isDay: true,
          }),
        ]),
      });
  });
}
