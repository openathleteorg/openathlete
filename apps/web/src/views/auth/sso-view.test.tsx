// @vitest-environment jsdom
import {
  beginAuthLogin,
  installAuthTokens,
  storedAccessToken,
} from '@/utils/auth-attempt';
import { rememberOidcLoginAttempt } from '@/utils/oidc-login-attempt';
import { deferred } from '@/utils/test/deferred';
import { waitUntil } from '@/utils/test/wait-until';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SsoView } from './sso-view';

const api = vi.hoisted(() => ({ exchange: vi.fn(), initialize: vi.fn() }));

vi.mock(
  '@/utils/auth-login-lock',
  () => import('@/utils/test/auth-login-lock'),
);

vi.mock('@/api/auth/auth.api', () => ({
  AuthAPI: { exchangeOidcCode: api.exchange },
}));
vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({ initialize: api.initialize }),
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('SsoView', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    api.exchange.mockReset().mockResolvedValue({
      accessToken: 'sso-token',
      refreshToken: 'sso-refresh',
    });
    api.initialize.mockReset().mockResolvedValue(undefined);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.history.replaceState(null, '', '/');
  });

  const returnFromSso = async (ticket: string) => {
    window.history.replaceState(
      null,
      '',
      '/auth/sso#code=one-time-code&attempt=' + ticket,
    );
    await act(async () =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={['/auth/sso']}>
            <Routes>
              <Route path="/auth/sso" element={<SsoView />} />
              <Route path="/dashboard" element={<div>dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );
  };

  it('completes the matching redirect without storing any auth credentials in sessionStorage', async () => {
    installAuthTokens('prior-access', 'prior-refresh');
    const attempt = await beginAuthLogin();
    expect(rememberOidcLoginAttempt(attempt)).toBe(true);
    const storage = Object.values(sessionStorage).join();
    expect(storage).not.toContain('prior-access');
    expect(storage).not.toContain('prior-refresh');

    await returnFromSso(attempt.ticket);
    await waitUntil(() => expect(container.textContent).toBe('dashboard'));
    expect(storedAccessToken()).toBe('sso-token');
    expect(window.location.hash).toBe('');
  });

  it('rejects the callback if another login started while the provider was open', async () => {
    const attempt = await beginAuthLogin();
    rememberOidcLoginAttempt(attempt);
    await beginAuthLogin();

    await returnFromSso(attempt.ticket);

    expect(container.querySelector('[data-sso-error="failed"]')).not.toBeNull();
    expect(api.exchange).not.toHaveBeenCalled();
    expect(storedAccessToken()).toBeNull();
  });

  it('rejects an older callback without consuming the newer redirect', async () => {
    const older = await beginAuthLogin();
    rememberOidcLoginAttempt(older);
    const newer = await beginAuthLogin();
    rememberOidcLoginAttempt(newer);

    await returnFromSso(older.ticket);

    expect(container.querySelector('[data-sso-error="failed"]')).not.toBeNull();
    expect(api.exchange).not.toHaveBeenCalled();
    expect(Object.values(sessionStorage).join()).toContain(newer.ticket);
  });

  it('does not navigate after a newer login starts while SSO initializes the profile', async () => {
    const initialization = deferred<void>();
    api.initialize.mockReturnValueOnce(initialization.promise);
    const attempt = await beginAuthLogin();
    rememberOidcLoginAttempt(attempt);

    await returnFromSso(attempt.ticket);
    await waitUntil(() => expect(storedAccessToken()).toBe('sso-token'));

    await beginAuthLogin();
    await act(async () => initialization.resolve());

    expect(container.querySelector('[data-sso-error="failed"]')).not.toBeNull();
  });
});
