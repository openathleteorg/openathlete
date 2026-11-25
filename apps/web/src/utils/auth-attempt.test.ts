// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./capacitor', () => ({
  getApiBaseUrl: () => 'https://train.example.org/api',
}));

const OWNER_KEY = 'auth_session_owner';
const GENERATION_KEY = 'auth_token_generation';
const ACCESS_KEY = 'access_token';

describe('auth session storage ownership', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.resetModules();
  });

  it('shares owner and generation through storage across module contexts', async () => {
    const firstContext = await import('./auth-attempt');
    firstContext.installAuthTokens('token-a', 'refresh-a');
    const snapshot = firstContext.captureAuthSession();

    expect(localStorage.getItem(OWNER_KEY)).toBe(String(snapshot.owner));
    expect(localStorage.getItem(GENERATION_KEY)).toBe(
      String(snapshot.generation),
    );
    expect(localStorage.getItem(OWNER_KEY)).toMatch(/^\d+$/);

    // A reload or a second tab rehydrates the same non-secret boundary.
    vi.resetModules();
    const secondContext = await import('./auth-attempt');
    expect(secondContext.captureAuthSession()).toMatchObject({
      owner: snapshot.owner,
      generation: snapshot.generation,
    });

    const rotated = secondContext.captureAuthSession();
    secondContext.rotateAuthTokens(rotated, 'token-a2', 'refresh-a2');
    // Refresh rotation keeps the owner; only the exact credential changes.
    expect(firstContext.isAuthSessionCurrent(snapshot)).toBe(true);
    expect(firstContext.isAuthAttemptCurrent(snapshot)).toBe(false);

    secondContext.installAuthTokens('token-b', 'refresh-b');
    // A login in the other context replaces the owner everywhere.
    expect(firstContext.isAuthSessionCurrent(snapshot)).toBe(false);
  });

  it('keeps the non-secret boundary when logout clears device storage', async () => {
    const { installAuthTokens, captureAuthSession, isAuthSessionCurrent } =
      await import('./auth-attempt');
    const { clear } = await import('./local-storage');
    installAuthTokens('token-a', 'refresh-a');
    const snapshot = captureAuthSession();

    clear();

    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(OWNER_KEY)).toBe(String(snapshot.owner));
    expect(localStorage.getItem(GENERATION_KEY)).toBe(
      String(snapshot.generation),
    );
    // A cleared credential is not a replacement: logout continuations for
    // this login may still finish.
    expect(isAuthSessionCurrent(snapshot)).toBe(true);
  });
});
