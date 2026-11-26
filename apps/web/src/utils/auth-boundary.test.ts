// @vitest-environment jsdom
import type { InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  captureAuthSession,
  clearAuthTokens,
  installAuthTokens,
} from './auth-attempt';
import client from './axios';
import { ACCESS_TOKEN } from './local-storage';

vi.mock('./capacitor', () => ({
  getApiBaseUrl: () => 'https://train.example.org/api',
}));

const tokenOf = (label: string) =>
  `header.${btoa(JSON.stringify({ exp: 4102444800, label }))}.signature`;

describe('authoritative auth boundary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('never sends a split legacy token under the current owner', async () => {
    const tokenA = tokenOf('a');
    const tokenB = tokenOf('b');
    installAuthTokens(tokenA, 'refresh-a');
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));

    // Simulate the old replacement split: B's legacy bearer is written while
    // A's owner record is still the authority.
    localStorage.setItem(ACCESS_TOKEN, tokenB);
    await client.get('/event', { adapter });

    const sent = adapter.mock.calls[0][0];
    expect(sent.headers.Authorization).toBe(`Bearer ${tokenA}`);
    expect(sent.headers.Authorization).not.toContain(tokenB);
    // The authority read also removes the legacy bypass.
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
  });

  it('does not revive legacy credentials after a signed-out record', async () => {
    const tokenA = tokenOf('a');
    installAuthTokens(tokenA, 'refresh-a');
    expect(clearAuthTokens(captureAuthSession())).toBe(true);
    localStorage.setItem(ACCESS_TOKEN, tokenOf('b'));
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));

    await client.get('/event', { adapter });

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
  });
});
