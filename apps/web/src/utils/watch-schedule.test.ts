// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  ios: true,
  getAccessToken: vi.fn(),
  fence: vi.fn(),
  disconnect: vi.fn(),
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
    status: vi.fn(),
    connect: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const {
  disconnectWatchSchedule,
  fenceWatchScheduleOnExit,
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

  it('acknowledges the native fence before sign-out continues', async () => {
    state.fence.mockResolvedValue(undefined);

    await fenceWatchScheduleOnExit();

    expect(state.fence).toHaveBeenCalledTimes(1);
  });

  it('does not call the bridge off iOS', async () => {
    state.ios = false;

    await expect(fenceWatchScheduleOnExit()).resolves.toBeUndefined();
    await expect(disconnectWatchSchedule()).resolves.toBeNull();
    expect(state.fence).not.toHaveBeenCalled();
    expect(state.disconnect).not.toHaveBeenCalled();
  });
});
