// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendHealthSummaries } from './health-metric-import';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  summaries: vi.fn(),
  token: '',
  server: 'https://train.example.org/api',
}));
vi.mock('axios', () => ({ default: { create: () => ({ post: mocks.post }) } }));
vi.mock('@/utils/axios', () => ({
  routes: { metric: { importHealthMetrics: '/metric/import' } },
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
  localHealthKit: { summaries: mocks.summaries },
}));

const binding = {
  apiBaseURL: 'https://train.example.org/api',
  accountID: '42',
};
const metric = {
  type: 'HRV_SDNN',
  unit: 'ms',
  date: '2026-01-01',
  value: 42.12345,
  sampleCount: 12,
};
const tokenFor = (userId: number) =>
  `header.${btoa(JSON.stringify({ userId }))}.signature`;
const snapshot = (metrics: unknown[] = [metric]) => ({
  ...binding,
  timeZone: 'Europe/Berlin',
  metrics,
});
const options = () => ({
  binding,
  consent: true,
  isCurrent: () => true,
  signal: new AbortController().signal,
});

describe('manual Apple Health daily-summary import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token = tokenFor(42);
    mocks.server = binding.apiBaseURL;
    mocks.summaries.mockResolvedValue(snapshot());
    mocks.post.mockImplementation((_url, body) =>
      Promise.resolve({ data: { imported: body.metrics.length, skipped: 0 } }),
    );
  });

  it('requires separate explicit consent before even exporting local summaries', async () => {
    await expect(
      sendHealthSummaries({ ...options(), consent: false }),
    ).rejects.toThrow();
    expect(mocks.summaries).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it.each([
    { type: 'WEIGHT', unit: 'kg', value: 72.125 },
    { type: 'BODY_FAT', unit: '%', value: 22.25 },
  ])(
    'sends $type in its canonical unit without changing precision',
    async (entry) => {
      const row = { ...metric, ...entry };
      mocks.summaries.mockResolvedValue(snapshot([row]));
      await sendHealthSummaries(options());
      expect(mocks.post.mock.calls[0]![1].metrics).toEqual([row]);
    },
  );

  it('posts the exact API contract with SDNN precision and the pinned token/server', async () => {
    await expect(sendHealthSummaries(options())).resolves.toEqual({
      imported: 1,
      skipped: 0,
    });
    expect(mocks.post).toHaveBeenCalledWith(
      'https://train.example.org/api/metric/import',
      { source: 'APPLE_HEALTH', timeZone: 'Europe/Berlin', metrics: [metric] },
      expect.objectContaining({
        headers: { Authorization: `Bearer ${tokenFor(42)}` },
      }),
    );
  });

  it('refuses another account token or a snapshot from another server', async () => {
    mocks.token = tokenFor(43);
    await expect(sendHealthSummaries(options())).rejects.toThrow();
    mocks.token = tokenFor(42);
    mocks.summaries.mockResolvedValue({
      ...snapshot(),
      apiBaseURL: 'https://another.example/api',
    });
    await expect(sendHealthSummaries(options())).rejects.toThrow();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('rejects invalid units and duplicate rows without any HTTP request', async () => {
    mocks.summaries.mockResolvedValue(snapshot([{ ...metric, unit: 's' }]));
    await expect(sendHealthSummaries(options())).rejects.toThrow();
    mocks.summaries.mockResolvedValue(snapshot([metric, metric]));
    await expect(sendHealthSummaries(options())).rejects.toThrow();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('splits a full history into batches of at most 500 rows', async () => {
    const metrics = Array.from({ length: 501 }, (_, index) => ({
      ...metric,
      date: new Date(Date.UTC(2024, 0, index + 1)).toISOString().slice(0, 10),
    }));
    mocks.summaries.mockResolvedValue(snapshot(metrics));
    await expect(sendHealthSummaries(options())).resolves.toEqual({
      imported: 501,
      skipped: 0,
    });
    expect(mocks.post.mock.calls.map((call) => call[1].metrics.length)).toEqual(
      [500, 1],
    );
  });

  it('stops before posting if the session changes while native storage is read', async () => {
    let current = true;
    mocks.summaries.mockImplementation(async () => {
      current = false;
      return snapshot();
    });
    await expect(
      sendHealthSummaries({ ...options(), isCurrent: () => current }),
    ).rejects.toThrow();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('does not retry a failed POST automatically or delete server data', async () => {
    mocks.post.mockRejectedValue(new Error('offline'));
    await expect(sendHealthSummaries(options())).rejects.toThrow();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });

  it('does not start the next batch after logout or a server switch', async () => {
    const metrics = Array.from({ length: 501 }, (_, index) => ({
      ...metric,
      date: new Date(Date.UTC(2024, 0, index + 1)).toISOString().slice(0, 10),
    }));
    mocks.summaries.mockResolvedValue(snapshot(metrics));
    mocks.post.mockImplementation(async () => {
      mocks.server = 'https://another.example/api';
      return { data: { imported: 500, skipped: 0 } };
    });
    await expect(sendHealthSummaries(options())).rejects.toThrow();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });
});
