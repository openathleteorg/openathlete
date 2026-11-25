// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerSelection } from './server-selection';

const state = vi.hoisted(() => ({
  fence: vi.fn(),
  disconnect: vi.fn(),
  save: vi.fn(),
  resolve: vi.fn(),
  current: 'https://old.example.org/api',
}));

vi.mock('@/utils/capacitor', () => ({
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
  disconnectWatchSchedule: state.disconnect,
}));
vi.mock('@/utils/firebase-auth', () => ({
  signOutFirebase: () => Promise.resolve(),
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
    state.fence.mockReset();
    state.disconnect.mockReset();
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
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'apple_watch_server_switch_blocked',
    );
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
    expect(state.disconnect).toHaveBeenCalledTimes(1);
    expect(state.save).toHaveBeenCalledTimes(1);
  });
});
