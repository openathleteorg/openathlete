// @vitest-environment jsdom
import { AxiosError } from 'axios';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthConsumer } from './auth-consumer';
import { AuthProvider } from './auth-provider';

const api = vi.hoisted(() => ({ getMe: vi.fn() }));
vi.mock('@/api/user', () => ({ UserAPI: api }));
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

const offline = () =>
  new AxiosError('Network Error', AxiosError.ERR_NETWORK, undefined);
const answered = (status: number) =>
  new AxiosError(
    'Request failed',
    AxiosError.ERR_BAD_RESPONSE,
    undefined,
    null,
    {
      status,
      statusText: '',
      data: {},
      headers: {},
      config: {} as never,
    },
  );
const user = { userId: 1, roles: ['ATHLETE'], language: 'EN' };

describe('auth start without a connection', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    api.getMe.mockReset();
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

  it.each([429, 500, 503])(
    'shows the offline screen when the API answers %i, and retries',
    async (status) => {
      api.getMe.mockRejectedValueOnce(answered(status)).mockResolvedValue(user);
      await start();
      expect(text()).toContain('offline_title');

      await act(async () => container.querySelector('button')!.click());
      expect(text()).toBe('app');
    },
  );

  it('treats a 401 as signed out', async () => {
    api.getMe.mockRejectedValue(answered(401));
    await start();
    expect(text()).toBe('app');
  });
});
