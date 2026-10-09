// @vitest-environment jsdom
import { AuthConsumer, AuthProvider, useAuthContext } from '@/contexts/auth';
import { ACCESS_TOKEN } from '@/utils/local-storage';
import { queryClient } from '@/utils/query-client';
import { waitUntil } from '@/utils/test/wait-until';
import { QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import {
  Outlet,
  RouterProvider,
  createMemoryRouter,
  useNavigate,
} from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthGuard } from './auth-guard';

const api = vi.hoisted(() => ({ getMe: vi.fn() }));
vi.mock('@/api/user/user.api', () => ({ UserAPI: { getMe: api.getMe } }));
vi.mock('@/utils/push-notifications', () => ({
  initializePushNotifications: () => Promise.resolve(),
  sendPendingTokenIfAny: () => undefined,
}));
vi.mock('posthog-js', () => ({
  default: { identify: vi.fn(), capture: vi.fn(), reset: vi.fn() },
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const tokenOf = (userId: number) =>
  ['e30', btoa(JSON.stringify({ userId, exp: 4102444800 })), 'sig'].join('.');
const accounts: Record<string, object> = {
  [tokenOf(1)]: { userId: 1, roles: ['ATHLETE'], onboardingCompleted: true },
  [tokenOf(2)]: { userId: 2, roles: ['ATHLETE'], onboardingCompleted: false },
};

// Like the sidebar's menu
function Calendar() {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  return (
    <button onClick={() => logout((path) => navigate(path, { replace: true }))}>
      calendar
    </button>
  );
}

// Like the Google button: the API created the account and returned tokens
function SignIn() {
  const { initialize } = useAuthContext();
  const navigate = useNavigate();
  return (
    <button
      onClick={async () => {
        localStorage.setItem(ACCESS_TOKEN, tokenOf(2));
        await initialize();
        navigate('/dashboard/calendar');
      }}
    >
      sign in
    </button>
  );
}

describe('AuthGuard', () => {
  let container: HTMLDivElement;
  let root: Root;
  const defaults = queryClient.getDefaultOptions();

  beforeEach(() => {
    queryClient.clear();
    // A signed-out request fails at once instead of retrying for seconds
    queryClient.setDefaultOptions({
      ...defaults,
      queries: { ...defaults.queries, retry: false },
    });
    localStorage.clear();
    api.getMe.mockReset();
    api.getMe.mockImplementation(async () => {
      const account = accounts[localStorage.getItem(ACCESS_TOKEN) ?? ''];
      if (!account) throw new Error('401');
      return account;
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.setDefaultOptions(defaults);
  });

  const click = async (label: string) => {
    await waitUntil(() =>
      expect(
        [...container.querySelectorAll('button')].map((b) => b.textContent),
      ).toContain(label),
    );
    await act(async () => {
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent === label)!
        .click();
    });
  };

  it('sends a new account to the onboarding after another one logged out in the same tab', async () => {
    localStorage.setItem(ACCESS_TOKEN, tokenOf(1));
    const router = createMemoryRouter(
      [
        { path: '/auth/login', element: <SignIn /> },
        {
          path: '/dashboard',
          element: (
            <AuthGuard>
              <Outlet />
            </AuthGuard>
          ),
          children: [
            { path: '/dashboard/calendar', element: <Calendar /> },
            { path: '/dashboard/onboarding', element: <p>onboarding</p> },
          ],
        },
      ],
      { initialEntries: ['/dashboard/calendar'] },
    );
    const at = (pathname: string) =>
      waitUntil(() => expect(router.state.location.pathname).toBe(pathname));
    await act(async () =>
      root.render(
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AuthConsumer>
              <RouterProvider router={router} />
            </AuthConsumer>
          </QueryClientProvider>
        </AuthProvider>,
      ),
    );
    await at('/dashboard/calendar');

    await click('calendar');
    await at('/auth/login');

    await click('sign in');
    await at('/dashboard/onboarding');
    await waitUntil(() => expect(container.textContent).toBe('onboarding'));
  });
});
