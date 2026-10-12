// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getApiBaseUrl, getDefaultApiBaseUrl } from './capacitor';
import { clear } from './local-storage';
import {
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
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.openathlete.org');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

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

  it('keeps an existing install signed in when it has no selected server', () => {
    localStorage.setItem('access_token', 'secret');
    localStorage.setItem('refresh_token', 'refresh-secret');
    sessionStorage.setItem('pendingPlanToken', 'secret');

    const defaultUrl = getDefaultApiBaseUrl();
    expect(getSelectedServerUrl()).toBeNull();
    expect(getApiBaseUrl()).toBe(defaultUrl);
    expect(saveSelectedServerUrl(defaultUrl, defaultUrl)).toBe(false);
    expect(localStorage.getItem('access_token')).toBe('secret');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-secret');
    expect(sessionStorage.getItem('pendingPlanToken')).toBe('secret');
    expect(getSelectedServerUrl()).toBeNull();
  });

  it('clears the old session only when switching to another server', () => {
    localStorage.setItem('access_token', 'secret');
    sessionStorage.setItem('pendingPlanToken', 'secret');

    const defaultUrl = getDefaultApiBaseUrl();
    const customUrl = 'https://train.example.org/api';
    expect(saveSelectedServerUrl(customUrl, defaultUrl)).toBe(true);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('pendingPlanToken')).toBeNull();
    expect(getSelectedServerUrl()).toBe(customUrl);
    expect(getApiBaseUrl()).toBe(customUrl);

    localStorage.setItem('access_token', 'new-secret');
    expect(saveSelectedServerUrl(customUrl, defaultUrl)).toBe(false);
    expect(localStorage.getItem('access_token')).toBe('new-secret');

    expect(saveSelectedServerUrl(defaultUrl, defaultUrl)).toBe(true);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(getSelectedServerUrl()).toBeNull();
    expect(getApiBaseUrl()).toBe(defaultUrl);
  });

  it('keeps a custom server choice on logout', () => {
    const defaultUrl = getDefaultApiBaseUrl();
    const customUrl = 'https://train.example.org/api';
    saveSelectedServerUrl(customUrl, defaultUrl);

    localStorage.setItem('access_token', 'new-secret');
    clear();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(getSelectedServerUrl()).toBe(customUrl);
  });
});
