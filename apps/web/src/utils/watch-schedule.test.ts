// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  ios: true,
  getAccessToken: vi.fn(),
  fence: vi.fn(),
  disconnect: vi.fn(),
  recover: vi.fn(),
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
    status: vi.fn(),
    connect: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const {
  clearFenceUnconfirmed,
  disconnectWatchSchedule,
  fenceWatchScheduleOnExit,
  hasFenceUnconfirmed,
  markFenceUnconfirmed,
  recoverWatchScheduleCleanup,
  watchScheduleCredential,
} = await import('./watch-schedule');

function jwt(expSeconds: number): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode({ alg: 'none' })}.${encode({ exp: expSeconds })}.signature`;
}

describe('watch schedule bridge', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    state.ios = true;
    state.fence.mockReset();
    state.disconnect.mockReset();
    state.recover.mockReset();
    state.getAccessToken.mockReset();
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
});
