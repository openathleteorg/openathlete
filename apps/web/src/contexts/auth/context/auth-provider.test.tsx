// @vitest-environment jsdom
import { useAuthContext } from '@/contexts/auth';
import { installAuthTokens } from '@/utils/auth-attempt';
import { ACCESS_TOKEN } from '@/utils/local-storage';
import { AxiosError } from 'axios';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthConsumer } from './auth-consumer';
import { AuthProvider } from './auth-provider';

const api = vi.hoisted(() => ({ getMe: vi.fn() }));
const auth = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
const watch = vi.hoisted(() => ({
  latch: vi.fn(),
  establish: vi.fn(),
  fence: vi.fn(),
  disconnect: vi.fn(),
  mark: vi.fn(),
  boundary: null as number | null,
  latched: false,
  sessionEpoch: 0,
  activeScope: null as { instanceURL: string; athleteId: number } | null,
}));
vi.mock('@/api/user', () => ({ UserAPI: api }));
vi.mock('@/utils/auth', () => ({ getAccessToken: auth.getAccessToken }));
vi.mock('@/utils/watch-schedule', () => ({
  latchWatchScheduleExit: watch.latch,
  establishWatchScheduleSession: watch.establish,
  fenceWatchScheduleOnExit: watch.fence,
  disconnectWatchScheduleOnExit: watch.disconnect,
  markFenceUnconfirmed: watch.mark,
  watchScheduleExitBoundary: () => watch.boundary,
  isWatchScheduleExitLatched: () => watch.latched,
  watchScheduleSessionEpoch: () => watch.sessionEpoch,
  watchScheduleActiveScope: () => watch.activeScope,
  forgetWatchScheduleScope: vi.fn(),
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

function InitializeProbe() {
  const { initialize } = useAuthContext();
  return (
    <button onClick={() => void initialize({ authenticated: true })}>
      authenticate
    </button>
  );
}

describe('auth start without a connection', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    api.getMe.mockReset();
    auth.getAccessToken.mockReset();
    localStorage.clear();
    localStorage.setItem(ACCESS_TOKEN, 'token-a');
    auth.getAccessToken.mockResolvedValue({
      accessToken: 'token-a',
      refreshed: false,
    });
    watch.latch.mockReset();
    watch.establish.mockReset();
    watch.establish.mockReturnValue(true);
    watch.fence.mockReset();
    watch.fence.mockResolvedValue(true);
    watch.disconnect.mockReset();
    watch.disconnect.mockResolvedValue(null);
    watch.mark.mockReset();
    watch.boundary = null;
    watch.latched = false;
    watch.sessionEpoch = 0;
    watch.activeScope = null;
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

  it('does not establish a successor from a bootstrap getMe', async () => {
    api.getMe.mockResolvedValue(user);
    await start();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(watch.establish).not.toHaveBeenCalled();
    expect(text()).toBe('app');
  });

  it('establishes the successor only for an explicit authentication', async () => {
    api.getMe.mockResolvedValue(user);
    await act(async () =>
      root.render(
        <AuthProvider>
          <AuthConsumer>
            <InitializeProbe />
          </AuthConsumer>
        </AuthProvider>,
      ),
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    watch.establish.mockClear();

    await act(async () => container.querySelector('button')!.click());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(watch.establish).toHaveBeenCalledTimes(1);
    expect(watch.establish).toHaveBeenCalledWith(null);
  });

  it('never publishes a stale user or clears a newer exit', async () => {
    let resolveGetMe: ((value: unknown) => void) | null = null;
    api.getMe.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGetMe = resolve;
        }),
    );
    await act(async () =>
      root.render(
        <AuthProvider>
          <AuthConsumer>
            <p>app</p>
          </AuthConsumer>
        </AuthProvider>,
      ),
    );
    watch.boundary = 7;
    watch.latched = true;
    await act(async () => {
      resolveGetMe?.(user);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(watch.establish).not.toHaveBeenCalled();
    expect(watch.latched).toBe(true);
    expect(text()).not.toBe('app');
  });

  it('drops a bootstrap response after a successor already signed in', async () => {
    let resolveGetMe: ((value: unknown) => void) | null = null;
    api.getMe.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGetMe = resolve;
        }),
    );
    await act(async () =>
      root.render(
        <AuthProvider>
          <AuthConsumer>
            <p>app</p>
          </AuthConsumer>
        </AuthProvider>,
      ),
    );
    // The successor establishes and releases the latch, but this old getMe is
    // still in flight with the previous bearer.
    watch.sessionEpoch += 1;
    watch.latched = false;
    await act(async () => {
      resolveGetMe?.(user);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(text()).not.toBe('app');
  });

  it('never publishes an old getMe response with the winning token', async () => {
    let resolveGetMe: ((value: unknown) => void) | null = null;
    api.getMe.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGetMe = resolve;
        }),
    );
    await act(async () =>
      root.render(
        <AuthProvider>
          <AuthConsumer>
            <p>app</p>
          </AuthConsumer>
        </AuthProvider>,
      ),
    );
    // Another login commits its token while A's getMe is still in flight.
    act(() => installAuthTokens('token-b', 'refresh-b'));
    await act(async () => {
      resolveGetMe?.(user);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(text()).not.toBe('app');
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
    expect(watch.establish).not.toHaveBeenCalled();
  });

  it('marks a missed exit with its original scope and disconnects only it', async () => {
    const previous = {
      instanceURL: 'https://train.example.org/api',
      athleteId: 7,
    };
    watch.activeScope = previous;
    watch.latch.mockReturnValue(1);
    watch.boundary = 1;
    watch.fence.mockResolvedValue(false);
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
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(watch.mark).toHaveBeenCalledWith(previous, 'fence');
    expect(watch.disconnect).toHaveBeenCalledWith(previous);
  });

  it('never signs out a newer session from a stale 401', async () => {
    let rejectGetMe!: (error: unknown) => void;
    api.getMe.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectGetMe = reject;
        }),
    );
    await act(async () =>
      root.render(
        <AuthProvider>
          <AuthConsumer>
            <p>app</p>
          </AuthConsumer>
        </AuthProvider>,
      ),
    );
    act(() => installAuthTokens('token-b', 'refresh-b'));
    await act(async () => {
      rejectGetMe(
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
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
    expect(text()).not.toContain('offline_title');
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
