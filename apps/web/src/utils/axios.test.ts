// @vitest-environment jsdom
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

import client from './axios';
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
});
