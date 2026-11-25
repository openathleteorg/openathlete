// @vitest-environment jsdom
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

import { installAuthTokens } from './auth-attempt';
import client, { isNetworkError } from './axios';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './local-storage';

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
    localStorage.setItem(ACCESS_TOKEN, ACCESS);
    localStorage.setItem(REFRESH_TOKEN, 'refresh');
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
