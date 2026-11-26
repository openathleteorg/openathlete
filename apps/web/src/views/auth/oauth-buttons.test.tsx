// @vitest-environment jsdom
import {
  beginAuthLogin,
  commitAuthLogin,
  storedAccessToken,
} from '@/utils/auth-attempt';
import { deferred } from '@/utils/test/deferred';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { OAuthButtons } from './oauth-buttons';

const api = vi.hoisted(() => ({
  getIdToken: vi.fn(),
  loginWithFirebase: vi.fn(),
}));

vi.mock(
  '@/utils/auth-login-lock',
  () => import('@/utils/test/auth-login-lock'),
);

vi.mock('@/api/auth/auth.api', () => ({
  AuthAPI: { loginWithFirebase: api.loginWithFirebase },
}));
vi.mock('@/api/instance', () => ({
  useInstanceInfoQuery: () => ({ data: { googleSignIn: true } }),
}));
vi.mock('@/utils/firebase-auth', () => ({
  isFirebaseWebConfigured: () => true,
  getFirebaseIdTokenForProvider: api.getIdToken,
}));
vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({ initialize: vi.fn() }),
}));
vi.mock('posthog-js/react', () => ({ usePostHog: () => undefined }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
// Every message renders as its key.
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));
// The app is shown in Italian.
vi.mock('@/paraglide/runtime', () => ({ getLocale: () => 'it' }));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('OAuthButtons', () => {
  it('drops an older provider popup once another login completes', async () => {
    localStorage.clear();
    const popup = deferred<string>();
    api.getIdToken.mockReturnValueOnce(popup.promise);
    api.loginWithFirebase.mockClear().mockResolvedValue({
      accessToken: 'popup-token',
      refreshToken: 'popup-refresh',
    });
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <OAuthButtons />
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    await act(async () => container.querySelector('button')!.click());
    await commitAuthLogin(
      await beginAuthLogin(),
      'successor-token',
      'successor-refresh',
    );
    await act(async () => popup.resolve('old-provider-token'));

    expect(storedAccessToken()).toBe('successor-token');
    expect(api.loginWithFirebase).not.toHaveBeenCalled();
    act(() => root.unmount());
  });

  it('sends the language of the app, for an account it creates', async () => {
    localStorage.clear();
    api.getIdToken.mockResolvedValue('firebase-id-token');
    api.loginWithFirebase.mockClear().mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    });
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <OAuthButtons />
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    const google = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('continue_with_google'),
    )!;
    await act(async () => google.click());

    expect(api.loginWithFirebase.mock.calls[0][0]).toMatchObject({
      idToken: 'firebase-id-token',
      language: 'IT',
    });
    act(() => root.unmount());
  });
});
