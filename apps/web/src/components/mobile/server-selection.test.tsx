// @vitest-environment jsdom
import {
  beginAuthLogin,
  commitAuthLogin,
  storedAccessToken,
} from '@/utils/auth-attempt';
import { deferred } from '@/utils/test/deferred';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerSelection } from './server-selection';

const state = vi.hoisted(() => ({
  fence: vi.fn(),
  signOutFirebase: vi.fn(),
  disconnect: vi.fn(),
  recover: vi.fn(),
  activeScope: null as { instanceURL: string; athleteId: number } | null,
  latch: vi.fn(),
  release: vi.fn(),
  save: vi.fn(),
  resolve: vi.fn(),
  current: 'https://old.example.org/api',
}));

vi.mock(
  '@/utils/auth-login-lock',
  () => import('@/utils/test/auth-login-lock'),
);

vi.mock('@/utils/capacitor', () => ({
  getApiBaseUrl: () => state.current,
  getDefaultApiBaseUrl: () => 'https://api.openathlete.org',
}));
vi.mock('@/utils/mobile-server', () => ({
  getSelectedServerUrl: () => state.current,
  isServerChange: () => true,
  resolveServerUrl: state.resolve,
  saveSelectedServerUrl: state.save,
  serverUrlCandidates: () => ['https://api.openathlete.org'],
}));
vi.mock('@/utils/watch-schedule', () => ({
  fenceWatchScheduleOnExit: state.fence,
  disconnectWatchScheduleOnExit: state.disconnect,
  recoverWatchScheduleCleanup: state.recover,
  watchScheduleActiveScope: () => state.activeScope,
  watchScheduleExitBoundary: () => 7,
  latchWatchScheduleExit: state.latch,
  releaseWatchScheduleExit: state.release,
}));
vi.mock('@/utils/firebase-auth', () => ({
  signOutFirebase: state.signOutFirebase,
}));
vi.mock('posthog-js', () => ({
  default: { reset: vi.fn() },
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('server selection and Apple Watch scheduling', () => {
  let element: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  const flush = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  beforeEach(() => {
    localStorage.clear();
    state.signOutFirebase.mockReset().mockResolvedValue(undefined);
    state.fence.mockReset();
    state.disconnect.mockReset();
    state.recover.mockReset().mockResolvedValue(true);
    state.activeScope = null;
    state.latch.mockReset();
    state.release.mockReset();
    state.latch.mockReturnValue(7);
    state.save.mockReset();
    state.resolve.mockReset();
    state.current = 'https://old.example.org/api';
    element = document.createElement('div');
    document.body.appendChild(element);
    root = createRoot(element);
  });

  afterEach(() => {
    act(() => root.unmount());
    element.remove();
    vi.clearAllMocks();
  });

  const clickContinue = async () => {
    const button = [...element.querySelectorAll('button')].find(
      (item) => item.textContent === 'mobile_server_continue',
    )!;
    await act(async () => button.click());
  };

  const selectDefault = async () => {
    const defaultRadio = element.querySelector<HTMLInputElement>(
      'input[value="default"]',
    )!;
    await act(async () => defaultRadio.click());
  };

  it('ignores a URL resolution after the user cancels', async () => {
    const resolution = deferred<string>();
    state.resolve.mockReturnValueOnce(resolution.promise);
    state.fence.mockResolvedValue(true);
    state.disconnect.mockResolvedValue(null);
    await act(async () => root.render(<ServerSelection onCancel={() => {}} />));
    await clickContinue();
    expect(state.resolve).toHaveBeenCalledTimes(1);
    await act(async () => {
      [...element.querySelectorAll('button')]
        .find((item) => item.textContent === 'cancel')!
        .click();
    });
    await act(async () => resolution.resolve('https://new.example.org/api'));

    expect(state.signOutFirebase).not.toHaveBeenCalled();
    expect(state.fence).not.toHaveBeenCalled();
    expect(state.save).not.toHaveBeenCalled();
  });

  it('disables cancellation after Firebase sign-out starts', async () => {
    const firebase = deferred<void>();
    const onCancel = vi.fn();
    state.signOutFirebase.mockReturnValueOnce(firebase.promise);
    state.fence.mockResolvedValue(true);
    await act(async () => root.render(<ServerSelection onCancel={onCancel} />));
    await selectDefault();
    await clickContinue();
    expect(state.signOutFirebase).toHaveBeenCalledTimes(1);

    const cancel = [...element.querySelectorAll('button')].find(
      (item) => item.textContent === 'cancel',
    )!;
    expect(cancel.disabled).toBe(true);
    await act(async () => cancel.click());
    expect(onCancel).not.toHaveBeenCalled();

    await act(async () => firebase.resolve());
    expect(state.fence).toHaveBeenCalledTimes(1);
  });

  it('keeps a successor login that commits while Firebase signs out', async () => {
    const firebase = deferred<void>();
    state.signOutFirebase.mockReturnValueOnce(firebase.promise);
    state.fence.mockResolvedValue(true);
    state.disconnect.mockResolvedValue(null);
    state.save.mockImplementation(() => localStorage.clear());
    await commitAuthLogin(await beginAuthLogin(), 'original-token');
    await act(async () => root.render(<ServerSelection />));
    await selectDefault();
    await clickContinue();

    await commitAuthLogin(await beginAuthLogin(), 'successor-token');
    await act(async () => firebase.resolve());

    expect(storedAccessToken()).toBe('successor-token');
    expect(state.save).not.toHaveBeenCalled();
  });

  it('keeps a successor login that commits while the fence is pending', async () => {
    const fence = deferred<boolean>();
    state.fence.mockReturnValueOnce(fence.promise);
    state.disconnect.mockResolvedValue(null);
    state.save.mockImplementation(() => localStorage.clear());
    await commitAuthLogin(await beginAuthLogin(), 'original-token');
    await act(async () => root.render(<ServerSelection />));
    await selectDefault();
    await clickContinue();
    expect(state.fence).toHaveBeenCalledTimes(1);

    await commitAuthLogin(await beginAuthLogin(), 'successor-token');
    await act(async () => fence.resolve(true));

    expect(storedAccessToken()).toBe('successor-token');
    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.release).not.toHaveBeenCalled();
  });

  it('does not switch servers when the native fence is not acknowledged', async () => {
    state.fence.mockResolvedValue(false);
    await act(async () => root.render(<ServerSelection />));

    const defaultRadio = element.querySelector<HTMLInputElement>(
      'input[value="default"]',
    )!;
    await act(async () => defaultRadio.click());
    const continueButton = [...element.querySelectorAll('button')].find(
      (item) => item.textContent?.includes('mobile_server_continue'),
    )!;
    await act(async () => continueButton.click());
    await flush();

    expect(state.fence).toHaveBeenCalledTimes(1);
    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.save).not.toHaveBeenCalled();
    expect(state.latch).toHaveBeenCalledTimes(1);
    expect(state.release).toHaveBeenCalledWith(7);
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'apple_watch_server_switch_blocked',
    );
  });

  it('disconnects only the original watch scope after the fence acknowledges', async () => {
    const scope = { instanceURL: state.current, athleteId: 7 };
    state.activeScope = scope;
    state.fence.mockResolvedValue(true);
    state.disconnect.mockResolvedValue(null);
    state.save.mockReturnValue(false);
    await act(async () => root.render(<ServerSelection />));
    await selectDefault();
    await clickContinue();

    expect(state.disconnect).toHaveBeenCalledWith(scope);
    expect(state.recover).not.toHaveBeenCalled();
  });

  it('releases the boundary if the screen unmounts while waiting for the fence', async () => {
    const fence = deferred<boolean>();
    state.fence.mockReturnValueOnce(fence.promise);
    state.disconnect.mockResolvedValue(null);
    await act(async () => root.render(<ServerSelection />));
    await selectDefault();
    await clickContinue();
    expect(state.fence).toHaveBeenCalledTimes(1);

    await act(async () => root.render(null));
    await act(async () => fence.resolve(true));

    expect(state.release).toHaveBeenCalledWith(7);
    expect(state.save).not.toHaveBeenCalled();
    expect(state.recover).not.toHaveBeenCalled();
  });

  it('switches after an acknowledged fence', async () => {
    state.fence.mockResolvedValue(true);
    state.disconnect.mockResolvedValue(null);
    state.save.mockReturnValue(false);
    await act(async () => root.render(<ServerSelection />));

    const defaultRadio = element.querySelector<HTMLInputElement>(
      'input[value="default"]',
    )!;
    await act(async () => defaultRadio.click());
    const continueButton = [...element.querySelectorAll('button')].find(
      (item) => item.textContent?.includes('mobile_server_continue'),
    )!;
    await act(async () => continueButton.click());
    await flush();

    expect(state.fence).toHaveBeenCalledTimes(1);
    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.recover).toHaveBeenCalledTimes(1);
    expect(state.save).toHaveBeenCalledTimes(1);
    expect(state.latch).toHaveBeenCalledTimes(1);
    expect(state.release).toHaveBeenCalledWith(7);
  });
});
