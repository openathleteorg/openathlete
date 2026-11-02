import { type APIRequestContext, expect } from '@playwright/test';

import { type TestAthlete, apiHeaders } from './api';
import { API_URL } from './env';

/**
 * Imports a straight GPX track of `minutes`, `daysAgo` days ago, at 3 m/s,
 * one point a minute.
 */
export async function importRecentRun(
  request: APIRequestContext,
  athlete: TestAthlete,
  sport: string,
  daysAgo: number,
  minutes: number,
) {
  const start = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
  start.setUTCHours(7, 0, 0, 0);
  const points = Array.from({ length: minutes + 1 }, (_, i) => {
    const time = new Date(start.getTime() + i * 60_000).toISOString();
    // 180 m a minute, northward
    return `<trkpt lat="${(45 + (i * 180) / 111_195).toFixed(6)}" lon="5.000000"><time>${time}</time></trkpt>`;
  }).join('');
  const gpx = `<?xml version="1.0"?><gpx version="1.1" creator="openathlete-e2e" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${sport}</name><trkseg>${points}</trkseg></trk></gpx>`;
  const post = () =>
    request.post(`${API_URL}/activity-import/gpx`, {
      headers: apiHeaders(undefined, athlete.accessToken),
      multipart: {
        file: {
          name: `${sport}-${daysAgo}.gpx`,
          mimeType: 'application/gpx+xml',
          buffer: Buffer.from(gpx),
        },
        name: `${sport} session`,
        sport,
      },
    });
  // Imports run in serializable transactions: parallel tests can collide
  let response = await post();
  for (let attempt = 0; response.status() === 409 && attempt < 5; attempt++) {
    response = await post();
  }
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as { eventId: number; name: string };
}
