// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./capacitor', () => ({
  getApiBaseUrl: () => 'https://train.example.org/api',
}));

const SESSION_KEY = 'auth_session';
const ATTEMPT_KEY = 'auth_login_attempt';
const LEGACY_ACCESS_KEY = 'access_token';
const LEGACY_REFRESH_KEY = 'refresh_token';

describe('auth session storage ownership', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.resetModules();
  });

  it('keeps owner, generation and credentials in one record', async () => {
    const firstContext = await import('./auth-attempt');
    firstContext.installAuthTokens('token-a', 'refresh-a');
    const snapshot = firstContext.captureAuthSession();
    const record = JSON.parse(localStorage.getItem(SESSION_KEY)!) as Record<
      string,
      unknown
    >;

    expect(record).toMatchObject({
      owner: snapshot.owner,
      generation: snapshot.generation,
      accessToken: 'token-a',
      refreshToken: 'refresh-a',
    });
    // No split legacy credential can disagree with the owner.
    expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBeNull();
    // Opaque IDs, never a shared read-modify-write counter.
    expect(snapshot.owner).not.toMatch(/^\d+$/);
    expect(snapshot.generation).not.toMatch(/^\d+$/);

    // A reload or a second tab rehydrates the same non-secret boundary.
    vi.resetModules();
    const secondContext = await import('./auth-attempt');
    expect(secondContext.captureAuthSession()).toMatchObject({
      owner: snapshot.owner,
      generation: snapshot.generation,
      accessToken: 'token-a',
    });

    const rotated = secondContext.captureAuthSession();
    secondContext.rotateAuthTokens(rotated, 'token-a2', 'refresh-a2');
    // Refresh rotation keeps the owner; only the exact credential changes.
    expect(firstContext.isAuthSessionCurrent(snapshot)).toBe(true);
    expect(firstContext.isAuthAttemptCurrent(snapshot)).toBe(false);

    const successor = secondContext.installAuthTokens('token-b', 'refresh-b');
    // A login in the other context replaces the owner everywhere.
    expect(firstContext.isAuthSessionCurrent(snapshot)).toBe(false);
    expect(successor.owner).not.toBe(snapshot.owner);
    expect(successor.generation).not.toBe(snapshot.generation);
  });

  it('publishes one attempt pointer and lets only it commit', async () => {
    const firstContext = await import('./auth-attempt');
    const first = firstContext.beginAuthLogin();
    vi.resetModules();
    const secondContext = await import('./auth-attempt');
    const second = secondContext.beginAuthLogin();

    expect(second.ticket).not.toBe(first.ticket);
    expect(String(first.ticket)).not.toMatch(/^\d+$/);
    expect(localStorage.getItem(ATTEMPT_KEY)).toBe(second.ticket);
    expect(
      firstContext.commitAuthLogin(first, 'token-a', 'refresh-a'),
    ).toBeNull();

    const committed = secondContext.commitAuthLogin(
      second,
      'token-b',
      'refresh-b',
    );
    expect(committed).not.toBeNull();
    expect(firstContext.captureAuthSession().owner).toBe(committed?.owner);
  });

  it('migrates legacy tokens once, then treats the record as authoritative', async () => {
    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');

    const { captureAuthSession, storedAccessToken, storedRefreshToken } =
      await import('./auth-attempt');
    expect(captureAuthSession()).toMatchObject({
      accessToken: 'legacy-access',
    });
    expect(storedAccessToken()).toBe('legacy-access');
    expect(storedRefreshToken()).toBe('legacy-refresh');
    expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
  });

  it('does not revive legacy tokens after a signed-out record', async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        owner: 'signed-out-owner',
        generation: 'signed-out-generation',
        accessToken: null,
        refreshToken: null,
      }),
    );
    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');

    const { captureAuthSession } = await import('./auth-attempt');
    expect(captureAuthSession()).toMatchObject({
      owner: 'signed-out-owner',
      accessToken: null,
    });
    expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBeNull();
    expect(
      JSON.parse(localStorage.getItem(SESSION_KEY)!).accessToken,
    ).toBeNull();
  });

  it('keeps the signed-out boundary when logout clears device storage', async () => {
    const {
      installAuthTokens,
      captureAuthSession,
      clearAuthTokens,
      isAuthSessionCurrent,
    } = await import('./auth-attempt');
    const { clear } = await import('./local-storage');
    installAuthTokens('token-a', 'refresh-a');
    const snapshot = captureAuthSession();
    expect(clearAuthTokens(snapshot)).toBe(true);

    clear();

    expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBeNull();
    const signedOut = captureAuthSession();
    const record = JSON.parse(localStorage.getItem(SESSION_KEY)!) as Record<
      string,
      unknown
    >;
    expect(record).toMatchObject({
      owner: signedOut.owner,
      generation: signedOut.generation,
      accessToken: null,
      refreshToken: null,
    });
    // A successor owner signalled sign-out; legacy tokens cannot revive it.
    expect(isAuthSessionCurrent(snapshot)).toBe(false);
    expect(signedOut.accessToken).toBeNull();
  });
});
