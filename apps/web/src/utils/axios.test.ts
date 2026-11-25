// @vitest-environment jsdom
import {
  type AxiosAdapter,
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { captureAuthSession, installAuthTokens } from './auth-attempt';
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
const defaultAdapter = client.defaults.adapter;

describe('API client errors', () => {
  beforeEach(() => {
    localStorage.clear();
    client.defaults.adapter = defaultAdapter;
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

  const starts: [string, (adapter: AxiosAdapter) => Promise<unknown>][] = [
    ['request', (adapter) => client.request({ url: '/event', adapter })],
    ['callable config', (adapter) => client({ url: '/event', adapter })],
    [
      'callable url',
      (adapter) => client('/event', { adapter } as AxiosRequestConfig),
    ],
    ['get', (adapter) => client.get('/event', { adapter })],
    ['delete', (adapter) => client.delete('/event', { adapter })],
    ['head', (adapter) => client.head('/event', { adapter })],
    ['options', (adapter) => client.options('/event', { adapter })],
    ['post', (adapter) => client.post('/event', {}, { adapter })],
    ['put', (adapter) => client.put('/event', {}, { adapter })],
    ['patch', (adapter) => client.patch('/event', {}, { adapter })],
    ['query', (adapter) => client.query('/event', {}, { adapter })],
  ];

  it.each(starts)(
    'captures the owner synchronously when %s starts',
    async (_method, start) => {
      const adapter = vi.fn(async () => {
        throw new Error('adapter reached');
      });
      const outcome = start(adapter).then(
        () => null,
        (error: unknown) => error,
      );

      // A successor commits before the async request interceptor can run.
      installAuthTokens('token-b', 'refresh-b');

      await expect(outcome).resolves.toBeInstanceOf(AuthSessionChangedError);
      expect(adapter).not.toHaveBeenCalled();
      expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
    },
  );

  it('does not send an explicitly pinned attempt from a replaced session', async () => {
    const attempt = captureAuthSession();
    installAuthTokens('token-b', 'refresh-b');
    const adapter = vi.fn(async () => {
      throw new Error('adapter reached');
    });

    const outcome = client
      .get('/user/me', { authAttempt: attempt, adapter })
      .then(
        () => null,
        (error: unknown) => error,
      );

    await expect(outcome).resolves.toBeInstanceOf(AuthSessionChangedError);
    expect(adapter).not.toHaveBeenCalled();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
  });

  it('rechecks the owner at the adapter boundary', async () => {
    const adapter = vi.fn(async () => {
      throw new Error('adapter reached');
    });
    const outcome = client
      .get('/event', {
        adapter,
        transformRequest: [
          () => {
            installAuthTokens('token-b', 'refresh-b');
            return '';
          },
        ],
      })
      .then(
        () => null,
        (error: unknown) => error,
      );

    await expect(outcome).resolves.toBeInstanceOf(AuthSessionChangedError);
    expect(adapter).not.toHaveBeenCalled();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
  });

  it('binds a locale write to the session that invoked it', async () => {
    const { UserAPI } = await import('@/api/user/user.api');
    const session = captureAuthSession();
    const adapter = vi.fn(async () => {
      throw new Error('adapter reached');
    });
    client.defaults.adapter = adapter;

    const outcome = UserAPI.updateLanguage('FR', session).then(
      () => null,
      (error: unknown) => error,
    );
    installAuthTokens('token-b', 'refresh-b');

    await expect(outcome).resolves.toBeInstanceOf(AuthSessionChangedError);
    expect(adapter).not.toHaveBeenCalled();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
  });

  it('sends a locale write for the session that still owns the profile', async () => {
    const { UserAPI } = await import('@/api/user/user.api');
    const session = captureAuthSession();
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
      data: null,
      status: 204,
      statusText: 'No Content',
      headers: {},
      config,
    }));
    client.defaults.adapter = adapter;

    await UserAPI.updateLanguage('FR', session);

    expect(adapter).toHaveBeenCalledTimes(1);
    const sent = adapter.mock.calls[0][0];
    expect(sent.baseURL).toBe(session.instanceURL);
    expect(sent.headers.Authorization).toBe(`Bearer ${ACCESS}`);
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
