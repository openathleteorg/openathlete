// @vitest-environment jsdom
import { useAuthContext } from '@/contexts/auth';
import { AxiosError } from 'axios';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthConsumer } from './auth-consumer';
import { AuthProvider } from './auth-provider';

const api = vi.hoisted(() => ({ getMe: vi.fn() }));
const watch = vi.hoisted(() => ({
  latch: vi.fn(),
  establish: vi.fn(),
  fence: vi.fn(),
  disconnect: vi.fn(),
  mark: vi.fn(),
}));
vi.mock('@/api/user', () => ({ UserAPI: api }));
vi.mock('@/utils/watch-schedule', () => ({
  latchWatchScheduleExit: watch.latch,
  establishWatchScheduleSession: watch.establish,
  fenceWatchScheduleOnExit: watch.fence,
  disconnectWatchScheduleOnExit: watch.disconnect,
  markFenceUnconfirmed: watch.mark,
  watchScheduleExitBoundary: () => null,
}));
vi.mock('@/utils/push-notifications', () => ({
  initializePushNotifications: () => Promise.resolve(),
  sendPendingTokenIfAny: () => undefined,
}));
vi.mock('@/utils/firebase-auth', () => ({
  signOutFirebase: () => Promise.resolve(),
}));
vi.mock('@/utils/language-choice', () => ({
  saveLanguageChoice: () => Promise.resolve(),
}));
vi.mock('@/utils/time-zone', () => ({
  saveTimeZone: () => Promise.resolve(),
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

const offline = () =>
  new AxiosError('Network Error', AxiosError.ERR_NETWORK, undefined);
const user = { userId: 1, roles: ['ATHLETE'], language: 'EN' };

function LogoutProbe() {
  const { logout } = useAuthContext();
  return <button onClick={() => logout(() => undefined)}>logout</button>;
}

describe('auth start without a connection', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    api.getMe.mockReset();
    watch.latch.mockReset();
    watch.establish.mockReset();
    watch.fence.mockReset();
    watch.fence.mockResolvedValue(true);
    watch.disconnect.mockReset();
    watch.mark.mockReset();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
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

  it('establishes the watch session only after an authenticated successor', async () => {
    api.getMe.mockResolvedValue(user);
    await start();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(watch.establish).toHaveBeenCalledTimes(1);
  });

  it('latches the watch exit before waiting for the native fence', async () => {
    api.getMe.mockResolvedValue(user);
    await act(async () =>
      root.render(
        <AuthProvider>
          <AuthConsumer>
            <LogoutProbe />
          </AuthConsumer>
        </AuthProvider>,
      ),
    );
    await act(async () => container.querySelector('button')!.click());

    expect(watch.latch).toHaveBeenCalledTimes(1);
    expect(watch.fence).toHaveBeenCalledTimes(1);
    const latchOrder = watch.latch.mock.invocationCallOrder[0];
    const fenceOrder = watch.fence.mock.invocationCallOrder[0];
    expect(latchOrder).toBeLessThan(fenceOrder);
    expect(watch.mark).not.toHaveBeenCalled();
  });
});
