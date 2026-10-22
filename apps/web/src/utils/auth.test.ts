// @vitest-environment jsdom
import axios, { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAccessToken } from './auth';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './local-storage';

describe('session refresh transport failures', () => {
  beforeEach(() => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.setItem(REFRESH_TOKEN, 'saved-refresh-token');
  });
  afterEach(() => vi.restoreAllMocks());

  it('preserves the refresh credential and reports an unanswered request', async () => {
    const failure = new AxiosError('Network Error', AxiosError.ERR_NETWORK);
    const post = vi.spyOn(axios, 'post').mockRejectedValue(failure);
    await expect(getAccessToken()).rejects.toBe(failure);
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe('saved-refresh-token');
    expect(post.mock.calls[0][2]).toEqual({ timeout: 15_000 });
  });

  it('does not treat a server failure as invalid credentials', async () => {
    const failure = new AxiosError('Unavailable');
    failure.response = { status: 503 } as never;
    vi.spyOn(axios, 'post').mockRejectedValue(failure);
    await expect(getAccessToken()).rejects.toBe(failure);
  });

  it('still rejects a refresh credential when the server answers unauthorized', async () => {
    const failure = new AxiosError('Unauthorized');
    failure.response = { status: 401 } as never;
    vi.spyOn(axios, 'post').mockRejectedValue(failure);
    await expect(getAccessToken()).resolves.toBeNull();
  });
});
