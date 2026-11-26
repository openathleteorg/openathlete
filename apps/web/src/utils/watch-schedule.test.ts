// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  ios: true,
  getAccessToken: vi.fn(),
  fence: vi.fn(),
  disconnect: vi.fn(),
  recover: vi.fn(),
  status: vi.fn(),
}));

vi.mock('@/utils/capacitor', () => ({
  isIOS: () => state.ios,
  getApiBaseUrl: () => 'https://train.example.org/api',
}));
vi.mock('@/utils/auth', () => ({
  getAccessToken: state.getAccessToken,
}));
vi.mock('@capacitor/core', () => ({
  registerPlugin: () => ({
    fence: state.fence,
    disconnect: state.disconnect,
    recover: state.recover,
    status: state.status,
    connect: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const {
  clearFenceUnconfirmed,
  disconnectWatchSchedule,
  disconnectWatchScheduleOnExit,
  establishWatchScheduleSession,
  fenceWatchScheduleOnExit,
  forgetWatchScheduleScope,
  hasFenceUnconfirmed,
  isWatchScheduleExitLatched,
  isWatchScheduleSessionCurrent,
  latchWatchScheduleExit,
  markFenceUnconfirmed,
  readFenceUnconfirmed,
  recoverWatchScheduleCleanup,
  releaseWatchScheduleExit,
  retryWatchScheduleUnconfirmedExit,
  watchScheduleCredential,
  watchScheduleExitBoundary,
  watchScheduleSessionEpoch,
} = await import('./watch-schedule');

function jwt(expSeconds: number): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode({ alg: 'none' })}.${encode({ exp: expSeconds })}.signature`;
}

function status(overrides: Record<string, unknown> = {}) {
  return {
    enabled: false,
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
    ...overrides,
  };
}

describe('watch schedule bridge', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    state.ios = true;
    state.fence.mockReset();
    state.disconnect.mockReset();
    state.recover.mockReset();
    state.status.mockReset();
    state.getAccessToken.mockReset();
    forgetWatchScheduleScope();
    establishWatchScheduleSession();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes only the current access token and its expiry, never persists it', async () => {
    const token = jwt(1_800_000_000);
    state.getAccessToken.mockResolvedValue({
      accessToken: token,
      refreshed: false,
    });
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const credential = await watchScheduleCredential();

    expect(credential).toEqual({
      accessToken: token,
      expiresAt: new Date(1_800_000_000_000).toISOString(),
    });
    // No JS storage and no console line ever contains the token.
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('returns true only for a native acknowledgement', async () => {
    state.fence.mockResolvedValue(undefined);

    await expect(fenceWatchScheduleOnExit()).resolves.toBe(true);
    expect(state.fence).toHaveBeenCalledTimes(1);
  });

  it('returns false for a rejected fence instead of claiming success', async () => {
    state.fence.mockRejectedValue(new Error('WATCH_SCHEDULE_UNAVAILABLE'));

    await expect(fenceWatchScheduleOnExit()).resolves.toBe(false);
  });

  it('returns false when the bridge does not answer in time', async () => {
    vi.useFakeTimers();
    try {
      state.fence.mockImplementation(() => new Promise(() => undefined));
      const pending = fenceWatchScheduleOnExit();
      await vi.advanceTimersByTimeAsync(1600);
      await expect(pending).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps an unconfirmed-fence marker until a later acknowledgement', () => {
    expect(hasFenceUnconfirmed()).toBe(false);
    markFenceUnconfirmed();
    expect(hasFenceUnconfirmed()).toBe(true);
    clearFenceUnconfirmed();
    expect(hasFenceUnconfirmed()).toBe(false);
  });

  it('binds the marker to the original scope and operation', () => {
    const a = { instanceURL: 'https://train.example.org/api', athleteId: 7 };
    const b = { instanceURL: 'https://train.example.org/api', athleteId: 9 };
    const marker = markFenceUnconfirmed(a, 'fence');

    expect(readFenceUnconfirmed()).toEqual(marker);
    expect(marker?.attemptId).toBeTruthy();
    // An older retry may not clear (or act on) another account's marker.
    expect(clearFenceUnconfirmed({ ...marker!, scope: b })).toBe(false);
    expect(hasFenceUnconfirmed()).toBe(true);
    expect(clearFenceUnconfirmed(marker!)).toBe(true);
    expect(hasFenceUnconfirmed()).toBe(false);
  });

  it('rejects unsafe athlete ids and non-instance URLs in a marker', () => {
    const marker = (overrides: Record<string, unknown>) =>
      sessionStorage.setItem(
        'watch_schedule_fence_unconfirmed',
        JSON.stringify({
          attemptId: 'attempt',
          operation: 'fence',
          ...overrides,
        }),
      );

    for (const scope of [
      { instanceURL: 'https://train.example.org/api', athleteId: 0 },
      { instanceURL: 'https://train.example.org/api', athleteId: 1.5 },
      { instanceURL: 'https://train.example.org/api', athleteId: '7' },
      {
        instanceURL: 'https://train.example.org/api',
        athleteId: Number.MAX_SAFE_INTEGER + 1,
      },
      { instanceURL: 'javascript:alert(1)', athleteId: 7 },
      { instanceURL: 'not a url', athleteId: 7 },
      { instanceURL: 'https://user:pass@train.example.org/api', athleteId: 7 },
      { instanceURL: 'https://train.example.org/api?x=1', athleteId: 7 },
      { instanceURL: 'https://train.example.org/api#x', athleteId: 7 },
    ]) {
      marker({ scope });
      expect(readFenceUnconfirmed()?.scope).toBeNull();
    }

    marker({
      scope: {
        instanceURL: 'https://train.example.org/api',
        athleteId: 7,
      },
    });
    expect(readFenceUnconfirmed()?.scope).toEqual({
      instanceURL: 'https://train.example.org/api',
      athleteId: 7,
    });
  });

  it('uses each exit attempt id instead of the scope tuple', () => {
    const a = { instanceURL: 'https://train.example.org/api', athleteId: 7 };
    latchWatchScheduleExit();
    const first = markFenceUnconfirmed(a, 'fence')!;
    latchWatchScheduleExit();
    const second = markFenceUnconfirmed(a, 'fence')!;

    expect(second.attemptId).not.toBe(first.attemptId);
    expect(clearFenceUnconfirmed(first)).toBe(false);
    expect(readFenceUnconfirmed()).toEqual(second);
    expect(clearFenceUnconfirmed(second)).toBe(true);
  });

  it('does not let a late older callback overwrite a newer marker', () => {
    const a = { instanceURL: 'https://train.example.org/api', athleteId: 7 };
    const older = latchWatchScheduleExit();
    const newer = latchWatchScheduleExit();
    const newerMarker = markFenceUnconfirmed(a, 'fence', newer)!;

    expect(markFenceUnconfirmed(a, 'disconnect', older)).toBeNull();
    expect(readFenceUnconfirmed()).toEqual(newerMarker);
  });

  it('recovers durable teardown instead of sending an unscoped disconnect', async () => {
    state.disconnect.mockResolvedValue({ athleteId: 7 });
    state.recover.mockResolvedValue({ recovered: true });

    await expect(disconnectWatchScheduleOnExit()).resolves.toBeNull();
    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.recover).toHaveBeenCalledTimes(1);

    const a = { instanceURL: 'https://train.example.org/api', athleteId: 7 };
    await expect(disconnectWatchScheduleOnExit(a)).resolves.toEqual({
      athleteId: 7,
    });
    expect(state.disconnect).toHaveBeenCalledWith({ scope: a });
  });

  it('does not call the bridge off iOS', async () => {
    state.ios = false;

    await expect(fenceWatchScheduleOnExit()).resolves.toBe(true);
    await expect(disconnectWatchSchedule()).resolves.toBeNull();
    await expect(recoverWatchScheduleCleanup()).resolves.toBe(true);
    expect(state.fence).not.toHaveBeenCalled();
    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.recover).not.toHaveBeenCalled();
  });

  it('reports a failed dedicated recovery instead of success', async () => {
    state.recover.mockResolvedValueOnce(false);
    await expect(recoverWatchScheduleCleanup()).resolves.toBe(false);
    state.recover.mockRejectedValueOnce(new Error('unavailable'));
    await expect(recoverWatchScheduleCleanup()).resolves.toBe(false);
  });

  it('blocks new work at the new epoch while an exit is latched', () => {
    const before = watchScheduleSessionEpoch();
    const boundary = latchWatchScheduleExit();
    const after = watchScheduleSessionEpoch();

    expect(after).toBe(before + 1);
    expect(isWatchScheduleExitLatched()).toBe(true);
    // Work that starts during the logout wait must not be considered current,
    // even though it captured the newest epoch.
    expect(isWatchScheduleSessionCurrent(after)).toBe(false);
    expect(isWatchScheduleSessionCurrent(boundary)).toBe(false);
    expect(isWatchScheduleSessionCurrent(before)).toBe(false);
  });

  it('releases the latch only for the matching cancelled switch', () => {
    const boundary = latchWatchScheduleExit();
    const newer = latchWatchScheduleExit();
    const beforeRelease = watchScheduleSessionEpoch();

    releaseWatchScheduleExit(boundary);

    expect(isWatchScheduleExitLatched()).toBe(true);
    releaseWatchScheduleExit(newer);
    expect(isWatchScheduleExitLatched()).toBe(false);
    expect(isWatchScheduleSessionCurrent(newer)).toBe(false);
    expect(watchScheduleSessionEpoch()).toBe(beforeRelease + 1);
  });

  it('establishes only the authenticated successor and keeps old work stale', () => {
    const stale = watchScheduleSessionEpoch();
    latchWatchScheduleExit();
    establishWatchScheduleSession();
    const successor = watchScheduleSessionEpoch();

    expect(isWatchScheduleExitLatched()).toBe(false);
    expect(isWatchScheduleSessionCurrent(successor)).toBe(true);
    expect(isWatchScheduleSessionCurrent(stale)).toBe(false);
  });

  it('does not let a stale initialization release a newer exit latch', () => {
    const observed = watchScheduleExitBoundary();
    latchWatchScheduleExit();

    expect(establishWatchScheduleSession(observed)).toBe(false);
    expect(isWatchScheduleExitLatched()).toBe(true);
  });

  it('asks the dedicated recovery to act on durable teardown only', async () => {
    state.recover.mockResolvedValue({ recovered: true });

    await expect(recoverWatchScheduleCleanup()).resolves.toBe(true);
    expect(state.recover).toHaveBeenCalledWith();
  });

  describe('retrying a missed exit', () => {
    const previous = {
      instanceURL: 'https://train.example.org/api',
      athleteId: 9,
    };

    it('recovers durable teardown but keeps an unproven unknown-scope marker', async () => {
      markFenceUnconfirmed(null, 'fence');
      state.recover.mockResolvedValue({ recovered: true });

      await expect(retryWatchScheduleUnconfirmedExit()).resolves.toBe(true);

      expect(state.recover).toHaveBeenCalledWith();
      expect(state.fence).not.toHaveBeenCalled();
      expect(state.disconnect).not.toHaveBeenCalled();
      expect(state.status).not.toHaveBeenCalled();
      // An empty recovery is a no-op, not proof that an unknown exit retired
      // its opt-in. The warning must survive.
      expect(hasFenceUnconfirmed()).toBe(true);
    });

    it('preserves an unknown-scope marker when recovery is not acknowledged', async () => {
      markFenceUnconfirmed(null, 'fence');
      state.recover.mockResolvedValue({ recovered: false });

      await expect(retryWatchScheduleUnconfirmedExit()).resolves.toBe(false);

      expect(state.fence).not.toHaveBeenCalled();
      expect(state.disconnect).not.toHaveBeenCalled();
      expect(hasFenceUnconfirmed()).toBe(true);
    });

    it('retires only the saved scope, never the currently signed-in account', async () => {
      markFenceUnconfirmed(previous, 'fence');
      state.disconnect.mockResolvedValue({
        athleteId: previous.athleteId,
        instanceURL: previous.instanceURL,
        removedEventIDs: [],
        retainedEventIDs: [],
        unresolvedEventIDs: [],
        purgedCredential: true,
        permission: 'authorized',
      });
      state.recover.mockResolvedValue({ recovered: true });
      state.status.mockResolvedValue(status());

      await expect(retryWatchScheduleUnconfirmedExit()).resolves.toBe(true);

      expect(state.disconnect).toHaveBeenCalledWith({ scope: previous });
      expect(state.disconnect).not.toHaveBeenCalledWith();
      expect(state.fence).not.toHaveBeenCalled();
      expect(state.status).toHaveBeenCalledWith({ scope: previous });
      expect(hasFenceUnconfirmed()).toBe(false);
    });

    it('keeps the marker when the saved scope still has cleanup work', async () => {
      markFenceUnconfirmed(previous, 'disconnect');
      state.disconnect.mockResolvedValue(null);
      state.recover.mockResolvedValue({ recovered: true });
      state.status.mockResolvedValue(status({ cleanupPending: true }));

      await expect(retryWatchScheduleUnconfirmedExit()).resolves.toBe(false);

      expect(state.status).toHaveBeenCalledWith({ scope: previous });
      expect(hasFenceUnconfirmed()).toBe(true);
    });

    it('keeps the marker when the status of the saved scope is unknown', async () => {
      markFenceUnconfirmed(previous, 'disconnect');
      state.disconnect.mockResolvedValue(null);
      state.recover.mockResolvedValue({ recovered: true });
      state.status.mockResolvedValue(status({ cleanupUnknown: true }));

      await expect(retryWatchScheduleUnconfirmedExit()).resolves.toBe(false);

      expect(hasFenceUnconfirmed()).toBe(true);
    });

    it('does not clear a marker that another operation replaced meanwhile', async () => {
      markFenceUnconfirmed(previous, 'fence');
      state.disconnect.mockResolvedValue(null);
      state.recover.mockResolvedValue({ recovered: true });
      state.status.mockImplementation(async () => {
        markFenceUnconfirmed(previous, 'disconnect');
        return status();
      });

      await expect(retryWatchScheduleUnconfirmedExit()).resolves.toBe(false);

      expect(readFenceUnconfirmed()).toMatchObject({
        scope: previous,
        operation: 'disconnect',
      });
    });

    it('preserves the marker when the bridge cannot be reached', async () => {
      markFenceUnconfirmed(null, 'fence');
      state.recover.mockRejectedValue(new Error('unavailable'));

      await expect(retryWatchScheduleUnconfirmedExit()).resolves.toBe(false);

      expect(hasFenceUnconfirmed()).toBe(true);
    });
  });
});
