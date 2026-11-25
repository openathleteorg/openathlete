// @vitest-environment jsdom
import { QueryClient } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useWatchScheduleSync } from './use-watch-schedule-sync';

const state = vi.hoisted(() => ({
  available: true,
  authenticated: true,
  sessionEpoch: 0,
  exitLatched: false,
  resolveCredential: null as ((value: unknown) => void) | null,
  resolveSecondStatus: null as ((value: unknown) => void) | null,
  status: {
    enabled: true,
    hasOtherAccountOptIn: false,
    permission: 'authorized',
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastErrorCode: null,
    counts: {
      scheduled: 0,
      confirmed: 0,
      unchanged: 0,
      replaced: 0,
      removed: 0,
      completed: 0,
      retained: 0,
      overflow: 0,
      failed: 0,
    },
    skipped: [],
    pendingCleanupEventIDs: [],
    unresolvedEventIDs: [],
    localPendingEventIDs: [],
    otherAccountPending: false,
    cleanupPending: false,
    cleanupUnknown: false,
  },
  getStatus: vi.fn(),
  refresh: vi.fn(),
  disconnect: vi.fn(),
  recover: vi.fn(),
  credential: vi.fn(),
  scope: vi.fn(),
  appStateHandler: null as ((state: { isActive: boolean }) => void) | null,
  removeListener: vi.fn(),
}));

const cache = vi.hoisted(() => ({ client: null as QueryClient | null }));

vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({ authenticated: state.authenticated }),
}));
vi.mock('@/api/athlete', () => ({
  useGetMyAthleteQuery: () => ({ data: { athleteId: 7 } }),
}));
vi.mock('@/utils/query-client', () => ({
  get queryClient() {
    return cache.client;
  },
}));
vi.mock('@/utils/watch-schedule', () => ({
  isAppleWatchScheduleAvailable: () => state.available,
  hasFenceUnconfirmed: () => false,
  clearFenceUnconfirmed: vi.fn(),
  fenceWatchScheduleOnExit: vi.fn().mockResolvedValue(true),
  watchScheduleSessionEpoch: () => state.sessionEpoch,
  isWatchScheduleExitLatched: () => state.exitLatched,
  isWatchScheduleSessionCurrent: (epoch: number) =>
    !state.exitLatched && epoch === state.sessionEpoch,
  recoverWatchScheduleCleanup: state.recover,
  getWatchScheduleStatus: state.getStatus,
  refreshWatchSchedule: state.refresh,
  disconnectWatchSchedule: state.disconnect,
  watchScheduleCredential: state.credential,
  watchScheduleScope: state.scope,
}));
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (
      name: string,
      handler: (state: { isActive: boolean }) => void,
    ) => {
      if (name === 'appStateChange') state.appStateHandler = handler;
      return Promise.resolve({ remove: state.removeListener });
    },
  },
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const scope = { instanceURL: 'https://train.example.org/api', athleteId: 7 };
const credential = {
  accessToken: 'access-token',
  expiresAt: '2026-11-25T12:00:00.000Z',
};

function Probe() {
  useWatchScheduleSync();
  return null;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Apple Watch sync lifecycle', () => {
  let element: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  const render = async () => {
    await act(async () => root.render(<Probe />));
    await flush();
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    state.available = true;
    state.authenticated = true;
    state.appStateHandler = null;
    cache.client = new QueryClient();
    state.getStatus.mockReset();
    state.refresh.mockReset();
    state.disconnect.mockReset();
    state.recover.mockReset();
    state.recover.mockResolvedValue(true);
    state.sessionEpoch = 0;
    state.exitLatched = false;
    state.resolveCredential = null;
    state.resolveSecondStatus = null;
    state.credential.mockReset();
    state.scope.mockReset();
    state.getStatus.mockResolvedValue(state.status);
    state.refresh.mockResolvedValue({
      outcome: 'synced',
      deferral: null,
      code: null,
      status: state.status,
    });
    state.disconnect.mockResolvedValue(null);
    state.credential.mockResolvedValue(credential);
    state.scope.mockReturnValue(scope);
    element = document.createElement('div');
    document.body.appendChild(element);
    root = createRoot(element);
  });

  afterEach(() => {
    act(() => root.unmount());
    element.remove();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('refreshes on launch when this account is enabled', async () => {
    await render();

    expect(state.getStatus).toHaveBeenCalledWith(scope);
    expect(state.refresh).toHaveBeenCalledWith(scope, credential, 'launch');
  });

  it('does not refresh on launch before the athlete opts in', async () => {
    state.getStatus.mockResolvedValue({ ...state.status, enabled: false });

    await render();

    expect(state.refresh).not.toHaveBeenCalled();
  });

  it('recovers a previous account opt-in without disconnecting this one', async () => {
    state.getStatus
      .mockResolvedValueOnce({ ...state.status, hasOtherAccountOptIn: true })
      .mockResolvedValue({ ...state.status });

    await render();

    expect(state.recover).toHaveBeenCalledWith(scope);
    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.refresh).toHaveBeenCalledWith(scope, credential, 'launch');
  });

  it('recovers authorized teardown while keeping the current opt-in', async () => {
    state.getStatus
      .mockResolvedValueOnce({
        ...state.status,
        cleanupPending: true,
        otherAccountPending: true,
      })
      .mockResolvedValue({ ...state.status });

    await render();

    expect(state.recover).toHaveBeenCalledWith(scope);
    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.refresh).toHaveBeenCalledWith(scope, credential, 'launch');
  });

  it('lets unknown cleanup dominate other pending flags', async () => {
    state.getStatus.mockResolvedValue({
      ...state.status,
      cleanupUnknown: true,
      cleanupPending: true,
      hasOtherAccountOptIn: true,
      otherAccountPending: true,
    });

    await render();

    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.recover).not.toHaveBeenCalled();
    expect(state.refresh).not.toHaveBeenCalled();
  });

  it('drops a second status read that resolves after logout', async () => {
    state.getStatus
      .mockResolvedValueOnce({ ...state.status, hasOtherAccountOptIn: true })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            state.resolveSecondStatus = resolve;
          }),
      );

    await render();
    state.sessionEpoch += 1;
    state.exitLatched = true;
    state.resolveSecondStatus?.(state.status);
    await flush();

    expect(state.refresh).not.toHaveBeenCalled();
  });

  it('starts nothing while a logout is latched', async () => {
    state.exitLatched = true;
    state.sessionEpoch = 1;

    await render();

    expect(state.getStatus).not.toHaveBeenCalled();
    expect(state.refresh).not.toHaveBeenCalled();
  });

  it('retries a durable cleanup without an unscoped disconnect', async () => {
    state.getStatus
      .mockResolvedValueOnce({ ...state.status, cleanupPending: true })
      .mockResolvedValue({ ...state.status, enabled: false });

    await render();

    expect(state.recover).toHaveBeenCalledTimes(1);
    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.refresh).not.toHaveBeenCalled();
  });

  it('pauses on unknown cleanup instead of acting on it', async () => {
    state.getStatus.mockResolvedValue({
      ...state.status,
      cleanupUnknown: true,
    });

    await render();

    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.recover).not.toHaveBeenCalled();
    expect(state.refresh).not.toHaveBeenCalled();
  });

  it('drops a launch refresh when logout happens while the token loads', async () => {
    state.credential.mockImplementation(
      () =>
        new Promise((resolve) => {
          state.resolveCredential = resolve;
        }),
    );

    await act(async () => root.render(<Probe />));
    await flush();
    state.sessionEpoch += 1;
    state.resolveCredential?.(credential);
    await flush();

    expect(state.refresh).not.toHaveBeenCalled();
  });

  it('does nothing at all without the native bridge', async () => {
    state.available = false;

    await render();

    expect(state.getStatus).not.toHaveBeenCalled();
    expect(state.refresh).not.toHaveBeenCalled();
  });

  it('refreshes on resume when the app becomes active', async () => {
    await render();
    state.refresh.mockClear();

    await act(async () => {
      state.appStateHandler?.({ isActive: true });
    });
    await flush();

    expect(state.refresh).toHaveBeenCalledWith(scope, credential, 'resume');
  });

  it('refreshes once for an own-calendar invalidation burst', async () => {
    await render();
    state.refresh.mockClear();

    await act(async () => {
      cache.client!.setQueryData(['EventAPI.getEvent', 1], {});
      await cache.client!.invalidateQueries({
        queryKey: ['EventAPI.getEvent'],
      });
      await cache.client!.invalidateQueries({
        queryKey: ['EventAPI.getMyEvents'],
      });
      await vi.advanceTimersByTimeAsync(1600);
    });
    await flush();

    expect(state.refresh).toHaveBeenCalledTimes(1);
    expect(state.refresh).toHaveBeenCalledWith(scope, credential, 'calendar');
  });

  it('refreshes for own training-zone invalidations', async () => {
    await render();
    state.refresh.mockClear();

    await act(async () => {
      cache.client!.setQueryData(['TrainingZoneAPI.getAllForAthlete', 7], []);
      await cache.client!.invalidateQueries({
        queryKey: ['TrainingZoneAPI.getAllForAthlete', 7],
      });
      await vi.advanceTimersByTimeAsync(1600);
    });
    await flush();

    expect(state.refresh).toHaveBeenCalledWith(scope, credential, 'zones');
  });

  it('ignores unrelated invalidations', async () => {
    await render();
    state.refresh.mockClear();

    await act(async () => {
      await cache.client!.invalidateQueries({ queryKey: ['UserAPI.getMe'] });
      await vi.advanceTimersByTimeAsync(1600);
    });
    await flush();

    expect(state.refresh).not.toHaveBeenCalled();
  });
});
