// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.hoisted(() => vi.fn());
vi.mock('axios', () => ({
  default: { post },
}));
vi.mock('./capacitor', () => ({
  getApiBaseUrl: () => 'https://train.example.org/api',
}));
vi.mock('./axios', () => ({
  routes: { auth: { refreshToken: '/auth/refresh-token' } },
}));

const { refreshToken } = await import('./auth');
const { captureAuthSession, installAuthTokens, isAuthSessionCurrent } =
  await import('./auth-attempt');
const { ACCESS_TOKEN, REFRESH_TOKEN } = await import('./local-storage');

describe('auth token attempts', () => {
  beforeEach(() => {
    localStorage.clear();
    post.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not install a refresh that lost to a newer login', async () => {
    installAuthTokens('old-access', 'old-refresh');
    let resolvePost!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolvePost = resolve;
    });
    post.mockReturnValue(pending);

    const refresh = refreshToken();
    installAuthTokens('new-access', 'new-refresh');
    resolvePost({
      data: { accessToken: 'stale-access', refreshToken: 'stale-refresh' },
    });

    await expect(refresh).resolves.toBeNull();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('new-access');
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe('new-refresh');
  });

  it('installs a refresh while the same session is current', async () => {
    installAuthTokens('old-access', 'old-refresh');
    const before = captureAuthSession();
    post.mockResolvedValue({
      data: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' },
    });

    await expect(refreshToken()).resolves.toEqual({
      accessToken: 'fresh-access',
      refreshToken: 'fresh-refresh',
      refreshed: true,
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('fresh-access');
    // Rotating within one login must not look like a successor session.
    expect(isAuthSessionCurrent(before)).toBe(true);
    const after = captureAuthSession();
    expect(after.owner).toBe(before.owner);
    expect(after.accessToken).toBe('fresh-access');
  });
});
