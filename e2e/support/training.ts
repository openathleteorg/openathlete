import { type APIRequestContext, expect } from '@playwright/test';

import { type TestAthlete, apiHeaders } from './api';
import { API_URL } from './env';

export interface Session {
  sport: string;
  daysAgo: number;
  minutes: number;
  /** m/s */
  speed: number;
  /** Heart rate at each minute */
  heartrate: (minute: number) => number;
  watts?: (minute: number) => number;
  /** Metres climbed per minute */
  climb?: number;
  name?: string;
}

/**
 * Maximum and resting heart rate, for the load. Zones are the ones every
 * athlete starts with: Z1 to 131, Z2 to 142, Z3 to 152, Z4 to 163, then Z5.
 */
export async function setHeartRateProfile(
  request: APIRequestContext,
  athlete: TestAthlete,
) {
  for (const [type, value] of [
    ['HR_MAX', 190],
    ['HR_REST', 50],
  ] as const) {
    const response = await request.post(`${API_URL}/metric`, {
      headers: apiHeaders(undefined, athlete.accessToken),
      data: { type, value, date: new Date().toISOString() },
    });
    expect(response.status(), await response.text()).toBe(201);
  }
}

/** Imports a GPX of a session with its sensors, one point a minute. */
export async function importSession(
  request: APIRequestContext,
  athlete: TestAthlete,
  session: Session,
) {
  const { sport, daysAgo, minutes, speed, heartrate, watts } = session;
  const start = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
  start.setUTCHours(7, 0, 0, 0);
  // Two identical files would be taken for the same activity
  const lon = (5 + Math.random()).toFixed(6);
  const points = Array.from({ length: minutes + 1 }, (_, i) => {
    const time = new Date(start.getTime() + i * 60_000).toISOString();
    const lat = 45 + (i * speed * 60) / 111_195;
    const sensors = [
      `<hr>${Math.round(heartrate(i))}</hr>`,
      watts ? `<power>${Math.round(watts(i))}</power>` : '',
    ].join('');
    return `<trkpt lat="${lat.toFixed(6)}" lon="${lon}"><ele>${500 + i * (session.climb ?? 0)}</ele><time>${time}</time><extensions>${sensors}</extensions></trkpt>`;
  }).join('');
  const gpx = `<?xml version="1.0"?><gpx version="1.1" creator="openathlete-e2e" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${sport}</name><trkseg>${points}</trkseg></trk></gpx>`;
  // Imports run in serializable transactions: parallel tests can collide
  await expect
    .poll(
      async () => {
        const response = await request.post(`${API_URL}/activity-import/gpx`, {
          headers: apiHeaders(undefined, athlete.accessToken),
          multipart: {
            file: {
              name: `${sport}-${daysAgo}.gpx`,
              mimeType: 'application/gpx+xml',
              buffer: Buffer.from(gpx),
            },
            name: session.name ?? `${sport} session`,
            sport,
          },
        });
        return response.status();
      },
      { timeout: 20_000 },
    )
    .toBe(201);
}

/** Waits for the worker: statistics show what the pipeline stored. */
export async function waitForIntensity(
  request: APIRequestContext,
  athlete: TestAthlete,
  athleteId: number,
) {
  const from = new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString();
  const to = new Date().toISOString();
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `${API_URL}/statistics/intensity?athleteId=${athleteId}&from=${from}&to=${to}`,
          { headers: apiHeaders(undefined, athlete.accessToken) },
        );
        const { buckets } = (await response.json()) as {
          buckets: { low: number; middle: number; high: number }[];
        };
        return buckets.some((b) => b.low + b.middle + b.high > 0);
      },
      { timeout: 30_000 },
    )
    .toBe(true);
}
