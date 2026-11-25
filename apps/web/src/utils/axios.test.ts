// @vitest-environment jsdom
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { installAuthTokens } from './auth-attempt';
import client, { AuthSessionChangedError, isNetworkError } from './axios';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './local-storage';

const auth = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
const capacitor = vi.hoisted(() => ({
  apiBaseUrl: 'https://api-a.example.org',
}));
vi.mock('@/utils/auth', () => ({ getAccessToken: auth.getAccessToken }));
vi.mock('./capacitor', () => ({
  getApiBaseUrl: () => capacitor.apiBaseUrl,
}));

// Answers every request with the given status, without any network.
const respondWith =
  (status: number) => async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError(
      `HTTP ${status}`,
      AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      { status, statusText: '', data: {}, headers: {}, config },
    );
  };

// A token valid until 2100, so the client sends it as is instead of refreshing.
const ACCESS = `header.${btoa(JSON.stringify({ exp: 4102444800 }))}.signature`;

describe('API client errors', () => {
  beforeEach(() => {
    localStorage.clear();
    capacitor.apiBaseUrl = 'https://api-a.example.org';
    auth.getAccessToken.mockReset();
    auth.getAccessToken.mockResolvedValue({
      accessToken: ACCESS,
      refreshed: false,
    });
    installAuthTokens(ACCESS, 'refresh');
  });

  it('drops the tokens on 401 and still reports the failure', async () => {
    const request = client.post(
      '/auth/login',
      {},
      { adapter: respondWith(401) },
    );
    await expect(request).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN)).toBeNull();
  });

  it('keeps the tokens on other failures', async () => {
    const request = client.get('/user/me', { adapter: respondWith(500) });
    await expect(request).rejects.toMatchObject({
      response: { status: 500 },
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe(ACCESS);
  });

  it('does not clear a newer session from a stale 401', async () => {
    const request = client.get('/user/me', {
      adapter: async (config) => {
        // Account B signs in while A's request is in flight, then A's old
        // bearer is rejected.
        installAuthTokens('token-b', 'refresh-b');
        throw new AxiosError(
          'HTTP 401',
          AxiosError.ERR_BAD_REQUEST,
          config,
          null,
          { status: 401, statusText: '', data: {}, headers: {}, config },
        );
      },
    });

    await expect(request).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe('refresh-b');
  });

  it('never sends a request with a successor token after a refresh', async () => {
    let resolveToken!: (value: unknown) => void;
    auth.getAccessToken.mockReturnValue(
      new Promise((resolve) => {
        resolveToken = resolve;
      }),
    );
    const adapter = vi.fn(async () => {
      throw new Error('adapter reached');
    });
    const outcome = client.get('/event', { adapter }).then(
      () => null,
      (error: unknown) => error,
    );
    await vi.waitFor(() => expect(auth.getAccessToken).toHaveBeenCalled());

    // Account B commits while A's refresh is still pending.
    installAuthTokens('token-b', 'refresh-b');
    resolveToken({ accessToken: 'fresh-a', refreshed: true });

    await expect(outcome).resolves.toBeInstanceOf(AuthSessionChangedError);
    expect(adapter).not.toHaveBeenCalled();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe('refresh-b');
  });

  it('never sends a request after its API instance changed during refresh', async () => {
    let resolveToken!: (value: unknown) => void;
    auth.getAccessToken.mockReturnValue(
      new Promise((resolve) => {
        resolveToken = resolve;
      }),
    );
    const adapter = vi.fn(async () => {
      throw new Error('adapter reached');
    });
    const outcome = client.get('/event', { adapter }).then(
      () => null,
      (error: unknown) => error,
    );
    await vi.waitFor(() => expect(auth.getAccessToken).toHaveBeenCalled());

    capacitor.apiBaseUrl = 'https://api-b.example.org';
    resolveToken({ accessToken: 'fresh-a', refreshed: true });

    await expect(outcome).resolves.toBeInstanceOf(AuthSessionChangedError);
    expect(adapter).not.toHaveBeenCalled();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe(ACCESS);
  });

  it('tells a request without any answer from an answered failure', async () => {
    const offline = client.get('/user/me', {
      adapter: async (config) => {
        throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
      },
    });
    const error = await offline.catch((e: unknown) => e);
    expect(isNetworkError(error)).toBe(true);
    // The session is kept for when the connection comes back
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe(ACCESS);

    const unauthorized = await client
      .get('/user/me', { adapter: respondWith(401) })
      .catch((e: unknown) => e);
    expect(isNetworkError(unauthorized)).toBe(false);
    expect(isNetworkError(new Error('boom'))).toBe(false);
  });
});
