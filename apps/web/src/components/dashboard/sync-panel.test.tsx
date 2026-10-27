// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncPanel } from './sync-panel';

const mock = vi.hoisted(() => ({
  overview: vi.fn(),
  sync: vi.fn(),
  invalidate: vi.fn(),
  native: true,
  account: 42,
}));
vi.mock('@/api/instance', () => ({
  useInstanceInfoQuery: () => ({ data: { activityReview: true } }),
}));
vi.mock('./activity-reviews', () => ({
  ActivityReviews: () => <div>Activity review</div>,
}));
vi.mock('@/components/zwift/zwift-sync', () => ({ ZwiftSync: () => null }));
vi.mock('./garmin-personal-sync', () => ({
  GarminPersonalSync: () => <div>Garmin sync</div>,
}));
vi.mock('./strava-sync', () => ({ StravaSync: () => <div>Strava sync</div> }));
vi.mock('@/api/provider/provider.hooks', () => ({
  useGetConnectedProvidersQuery: () => ({
    data: [
      { provider: 'STRAVA', status: 'active', importActivitiesEnabled: true },
    ],
  }),
}));
vi.mock('@/utils/capacitor', () => ({
  getApiBaseUrl: () => 'https://train.example.org/api',
}));
vi.mock('@/utils/healthkit', () => ({
  hasLocalHealthKit: () => mock.native,
  localHealthKit: { syncOverview: mock.overview },
}));
vi.mock('@/utils/healthkit-manual-sync', () => ({
  syncApprovedHealth: mock.sync,
}));
vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({ user: { userId: mock.account } }),
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mock.invalidate }),
}));
vi.mock('@/components/import-fit-dialog/import-fit-dialog', () => ({
  ImportFitDialog: ({ triggerLabel }: { triggerLabel: string }) => (
    <button>{triggerLabel}</button>
  ),
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const approved = { read: true, upload: true, automatic: false, selection: {} };
describe('dedicated sync and import panel', () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = () =>
    act(async () => {
      root.render(
        <MemoryRouter>
          <SyncPanel />
        </MemoryRouter>,
      );
    });
  const button = (text: string) =>
    [...container.querySelectorAll('button')].find(
      (item) => item.textContent === text,
    )!;
  beforeEach(() => {
    vi.resetAllMocks();
    mock.native = true;
    mock.account = 42;
    mock.overview.mockResolvedValue({
      busy: false,
      workouts: approved,
      measurements: approved,
    });
    mock.sync.mockResolvedValue({ count: 3, complete: true });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  it('makes file import visible and does not start reading/uploading just by opening the sync page', async () => {
    await render();
    expect(button('sync_import_file')).toBeDefined();
    expect(button('sync_health_now').disabled).toBe(false);
    expect(mock.sync).not.toHaveBeenCalled();
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      '/dashboard/settings?tab=connectors',
    );
    expect(container.textContent).toContain('Strava sync');
    expect(container.textContent).toContain('Garmin sync');
    expect(container.textContent).toContain('Activity review');
  });
  it('syncs both approved Health scopes and retains separate results if one fails', async () => {
    mock.sync.mockRejectedValueOnce(new Error('private sample text'));
    await render();
    await act(async () => button('sync_health_now').click());
    expect(mock.sync.mock.calls.map((call) => call[0].kind)).toEqual([
      'workouts',
      'measurements',
    ]);
    expect(container.textContent).toContain('sync_source_failed');
    expect(container.textContent).toContain('sync_source_done');
    expect(container.textContent).not.toContain('private sample text');
    expect(mock.invalidate).toHaveBeenCalled();
  });
  it('asks to review permissions rather than sign in when consent was revoked', async () => {
    mock.sync.mockRejectedValueOnce(new Error('HEALTH_IMPORT_NOT_AUTHORIZED'));
    await render();
    await act(async () => button('sync_health_now').click());
    expect(container.textContent).toContain('sync_health_setup');
    expect(container.textContent).not.toContain('healthkit_upload_login');
  });
  it('does not offer sync without approval, while leaving file import available', async () => {
    mock.overview.mockResolvedValue({ busy: false });
    await render();
    expect(button('sync_health_now').disabled).toBe(true);
    expect(container.textContent).toContain('sync_health_setup');
    expect(button('sync_import_file').disabled).toBe(false);
    expect(mock.sync).not.toHaveBeenCalled();
  });
  it('aborts the old account’s sync on navigation and ignores its late result', async () => {
    let finish!: (value: { count: number; complete: boolean }) => void;
    mock.sync.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await render();
    await act(async () => button('sync_health_now').click());
    const signal = mock.sync.mock.calls[0]![0].signal;
    mock.account = 43;
    await render();
    expect(signal.aborted).toBe(true);
    await act(async () => finish({ count: 3, complete: true }));
    expect(container.textContent).not.toContain('sync_source_done');
    expect(mock.sync).toHaveBeenCalledTimes(1);
  });
});
