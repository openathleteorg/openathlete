// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  captureAuthSession,
  clearAuthTokens,
  installAuthTokens,
  storedAccessToken,
} from './auth-attempt';
import {
  ACCESS_TOKEN,
  AUTH_LOGIN_ATTEMPT,
  AUTH_SESSION,
  CURRENT_SPACE,
  PUSH_PROMPT_DISMISSED,
  REFRESH_TOKEN,
  SIDEBAR_OPEN_STATES,
  clear,
  setItem,
} from './local-storage';

const rawAuthKeys = () => {
  const keys: [string, string][] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)!;
    if (
      key === AUTH_SESSION ||
      key === AUTH_LOGIN_ATTEMPT ||
      key === ACCESS_TOKEN ||
      key === REFRESH_TOKEN ||
      key.startsWith('auth_record:') ||
      key.startsWith('auth_revoked:')
    ) {
      keys.push([key, localStorage.getItem(key)!]);
    }
  }
  return keys.sort(([left], [right]) => left.localeCompare(right));
};

describe('sign-out device storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes only the known account device keys', () => {
    installAuthTokens('token-a', 'refresh-a');
    clearAuthTokens(captureAuthSession());
    localStorage.setItem(ACCESS_TOKEN, 'legacy-after-sign-out');
    localStorage.setItem(REFRESH_TOKEN, 'legacy-refresh-after-sign-out');
    setItem(CURRENT_SPACE, 'coach');
    setItem(SIDEBAR_OPEN_STATES, '{"calendar":true}');
    setItem(PUSH_PROMPT_DISMISSED, 'true');
    setItem('third.party.key', 'keep');

    const authBefore = rawAuthKeys();

    clear();

    expect(localStorage.getItem(CURRENT_SPACE)).toBeNull();
    expect(localStorage.getItem(SIDEBAR_OPEN_STATES)).toBeNull();
    expect(localStorage.getItem(PUSH_PROMPT_DISMISSED)).toBeNull();
    // The signed-out authority, the attempt pointer and the legacy boundary
    // survive: none of them belongs to the signed-in UI.
    expect(rawAuthKeys()).toEqual(authBefore);
    // Unknown keys belong to the successor, another tab or a third party.
    expect(localStorage.getItem('third.party.key')).toBe('keep');
  });

  it('keeps a successor that committed before sign-out cleanup', () => {
    installAuthTokens('token-a', 'refresh-a');
    const successor = installAuthTokens('token-b', 'refresh-b');
    const authBefore = rawAuthKeys();

    clear();

    expect(storedAccessToken()).toBe('token-b');
    expect(captureAuthSession().owner).toBe(successor.owner);
    expect(rawAuthKeys()).toEqual(authBefore);
  });

  it('never clears the whole store, which could drop a concurrent successor', () => {
    installAuthTokens('token-a', 'refresh-a');
    const storageClear = vi.spyOn(Storage.prototype, 'clear');

    clear();

    expect(storageClear).not.toHaveBeenCalled();
    expect(storedAccessToken()).toBe('token-a');
  });
});
