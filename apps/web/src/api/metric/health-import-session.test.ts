// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  healthImportFailure,
  healthImportSession,
} from './health-import-session';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  values: new Map<string, string>(),
  server: 'https://train.example.org/api',
}));
vi.mock('axios', () => ({ default: { create: () => ({ post: mocks.post }) } }));
vi.mock('@/utils/auth', () => ({
  isValidToken: (token: string) => !token.endsWith('.expired'),
}));
vi.mock('@/utils/capacitor', () => ({ getApiBaseUrl: () => mocks.server }));
vi.mock('@/utils/local-storage', () => ({
  ACCESS_TOKEN: 'access',
  REFRESH_TOKEN: 'refresh',
  getItem: (key: string) => mocks.values.get(key) ?? null,
  setItem: (key: string, value: string) => mocks.values.set(key, value),
}));
const jwt = (userId: number, expired = false) =>
  `header.${btoa(JSON.stringify({ userId }))}.${expired ? 'expired' : 'valid'}`;
const binding = {
  apiBaseURL: 'https://train.example.org/api',
  accountID: '42',
};
const options = () => ({
  binding,
  consent: true,
  isCurrent: () => true,
  signal: new AbortController().signal,
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.values.clear();
  mocks.server = binding.apiBaseURL;
  mocks.values.set('access', jwt(42, true));
  mocks.values.set('refresh', jwt(42));
  mocks.post.mockResolvedValue({
    data: { accessToken: jwt(42), refreshToken: jwt(42) },
  });
});
describe('health-upload session renewal', () => {
  it('renews an expired access token on the pinned server and keeps the same account', async () => {
    const session = await healthImportSession(options());
    expect(mocks.post).toHaveBeenCalledWith(
      `${binding.apiBaseURL}/auth/refresh-token`,
      { refreshToken: jwt(42) },
      expect.any(Object),
    );
    expect(session.token).toBe(jwt(42));
    expect(mocks.values.get('access')).toBe(jwt(42));
    session.assertCurrent();
  });
  it('does not renew a healthy token or renew anything without consent', async () => {
    mocks.values.set('access', jwt(42));
    await healthImportSession(options());
    expect(mocks.post).not.toHaveBeenCalled();
    await expect(
      healthImportSession({ ...options(), consent: false }),
    ).rejects.toThrow();
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it('allows routine same-account token rotation but stops on logout or account replacement', async () => {
    mocks.values.set('access', jwt(42));
    const session = await healthImportSession(options());
    const replacement = `header.${btoa(JSON.stringify({ userId: 42, renewed: true }))}.valid`;
    mocks.values.set('access', replacement);
    mocks.values.set('refresh', replacement);
    expect(() => session.assertCurrent()).not.toThrow();
    expect(session.token).toBe(jwt(42));
    mocks.values.set('access', jwt(99));
    expect(() => session.assertCurrent()).toThrow(
      'HEALTH_IMPORT_SESSION_CHANGED',
    );
    mocks.values.clear();
    expect(() => session.assertCurrent()).toThrow(
      'HEALTH_IMPORT_SESSION_CHANGED',
    );
  });
  it('does not adopt credentials if the destination or account changes while renewing', async () => {
    mocks.post.mockImplementation(async () => {
      mocks.server = 'https://other.example.org/api';
      return { data: { accessToken: jwt(42), refreshToken: jwt(42) } };
    });
    await expect(healthImportSession(options())).rejects.toThrow(
      'HEALTH_IMPORT_SESSION_CHANGED',
    );
    expect(mocks.values.get('access')).toBe(jwt(42, true));
  });
  it('rejects a different account in the stored or returned refresh session', async () => {
    mocks.values.set('refresh', jwt(99));
    await expect(healthImportSession(options())).rejects.toThrow(
      'HEALTH_IMPORT_WRONG_ACCOUNT',
    );
    expect(mocks.post).not.toHaveBeenCalled();
    mocks.values.set('refresh', jwt(42));
    mocks.post.mockResolvedValue({
      data: { accessToken: jwt(99), refreshToken: jwt(99) },
    });
    await expect(healthImportSession(options())).rejects.toThrow(
      'HEALTH_IMPORT_WRONG_ACCOUNT',
    );
    expect(mocks.values.get('access')).toBe(jwt(42, true));
  });
  it('asks for login if renewal credentials have expired and uses safe error reasons', async () => {
    mocks.values.set('refresh', jwt(42, true));
    await expect(healthImportSession(options())).rejects.toThrow(
      'HEALTH_IMPORT_LOGIN_REQUIRED',
    );
    expect(
      healthImportFailure({ response: { status: 401, data: 'sensitive' } }),
    ).toBe('login');
    expect(healthImportFailure({ response: { status: 409 } })).toBe('conflict');
    expect(healthImportFailure({ response: { status: 413 } })).toBe('size');
    expect(healthImportFailure({ response: { status: 400 } })).toBe('invalid');
  });
});
