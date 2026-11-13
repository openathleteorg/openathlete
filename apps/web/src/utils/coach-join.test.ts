import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COACH_JOIN_TOKEN_STORAGE_KEY,
  forgetCoachJoinToken,
  readPendingCoachJoinToken,
  rememberCoachJoinToken,
} from './coach-join';

const TOKEN = 'q3Jm0bP2xS9vYd8kLw4aZg';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

const blocked = () => {
  throw new Error('blocked');
};

describe('pending coach join token', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is remembered, read, then forgotten', () => {
    rememberCoachJoinToken(TOKEN);
    expect(readPendingCoachJoinToken()).toBe(TOKEN);
    forgetCoachJoinToken();
    expect(readPendingCoachJoinToken()).toBeNull();
  });

  it('ignores what is not a token', () => {
    rememberCoachJoinToken('../../etc');
    expect(readPendingCoachJoinToken()).toBeNull();
    localStorage.setItem(COACH_JOIN_TOKEN_STORAGE_KEY, '<script>');
    expect(readPendingCoachJoinToken()).toBeNull();
  });

  it('survives blocked storage', () => {
    vi.stubGlobal('localStorage', {
      getItem: blocked,
      setItem: blocked,
      removeItem: blocked,
    });
    expect(() => rememberCoachJoinToken(TOKEN)).not.toThrow();
    expect(readPendingCoachJoinToken()).toBeNull();
    expect(() => forgetCoachJoinToken()).not.toThrow();
  });
});
