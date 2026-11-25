// @vitest-environment jsdom
import type {
  WatchScheduleResult,
  WatchScheduleStatus,
} from '@/utils/watch-schedule';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppleWatchScheduleSection } from './apple-watch-schedule';

const state = vi.hoisted(() => ({
  available: true,
  status: null as unknown,
  sessionEpoch: 0,
  resolveCredential: null as ((value: unknown) => void) | null,
  getStatus: vi.fn(),
  connect: vi.fn(),
  refresh: vi.fn(),
  disconnect: vi.fn(),
  recover: vi.fn(),
  credential: vi.fn(),
  scope: vi.fn(),
}));

vi.mock('@/utils/watch-schedule', () => ({
  isAppleWatchScheduleAvailable: () => state.available,
  hasFenceUnconfirmed: () => false,
  clearFenceUnconfirmed: vi.fn(),
  fenceWatchScheduleOnExit: vi.fn().mockResolvedValue(true),
  watchScheduleSessionEpoch: () => state.sessionEpoch,
  isWatchScheduleSessionCurrent: (epoch: number) =>
    epoch === state.sessionEpoch,
  recoverWatchScheduleCleanup: state.recover,
  getWatchScheduleStatus: state.getStatus,
  connectWatchSchedule: state.connect,
  refreshWatchSchedule: state.refresh,
  disconnectWatchSchedule: state.disconnect,
  watchScheduleCredential: state.credential,
  watchScheduleScope: state.scope,
}));
vi.mock('@/api/athlete', () => ({
  useGetMyAthleteQuery: () => ({
    data: { athleteId: 7 },
    isLoading: false,
  }),
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
// The confirmation dialog is not the behaviour under test; keep it reachable
// through a plain button.
vi.mock('@/components/confirm-action', () => ({
  ConfirmAction: ({
    open,
    onConfirm,
    title,
    message,
  }: {
    open: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
  }) =>
    open ? (
      <button type="button" data-confirm onClick={onConfirm}>
        {title}
        {message}
      </button>
    ) : null,
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const scope = { instanceURL: 'https://train.example.org/api', athleteId: 7 };
const credential = {
  accessToken: 'access-token',
  expiresAt: '2026-11-25T12:00:00.000Z',
};

function status(
  overrides: Partial<WatchScheduleStatus> = {},
): WatchScheduleStatus {
  return {
    enabled: false,
    hasOtherAccountOptIn: false,
    permission: 'authorized',
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastErrorCode: null,
    counts: {
      scheduled: 0,
      confirmed: 0,
      unchanged: 0,
      replaced: 0,
      removed: 0,
      completed: 0,
      retained: 0,
      overflow: 0,
      failed: 0,
    },
    skipped: [],
    pendingCleanupEventIDs: [],
    unresolvedEventIDs: [],
    localPendingEventIDs: [],
    otherAccountPending: false,
    cleanupPending: false,
    cleanupUnknown: false,
    ...overrides,
  };
}

function result(
  overrides: Partial<WatchScheduleResult> = {},
): WatchScheduleResult {
  return {
    outcome: 'synced',
    deferral: null,
    code: null,
    status: status(),
    ...overrides,
  };
}

describe('Apple Watch settings', () => {
  let element: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  const flush = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  const render = async () => {
    await act(async () => {
      root.render(<AppleWatchScheduleSection />);
    });
    await flush();
  };

  const text = () => element.textContent ?? '';
  const button = (label: string) =>
    [...element.querySelectorAll<HTMLButtonElement>('button')].find((item) =>
      item.textContent?.includes(label),
    );

  beforeEach(() => {
    state.available = true;
    state.getStatus.mockReset();
    state.connect.mockReset();
    state.refresh.mockReset();
    state.disconnect.mockReset();
    state.credential.mockReset();
    state.recover.mockReset();
    state.recover.mockResolvedValue(true);
    state.sessionEpoch = 0;
    state.resolveCredential = null;
    state.scope.mockReset();
    state.scope.mockReturnValue(scope);
    state.credential.mockResolvedValue(credential);
    state.getStatus.mockResolvedValue(status());
    state.disconnect.mockResolvedValue(null);
    element = document.createElement('div');
    document.body.appendChild(element);
    root = createRoot(element);
  });

  afterEach(() => {
    act(() => root.unmount());
    element.remove();
    vi.clearAllMocks();
  });

  it('shows no entry on the web or Android', async () => {
    state.available = false;

    await render();

    expect(element.innerHTML).toBe('');
    expect(state.getStatus).not.toHaveBeenCalled();
  });

  it('explains an unsupported iPhone instead of offering scheduling', async () => {
    state.getStatus.mockResolvedValue(status({ permission: 'unsupported' }));

    await render();

    expect(text()).toContain('apple_watch_unsupported_device');
    expect(text()).not.toContain('apple_watch_permission_denied');
    expect(button('apple_watch_enable')).toBeUndefined();
  });

  it('shows how to re-enable a denied permission and blocks refresh', async () => {
    state.getStatus.mockResolvedValue(
      status({
        enabled: true,
        permission: 'denied',
        lastSuccessAt: '2026-11-25T10:00:00.000Z',
      }),
    );

    await render();

    expect(text()).toContain('apple_watch_permission_denied');
    expect(button('apple_watch_refresh')?.disabled).toBe(true);
    expect(state.connect).not.toHaveBeenCalled();
  });

  it('enables scheduling with the current access credential only', async () => {
    state.connect.mockResolvedValue(
      result({ status: status({ enabled: true }) }),
    );

    await render();
    const enable = button('apple_watch_enable');
    expect(enable).toBeDefined();

    await act(async () => enable!.click());
    await flush();

    expect(state.connect).toHaveBeenCalledWith(scope, credential);
    expect(text()).toContain('apple_watch_connected');
    expect(toast.success).toHaveBeenCalledWith('apple_watch_refreshed');
  });

  it('drops a connect whose token resolves after logout', async () => {
    state.credential.mockImplementation(
      () =>
        new Promise((resolve) => {
          state.resolveCredential = resolve;
        }),
    );

    await render();
    await act(async () => button('apple_watch_enable')!.click());
    state.sessionEpoch += 1;
    state.resolveCredential?.(credential);
    await flush();

    expect(state.connect).not.toHaveBeenCalled();
    expect(text()).not.toContain('apple_watch_connected');
  });

  it('pauses on an unreadable cleanup without an unscoped disconnect', async () => {
    state.getStatus.mockResolvedValue(
      status({ enabled: true, cleanupUnknown: true }),
    );

    await render();

    expect(state.disconnect).not.toHaveBeenCalled();
    expect(state.recover).not.toHaveBeenCalled();
    expect(text()).toContain('apple_watch_cleanup_unknown');
  });

  it('refreshes explicitly on demand', async () => {
    state.getStatus.mockResolvedValue(
      status({
        enabled: true,
        lastSuccessAt: '2026-11-25T10:00:00.000Z',
      }),
    );
    state.refresh.mockResolvedValue(
      result({
        status: status({
          enabled: true,
          lastSuccessAt: '2026-11-25T11:00:00.000Z',
        }),
      }),
    );

    await render();
    await act(async () => button('apple_watch_refresh')!.click());
    await flush();

    expect(state.refresh).toHaveBeenCalledWith(scope, credential, 'manual');
    expect(text()).toContain('apple_watch_last_success');
    expect(text()).toContain('apple_watch_connected');
  });

  it('shows the last success, skipped reasons and overflow count', async () => {
    state.getStatus.mockResolvedValue(
      status({
        enabled: true,
        lastSuccessAt: '2026-11-25T09:30:00.000Z',
        skipped: [
          {
            eventId: 201,
            startDate: '2026-11-26T08:00:00.000Z',
            reasonCode: 'poolSwimmingUnverified',
            retryable: false,
          },
          {
            eventId: 202,
            startDate: '2026-11-27T08:00:00.000Z',
            reasonCode: 'zonesUnavailable',
            retryable: true,
          },
        ],
        counts: {
          ...status().counts,
          overflow: 2,
        },
      }),
    );

    await render();

    expect(text()).toContain('apple_watch_last_success');
    expect(text()).toContain('apple_watch_skipped_title');
    expect(text()).toContain('apple_watch_skip_pool');
    expect(text()).toContain('apple_watch_skip_retry');
    expect(text()).toContain('apple_watch_overflow_count');
    expect(text()).toContain('apple_watch_pool_notice');
  });

  it('does not present a pending Apple write as delivered', async () => {
    state.getStatus.mockResolvedValue(
      status({
        enabled: true,
        unresolvedEventIDs: [301],
        pendingCleanupEventIDs: [302],
        otherAccountPending: true,
      }),
    );

    await render();

    expect(text()).toContain('apple_watch_unresolved_write');
    expect(text()).toContain('apple_watch_pending_cleanup');
    expect(text()).toContain('apple_watch_other_account_pending');
  });

  it('separates safe-to-retry work from an Apple submitted write', async () => {
    state.getStatus.mockResolvedValue(
      status({
        enabled: true,
        localPendingEventIDs: [401],
        unresolvedEventIDs: [402],
      }),
    );

    await render();

    expect(text()).toContain('apple_watch_local_pending');
    expect(text()).toContain('apple_watch_unresolved_write');
  });

  it('asks for a fresh sign-in when the access token is gone', async () => {
    state.credential.mockResolvedValue(null);
    state.getStatus.mockResolvedValue(
      status({
        enabled: true,
        lastSuccessAt: '2026-11-25T10:00:00.000Z',
      }),
    );

    await render();
    await act(async () => button('apple_watch_refresh')!.click());
    await flush();

    expect(state.refresh).not.toHaveBeenCalled();
    expect(text()).toContain('apple_watch_sign_in_again');
  });

  it('cleans a previous account opt-in before showing this account', async () => {
    state.getStatus
      .mockResolvedValueOnce(status({ hasOtherAccountOptIn: true }))
      .mockResolvedValueOnce(status());
    state.disconnect.mockResolvedValue({
      athleteId: 9,
      instanceURL: 'https://train.example.org/api',
      removedEventIDs: [],
      retainedEventIDs: [],
      unresolvedEventIDs: [],
      purgedCredential: true,
      permission: 'authorized',
    });

    await render();

    expect(state.disconnect).toHaveBeenCalledWith();
    expect(state.getStatus).toHaveBeenCalledTimes(2);
    expect(text()).toContain('apple_watch_enable');
  });

  it('disconnects only this account after confirmation', async () => {
    state.getStatus.mockResolvedValue(status({ enabled: true }));
    state.getStatus.mockResolvedValueOnce(status({ enabled: true }));
    state.getStatus.mockResolvedValue(status());

    await render();
    await act(async () => button('apple_watch_disconnect')!.click());
    await flush();
    const confirm = element.querySelector<HTMLButtonElement>('[data-confirm]');
    expect(confirm).not.toBeNull();
    await act(async () => confirm!.click());
    await flush();

    expect(state.disconnect).toHaveBeenCalledWith(scope);
    expect(text()).toContain('apple_watch_enable');
  });

  it('surfaces a cleanup or credential retirement that did not finish', async () => {
    state.getStatus.mockResolvedValue(status({ enabled: true }));
    state.disconnect.mockResolvedValue({
      athleteId: 7,
      instanceURL: 'https://train.example.org/api',
      removedEventIDs: [12],
      retainedEventIDs: [],
      unresolvedEventIDs: [],
      purgedCredential: false,
      permission: 'authorized',
    });

    await render();
    await act(async () => button('apple_watch_disconnect')!.click());
    await flush();
    await act(async () =>
      element.querySelector<HTMLButtonElement>('[data-confirm]')!.click(),
    );
    await flush();

    expect(text()).toContain('apple_watch_cleanup_incomplete');
  });

  it('shows an unreadable cleanup state instead of claiming it is clear', async () => {
    state.getStatus.mockResolvedValue(
      status({ enabled: true, cleanupUnknown: true }),
    );

    await render();

    expect(text()).toContain('apple_watch_cleanup_unknown');
  });
});
