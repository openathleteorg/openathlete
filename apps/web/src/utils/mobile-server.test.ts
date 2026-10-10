// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clear } from './local-storage';
import {
  CLOUD_API_URL,
  getSelectedServerUrl,
  resolveServerUrl,
  saveSelectedServerUrl,
  serverUrlCandidates,
} from './mobile-server';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}));

describe('mobile server selection', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('accepts an instance address or an explicit API path, but only over HTTPS', () => {
    expect(serverUrlCandidates('https://train.example.org/')).toEqual([
      'https://train.example.org/api',
      'https://train.example.org',
    ]);
    expect(serverUrlCandidates('https://train.example.org/api/')).toEqual([
      'https://train.example.org/api',
    ]);
    expect(() => serverUrlCandidates('http://train.example.org')).toThrow();
    expect(() =>
      serverUrlCandidates('https://user:pass@train.example.org'),
    ).toThrow();
    expect(() =>
      serverUrlCandidates('https://train.example.org/other'),
    ).toThrow();
  });

  it('finds the API behind the self-hosted /api proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ signup: 'open' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(resolveServerUrl('https://train.example.org')).resolves.toBe(
      'https://train.example.org/api',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://train.example.org/api/instance',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('clears the old session when switching servers and keeps the choice on logout', () => {
    localStorage.setItem('access_token', 'secret');
    sessionStorage.setItem('pendingPlanToken', 'secret');

    expect(saveSelectedServerUrl(CLOUD_API_URL)).toBe(true);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('pendingPlanToken')).toBeNull();
    expect(getSelectedServerUrl()).toBe(CLOUD_API_URL);

    localStorage.setItem('access_token', 'new-secret');
    clear();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(getSelectedServerUrl()).toBe(CLOUD_API_URL);
  });
});
