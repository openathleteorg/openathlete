// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { syncApprovedHealth } from './healthkit-manual-sync';

const mock = vi.hoisted(() => ({
  begin: vi.fn(),
  end: vi.fn(),
  overview: vi.fn(),
  read: vi.fn(),
  workouts: vi.fn(),
  sendWorkouts: vi.fn(),
  sendMetrics: vi.fn(),
  server: 'https://train.example.org/api',
}));
vi.mock('@/utils/capacitor', () => ({ getApiBaseUrl: () => mock.server }));
vi.mock('@/utils/healthkit', () => ({
  localHealthKit: {
    beginManualSync: mock.begin,
    endManualSync: mock.end,
    syncOverview: mock.overview,
    read: mock.read,
    readWorkouts: mock.workouts,
  },
}));
vi.mock('@/api/activity/healthkit-workout-import', () => ({
  sendHealthWorkouts: mock.sendWorkouts,
}));
vi.mock('@/api/metric/health-metric-import', () => ({
  sendHealthSummaries: mock.sendMetrics,
}));
const selection = {
  historyDays: 30,
  includeSensors: true,
  includeRoute: false,
};
const overview = () => ({
  busy: false,
  workouts: { selection, read: true, upload: true, automatic: false },
  measurements: {
    read: true,
    upload: true,
    automatic: false,
    selection: {
      historyDays: 30,
      types: ['heartRateVariabilitySDNN', 'sleepAnalysis'],
      timeZone: 'UTC',
    },
  },
});
const options = () => ({
  binding: { apiBaseURL: mock.server, accountID: '42' },
  kind: 'workouts' as const,
  isCurrent: () => true,
  signal: new AbortController().signal,
});
beforeEach(() => {
  vi.resetAllMocks();
  mock.begin.mockResolvedValue({ lease: 'test-lease' });
  mock.end.mockResolvedValue({});
  mock.server = 'https://train.example.org/api';
  mock.overview.mockImplementation(async () => overview());
  mock.workouts.mockResolvedValue({
    hasMore: false,
    workouts: [{ uuid: 'recording' }],
  });
  mock.read.mockResolvedValue({ hasMore: false, summaryCount: 2 });
  mock.sendWorkouts.mockResolvedValue({ created: 1, unchanged: 2 });
  mock.sendMetrics.mockResolvedValue({ imported: 2, skipped: 0 });
});
describe('dashboard sync of approved health data', () => {
  it('uses saved permissions without granting anything and completes workout paging before upload', async () => {
    mock.workouts.mockResolvedValueOnce({ hasMore: true, workouts: [] });
    expect(await syncApprovedHealth(options())).toEqual({
      count: 3,
      complete: true,
    });
    expect(mock.workouts).toHaveBeenCalledTimes(2);
    expect(mock.workouts).toHaveBeenLastCalledWith(
      expect.objectContaining({ ...selection, localConsent: true }),
    );
    expect(mock.sendWorkouts).toHaveBeenCalledWith(
      expect.objectContaining({
        binding: options().binding,
        uuids: ['recording'],
        consent: true,
      }),
    );
    expect(mock.overview).toHaveBeenCalledWith(options().binding);
  });
  it('never reads or uploads when either permission is missing, or native sync is busy', async () => {
    mock.overview.mockResolvedValue({
      ...overview(),
      workouts: { ...overview().workouts, upload: false },
    });
    await expect(syncApprovedHealth(options())).rejects.toThrow(
      'HEALTH_IMPORT_NOT_AUTHORIZED',
    );
    mock.overview.mockResolvedValue({ ...overview(), busy: true });
    await expect(syncApprovedHealth(options())).rejects.toThrow(
      'HEALTH_SYNC_BUSY',
    );
    expect(mock.workouts).not.toHaveBeenCalled();
    expect(mock.sendWorkouts).not.toHaveBeenCalled();
  });
  it('does not upload if consent or the selected scope changes during reading', async () => {
    mock.workouts.mockImplementation(async () => {
      mock.overview.mockResolvedValue({
        ...overview(),
        workouts: {
          ...overview().workouts,
          selection: { ...selection, includeRoute: true },
        },
      });
      return { hasMore: false, workouts: [{ uuid: 'recording' }] };
    });
    await expect(syncApprovedHealth(options())).rejects.toThrow(
      'HEALTH_IMPORT_NOT_AUTHORIZED',
    );
    expect(mock.sendWorkouts).not.toHaveBeenCalled();
  });
  it('waits for complete daily data and skips uploading an empty preview', async () => {
    mock.read.mockResolvedValueOnce({ hasMore: true, summaryCount: 1 });
    expect(
      await syncApprovedHealth({ ...options(), kind: 'measurements' }),
    ).toEqual({ count: 2, complete: true });
    expect(mock.read).toHaveBeenCalledTimes(2);
    mock.sendMetrics.mockClear();
    mock.read.mockResolvedValue({ hasMore: false, summaryCount: 0 });
    expect(
      await syncApprovedHealth({ ...options(), kind: 'measurements' }),
    ).toEqual({ count: 0, complete: true });
    expect(mock.sendMetrics).not.toHaveBeenCalled();
  });
  it('stops before upload after navigation, server change or cancellation', async () => {
    mock.workouts.mockImplementation(async () => {
      mock.server = 'https://other.example.org/api';
      return { hasMore: false, workouts: [{ uuid: 'recording' }] };
    });
    await expect(syncApprovedHealth(options())).rejects.toThrow(
      'HEALTH_IMPORT_SESSION_CHANGED',
    );
    expect(mock.sendWorkouts).not.toHaveBeenCalled();
    expect(mock.end).toHaveBeenCalledWith(
      expect.objectContaining({ lease: 'test-lease' }),
    );
  });
});
