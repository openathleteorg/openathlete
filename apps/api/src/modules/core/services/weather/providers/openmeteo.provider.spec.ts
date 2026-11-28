import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { OpenMeteoWeatherProvider } from './openmeteo.provider';

class InstantRetryProvider extends OpenMeteoWeatherProvider {
  protected retryDelayMs = 0;
  protected timeoutMs = 50;
}

const configWith = (env: Partial<ApiEnvSchemaType> = {}) =>
  ({
    get: (key: keyof ApiEnvSchemaType) => env[key],
  }) as unknown as ConfigService<ApiEnvSchemaType, true>;

const provider = (env?: Partial<ApiEnvSchemaType>) =>
  new InstantRetryProvider(configWith(env));

const answer = (status: number) =>
  ({
    ok: status === 200,
    status,
    json: async () => ({
      hourly: {
        time: ['2020-01-01T10:00', '2020-01-01T11:00'],
        temperature_2m: [10, 12],
      },
    }),
  }) as Response;

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

const startDate = new Date('2020-01-01T10:00:00Z');

it('asks once per grid cell and day, however many points fall in it', async () => {
  fetchMock.mockResolvedValue(answer(200));
  // A 3 km loop sampled every 500 m, then a point 20 km away
  const loop = [0, 1, 2, 3, 4, 5, 6].map((k) => ({
    lat: 45.0 + (k % 4) * 0.002,
    lon: 6.0 + (k % 4) * 0.002,
    distM: k * 500,
    timeSec: k * 300,
  }));
  const far = { lat: 45.2, lon: 6.0, distM: 20000, timeSec: 2400 };

  const samples = await provider().fetchSamples({
    startDate,
    points: [...loop, far],
  });

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(samples).toHaveLength(8);
  // Each sample keeps its own position and is interpolated at its own time
  expect(samples[1].lat).toBe(45.002);
  expect(samples[1].temperatureC).toBeCloseTo(10 + 2 * (300 / 3600));
  expect(samples[7]).toMatchObject({ lat: 45.2, lon: 6.0 });
});

it('tries again once when Open-Meteo is unavailable', async () => {
  fetchMock
    .mockResolvedValueOnce(answer(503))
    .mockResolvedValueOnce(answer(200));
  const samples = await provider().fetchSamples({
    startDate,
    points: [{ lat: 45, lon: 6, distM: 0, timeSec: 0 }],
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(samples[0].temperatureC).toBe(10);
});

it('gives up on a request Open-Meteo refuses', async () => {
  fetchMock.mockResolvedValue(answer(400));
  await expect(
    provider().fetchSamples({
      startDate,
      points: [{ lat: 45, lon: 6, distM: 0, timeSec: 0 }],
    }),
  ).rejects.toThrow('HTTP 400');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

const onePoint = {
  startDate,
  points: [{ lat: 45, lon: 6, distM: 0, timeSec: 0 }],
};

it('gives up without retrying when Open-Meteo does not answer in time', async () => {
  fetchMock.mockImplementation(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) =>
        init.signal?.addEventListener('abort', () =>
          reject(init.signal?.reason),
        ),
      ),
  );
  await expect(provider().fetchSamples(onePoint)).rejects.toThrow(
    'Open-Meteo timed out after 50ms',
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('treats an answer that is not JSON as a failure, without retrying', async () => {
  fetchMock.mockResolvedValue(
    new Response('Unexpected error', { status: 200 }),
  );
  await expect(provider().fetchSamples(onePoint)).rejects.toThrow(
    'Open-Meteo returned a non-JSON body',
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('gives up without retrying when Open-Meteo cannot be reached', async () => {
  fetchMock.mockRejectedValue(new TypeError('fetch failed'));
  await expect(provider().fetchSamples(onePoint)).rejects.toThrow(
    'Open-Meteo request failed: fetch failed',
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('sends forecast and archive requests to OPEN_METEO_BASE_URL when set', async () => {
  fetchMock.mockResolvedValue(answer(200));
  const custom = provider({
    OPEN_METEO_BASE_URL: 'http://weather.local:8080/',
  });
  await custom.fetchSamples({ ...onePoint, startDate: new Date() });
  await custom.fetchSamples(onePoint);
  const urls = fetchMock.mock.calls.map(([url]: [string]) => new URL(url));
  expect(urls.map((u) => u.origin + u.pathname)).toEqual([
    'http://weather.local:8080/v1/forecast',
    'http://weather.local:8080/v1/archive',
  ]);
});

it('uses the public Open-Meteo hosts by default', async () => {
  fetchMock.mockResolvedValue(answer(200));
  const standard = provider();
  await standard.fetchSamples({ ...onePoint, startDate: new Date() });
  await standard.fetchSamples(onePoint);
  const urls = fetchMock.mock.calls.map(([url]: [string]) => new URL(url));
  expect(urls.map((u) => u.origin + u.pathname)).toEqual([
    'https://api.open-meteo.com/v1/forecast',
    'https://archive-api.open-meteo.com/v1/archive',
  ]);
});
