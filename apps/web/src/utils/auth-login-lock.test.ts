// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';

import { beginAuthLogin, commitAuthLogin } from './auth-attempt';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

it('preserves the current login when the browser denies coordinated storage', async () => {
  const error = new DOMException('Storage denied', 'SecurityError');
  vi.stubGlobal('indexedDB', {
    open: () => {
      throw error;
    },
  });
  localStorage.setItem('auth_login_attempt', 'existing-ticket');

  await expect(beginAuthLogin()).rejects.toBe(error);
  await expect(
    commitAuthLogin(
      {
        ticket: 'existing-ticket',
        owner: 'none',
        generation: 'none',
        accessToken: null,
        instanceURL: 'http://localhost:3000',
      },
      'uncoordinated-access',
    ),
  ).rejects.toBe(error);

  expect(Object.entries(localStorage)).toEqual([
    ['auth_login_attempt', 'existing-ticket'],
  ]);
});
