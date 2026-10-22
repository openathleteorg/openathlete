// @vitest-environment jsdom
import { type HealthWorkoutRecord } from '@/utils/healthkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import workoutContract from '../../../../../libs/shared/test-fixtures/healthkit-workout-v1.json';
import {
  healthWorkoutBody,
  sendHealthWorkouts,
} from './healthkit-workout-import';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  payload: vi.fn(),
  token: '',
  server: 'https://train.example.org/api',
}));
vi.mock('axios', () => ({
  default: { create: () => ({ get: mocks.get, post: mocks.post }) },
}));
vi.mock('@/utils/auth', () => ({ isValidToken: () => true }));
vi.mock('@/utils/capacitor', () => ({ getApiBaseUrl: () => mocks.server }));
vi.mock('@/utils/local-storage', () => ({
  ACCESS_TOKEN: 'token',
  REFRESH_TOKEN: 'refresh',
  setItem: vi.fn(),
  getItem: () => mocks.token,
}));
vi.mock('@/utils/healthkit', () => ({
  localHealthKit: { workoutPayload: mocks.payload },
}));
const binding = {
  apiBaseURL: 'https://train.example.org/api',
  accountID: '42',
};
const source = {
  bundleIdentifier: 'test.watch',
  name: 'Watch',
  productType: 'Watch6,18',
};
const start = '2026-10-20T08:00:00.123Z',
  end = '2026-10-20T08:30:00.456Z';
function record(): HealthWorkoutRecord {
  return {
    uuid: '12345678-1234-4234-8234-123456789abc',
    revision: 42,
    sport: 'RUNNING',
    start,
    end,
    activeDuration: 1700.123,
    distanceMeters: 5000.25,
    energyKilojoules: 1000.567,
    source,
    channels: {},
    route: [],
    events: [],
  };
}
const options = () => ({
  binding,
  consent: true,
  uuids: [record().uuid],
  isCurrent: () => true,
  signal: new AbortController().signal,
});
const receipt = {
  receiptId: 1,
  revision: 42,
  status: 'enriched',
  eventActivityId: 1,
  eventId: 2,
  processing: 'queued',
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.token = `header.${btoa(JSON.stringify({ userId: 42 }))}.signature`;
  mocks.server = binding.apiBaseURL;
  mocks.get.mockResolvedValue({
    data: {
      healthkitWorkoutImport: {
        protocolVersion: 1,
        maxSamples: 100000,
        maxBodyBytes: 20000000,
      },
    },
  });
  mocks.post.mockResolvedValue({ data: receipt });
  mocks.payload.mockResolvedValue({ ...binding, workout: record() });
});
describe('HealthKit workout mapping', () => {
  it('produces the same protocol-v1 fixture consumed by the real backend HTTP tests', () => {
    const row = record();
    row.revision = workoutContract.revision;
    row.source = {
      bundleIdentifier: workoutContract.source.bundleIdentifier,
      name: workoutContract.source.name,
      version: workoutContract.source.version,
      productType: workoutContract.source.deviceType,
    };
    row.indoor = false;
    row.channels.heartrate = workoutContract.streams.heartrate.samples.map(
      (sample, index) => ({
        uuid: `synthetic-${index}`,
        start: sample.timestamp,
        value: sample.value,
        source: row.source,
      }),
    );
    row.route = workoutContract.streams.route.samples.map((sample, index) => ({
      date: sample.timestamp,
      latitude: sample.latitude,
      longitude: sample.longitude,
      altitude: workoutContract.streams.altitude.samples[index]!.value,
    }));
    row.events = [
      ...workoutContract.events.map((event) => ({
        type: event.type === 'PAUSE' ? 1 : 2,
        start: event.timestamp,
        end: event.timestamp,
      })),
      ...workoutContract.laps.map((lap) => ({
        type: 3,
        start: lap.startDate,
        end: lap.endDate,
      })),
    ];
    expect(healthWorkoutBody(row)).toEqual(workoutContract);
  });
  it('preserves units, elapsed vs active time and fractional timestamps', () => {
    const body = healthWorkoutBody(record());
    expect(body.startDate).toBe(start);
    expect(body.endDate).toBe(end);
    expect(body.elapsedDuration).toEqual({ value: 1800.333, unit: 's' });
    expect(body.activeDuration).toEqual({ value: 1700.123, unit: 's' });
    expect(body.distance).toEqual({ value: 5000.25, unit: 'm' });
    expect(body.energy).toEqual({ value: 1000.567, unit: 'kJ' });
    expect(body.streams).toEqual({});
  });
  it('orders real samples, prefers recording source and preserves gaps and negative altitude', () => {
    const row = record();
    const point = { uuid: 'b', start, value: 100.12, source };
    row.channels.heartrate = [
      {
        ...point,
        source: { ...source, bundleIdentifier: 'other' },
        value: 200,
      },
      point,
      { ...point, uuid: 'c', start: end, value: 101.34 },
    ];
    row.route = [{ date: end, latitude: 50, longitude: 8, altitude: -4 }];
    const body = healthWorkoutBody(row);
    expect(body.streams?.heartrate?.samples).toEqual([
      { timestamp: start, value: 100.12 },
      { timestamp: end, value: 101.34 },
    ]);
    expect(body.streams?.altitude?.samples).toEqual([
      { timestamp: end, value: -4 },
    ]);
  });
  it('normalizes duplicate pause events and rejects unsupported multisport parents', () => {
    const row = record();
    row.events = [
      { type: 1, start, end: start },
      { type: 5, start, end: start },
      { type: 2, start: end, end },
    ];
    expect(healthWorkoutBody(row).events).toEqual([
      { type: 'PAUSE', timestamp: start },
      { type: 'RESUME', timestamp: end },
    ]);
    row.sport = 'TRIATHLON';
    expect(() => healthWorkoutBody(row)).toThrow();
  });
});
describe('consented workout uploads', () => {
  it('exports nothing without consent or on older servers', async () => {
    await expect(
      sendHealthWorkouts({ ...options(), consent: false }),
    ).rejects.toThrow();
    expect(mocks.get).not.toHaveBeenCalled();
    mocks.get.mockResolvedValue({ data: {} });
    await expect(sendHealthWorkouts(options())).rejects.toThrow(
      'HEALTH_WORKOUT_API_UNAVAILABLE',
    );
    expect(mocks.payload).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it('pins the destination and token, and acknowledges enrichment', async () => {
    expect(await sendHealthWorkouts(options())).toEqual({
      created: 0,
      matched: 0,
      enriched: 1,
      unchanged: 0,
      needs_review: 0,
    });
    expect(mocks.post).toHaveBeenCalledWith(
      `${binding.apiBaseURL}/activity-import/healthkit`,
      healthWorkoutBody(record()),
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mocks.token}` },
      }),
    );
  });
  it('uses the native canonical body for the same revision in manual and automatic sync', async () => {
    const body = {
      ...healthWorkoutBody(record()),
      name: 'Native canonical workout',
    };
    mocks.payload.mockResolvedValue({ ...binding, workout: record(), body });
    await sendHealthWorkouts(options());
    expect(mocks.post.mock.calls[0]![1]).toEqual(body);
  });

  it('reports the exact failing stage and acknowledged count without retaining private errors', async () => {
    const second = {
      ...record(),
      uuid: '22345678-1234-4234-8234-123456789abc',
    };
    mocks.payload.mockResolvedValueOnce({ ...binding, workout: record() });
    mocks.payload.mockRejectedValueOnce({
      code: 'HEALTHKIT_LOCKED',
      message: 'private sample data',
    });
    const failure = await sendHealthWorkouts({
      ...options(),
      uuids: [record().uuid, second.uuid],
    }).catch((error) => error);
    expect(failure.confirmed).toBe(1);
    expect(failure.reference).toBe('preview/HEALTHKIT_LOCKED');
    expect(JSON.stringify(failure)).not.toContain('private sample data');
    expect(failure.cause).toBeUndefined();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });
  it('distinguishes invalid acknowledgements from server upload errors without leaking bodies', async () => {
    mocks.post.mockResolvedValueOnce({ data: null });
    const invalid = await sendHealthWorkouts(options()).catch((error) => error);
    expect(invalid.reference).toBe('receipt/HEALTH_IMPORT_INVALID_RESPONSE');
    expect(invalid.confirmed).toBe(0);
    mocks.post.mockRejectedValueOnce({
      response: { status: 409, data: 'private workout' },
      config: { headers: { Authorization: 'secret' } },
    });
    const conflict = await sendHealthWorkouts(options()).catch(
      (error) => error,
    );
    expect(conflict.reason).toBe('conflict');
    expect(conflict.reference).toBe('upload/409');
    expect(JSON.stringify(conflict)).not.toMatch(/private workout|secret/);
  });
  it('keeps identical UUID, revision and body after a lost acknowledgement', async () => {
    mocks.post.mockRejectedValueOnce(new Error('network'));
    await expect(sendHealthWorkouts(options())).rejects.toThrow();
    await sendHealthWorkouts(options());
    expect(mocks.post.mock.calls[0]![1]).toEqual(mocks.post.mock.calls[1]![1]);
  });
  it('stops before posting if the session changes during native export', async () => {
    mocks.payload.mockImplementation(async () => {
      mocks.server = 'https://other.example.org/api';
      return { ...binding, workout: record() };
    });
    await expect(sendHealthWorkouts(options())).rejects.toThrow(
      'HEALTH_IMPORT_SESSION_CHANGED',
    );
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it('rejects another account, unexpected native UUID and oversized data', async () => {
    mocks.token = `header.${btoa(JSON.stringify({ userId: 99 }))}.signature`;
    await expect(sendHealthWorkouts(options())).rejects.toThrow(
      'HEALTH_IMPORT_WRONG_ACCOUNT',
    );
    mocks.token = `header.${btoa(JSON.stringify({ userId: 42 }))}.signature`;
    mocks.payload.mockResolvedValue({
      ...binding,
      workout: { ...record(), uuid: 'other' },
    });
    await expect(sendHealthWorkouts(options())).rejects.toThrow();
    mocks.payload.mockResolvedValue({ ...binding, workout: record() });
    mocks.get.mockResolvedValue({
      data: {
        healthkitWorkoutImport: {
          protocolVersion: 1,
          maxSamples: 1,
          maxBodyBytes: 1,
        },
      },
    });
    await expect(sendHealthWorkouts(options())).rejects.toThrow(
      'HEALTH_WORKOUT_TOO_LARGE',
    );
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
