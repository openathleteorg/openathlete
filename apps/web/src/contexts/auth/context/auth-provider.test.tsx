// @vitest-environment jsdom
import { AxiosError } from 'axios';
import { act, useContext } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthConsumer } from './auth-consumer';
import { AuthContext } from './auth-context';
import { AuthProvider } from './auth-provider';

const api = vi.hoisted(() => ({ getMe: vi.fn() }));
vi.mock('@/api/user', () => ({ UserAPI: api }));
vi.mock('@/utils/push-notifications', () => ({
  initializePushNotifications: () => Promise.resolve(),
  sendPendingTokenIfAny: () => undefined,
}));
vi.mock('@/utils/time-zone', () => ({ saveTimeZone: () => Promise.resolve() }));
vi.mock('posthog-js', () => ({
  default: { identify: vi.fn(), capture: vi.fn(), reset: vi.fn() },
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const offline = () =>
  new AxiosError('Network Error', AxiosError.ERR_NETWORK, undefined);
const user = { userId: 1, roles: ['ATHLETE'], language: 'EN' };

describe('auth start without a connection', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    api.getMe.mockReset();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });
  const start = () =>
    act(async () =>
      root.render(
        <AuthProvider>
          <AuthConsumer>
            <p>app</p>
          </AuthConsumer>
        </AuthProvider>,
      ),
    );
  const text = () => container.textContent ?? '';

  it('shows the offline screen instead of signing out, and retries', async () => {
    api.getMe.mockRejectedValueOnce(offline()).mockResolvedValue(user);
    await start();
    expect(text()).toContain('offline_title');
    expect(text()).not.toContain('app');

    await act(async () => container.querySelector('button')!.click());
    expect(text()).toBe('app');
  });

  it('retries by itself once back online', async () => {
    api.getMe.mockRejectedValueOnce(offline()).mockResolvedValue(user);
    await start();
    expect(text()).toContain('offline_title');

    await act(async () => window.dispatchEvent(new Event('online')));
    expect(text()).toBe('app');
  });

  it('recovers without an online event after a temporary startup failure', async () => {
    api.getMe.mockRejectedValueOnce(offline()).mockResolvedValue(user);
    await start();
    expect(text()).toContain('offline_title');
    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(text()).toBe('app');
    const calls = api.getMe.mock.calls.length;
    await act(async () => vi.advanceTimersByTimeAsync(60_000));
    expect(api.getMe).toHaveBeenCalledTimes(calls);
  });

  it('rechecks when returning to the app while the phone stayed connected', async () => {
    api.getMe.mockRejectedValueOnce(offline()).mockResolvedValue(user);
    await start();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(api.getMe).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    await act(async () =>
      document.dispatchEvent(new Event('visibilitychange')),
    );
    expect(text()).toBe('app');
  });

  it('coalesces retry, focus and online events during an in-flight check', async () => {
    let finish!: (value: typeof user) => void;
    api.getMe.mockRejectedValueOnce(offline()).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await start();
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('online'));
      container.querySelector('button')!.click();
    });
    expect(api.getMe).toHaveBeenCalledTimes(2);
    await act(async () => finish(user));
    expect(text()).toBe('app');
  });

  it('backs off while the API remains unreachable', async () => {
    api.getMe.mockRejectedValue(offline());
    await start();
    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(api.getMe).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(api.getMe).toHaveBeenCalledTimes(3);
    await act(async () => vi.advanceTimersByTimeAsync(3_999));
    expect(api.getMe).toHaveBeenCalledTimes(3);
  });

  it('still treats an answered failure as signed out', async () => {
    api.getMe.mockRejectedValue(
      new AxiosError(
        'Unauthorized',
        AxiosError.ERR_BAD_REQUEST,
        undefined,
        null,
        {
          status: 401,
          statusText: '',
          data: {},
          headers: {},
          config: {} as never,
        },
      ),
    );
    await start();
    expect(text()).toBe('app');
  });

  it('does not restore a session from a request that finishes after logout', async () => {
    let finish!: (value: typeof user) => void;
    let logout!: () => Promise<void>;
    api.getMe.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    function Session() {
      const auth = useContext(AuthContext);
      logout = async () => {
        await auth.logout(() => undefined);
      };
      return <p>{auth.user ? 'signed-in' : 'signed-out'}</p>;
    }
    await act(async () =>
      root.render(
        <AuthProvider>
          <Session />
        </AuthProvider>,
      ),
    );
    await act(async () => logout());
    await act(async () => finish(user));
    expect(text()).toBe('signed-out');
  });
});
