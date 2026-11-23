import { OpenMeteoWeatherProvider } from './openmeteo.provider';

class InstantRetryProvider extends OpenMeteoWeatherProvider {
  protected retryDelayMs = 0;
}

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

  const samples = await new InstantRetryProvider().fetchSamples({
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
  const samples = await new InstantRetryProvider().fetchSamples({
    startDate,
    points: [{ lat: 45, lon: 6, distM: 0, timeSec: 0 }],
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(samples[0].temperatureC).toBe(10);
});

it('gives up on a request Open-Meteo refuses', async () => {
  fetchMock.mockResolvedValue(answer(400));
  await expect(
    new InstantRetryProvider().fetchSamples({
      startDate,
      points: [{ lat: 45, lon: 6, distM: 0, timeSec: 0 }],
    }),
  ).rejects.toThrow('HTTP 400');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
