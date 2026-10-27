import { HealthWorkoutUploadError } from '@/api/activity/healthkit-workout-error';
// @vitest-environment jsdom
import { type ReactNode, act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthKitWorkoutsSection } from './healthkit-workouts-section';

const native = vi.hoisted(() => ({
  available: true,
  accountID: 42,
  workoutStatus: vi.fn(),
  readWorkouts: vi.fn(),
  clearWorkouts: vi.fn(),
  selectSource: vi.fn(),
  send: vi.fn(),
  syncSettings: vi.fn(),
}));
vi.mock('@/api/activity/healthkit-workout-import', () => ({
  sendHealthWorkouts: native.send,
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/utils/healthkit', () => ({
  healthKitTypes: [
    'heartRateVariabilitySDNN',
    'restingHeartRate',
    'sleepAnalysis',
    'bodyMass',
    'bodyFatPercentage',
  ],
  hasLocalHealthKit: () => native.available,
  localHealthKit: native,
}));
vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({ user: { userId: native.accountID } }),
}));
vi.mock('@/utils/capacitor', () => ({
  getApiBaseUrl: () => 'https://train.example.org/api',
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
vi.mock('./settings-section', () => ({
  SettingsSection: ({ children }: { children: ReactNode }) => (
    <section>{children}</section>
  ),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const empty = { available: true, hasMore: false, reading: false, workouts: [] };
const loaded = {
  ...empty,
  lastRead: '2026-10-20T08:30:00Z',
  selection: { historyDays: 30, includeSensors: true, includeRoute: false },
  workouts: [
    {
      uuid: '12345678-1234-4234-8234-123456789abc',
      revision: 1,
      sport: 'RUNNING',
      start: '2026-10-20T08:00:00Z',
      duration: 1800,
    },
  ],
};
describe('consented Apple Watch activity controls', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.clearAllMocks();
    const preferences = new Map<
      string,
      { scope: string; read: boolean; upload: boolean; automatic: boolean }
    >();
    native.syncSettings.mockImplementation(async (options) => {
      const key = `${options.apiBaseURL}:${options.accountID}:${options.kind}`;
      const scope = JSON.stringify(
        'types' in options.selection
          ? { ...options.selection, types: [...options.selection.types].sort() }
          : options.selection,
      );
      const previous = preferences.get(key);
      const value =
        previous?.scope === scope
          ? previous
          : { scope, read: false, upload: false, automatic: false };
      for (const flag of ['read', 'upload', 'automatic'] as const)
        if (options[flag] !== undefined) value[flag] = options[flag];
      if (!value.read || !value.upload) value.automatic = false;
      preferences.set(key, value);
      return {
        read: value.read,
        upload: value.upload,
        automatic: value.automatic,
      };
    });
    native.available = true;
    native.accountID = 42;
    native.workoutStatus.mockResolvedValue(empty);
    native.readWorkouts.mockResolvedValue(loaded);
    native.send.mockResolvedValue({
      created: 0,
      matched: 0,
      enriched: 1,
      unchanged: 0,
      needs_review: 0,
    });
    native.clearWorkouts.mockResolvedValue(empty);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const render = () =>
    act(async () => root.render(<HealthKitWorkoutsSection />));
  const button = (label: string) =>
    [...container.querySelectorAll('button')].find(
      (node) => node.textContent === label,
    )!;
  const box = (label: string) =>
    [...container.querySelectorAll('label')]
      .find((node) => node.textContent === label)!
      .querySelector<HTMLButtonElement>('button')!;
  it('mounts without Health authorization or uploads and defaults GPS off', async () => {
    await render();
    expect(native.workoutStatus).toHaveBeenCalled();
    expect(native.readWorkouts).not.toHaveBeenCalled();
    expect(native.send).not.toHaveBeenCalled();
    expect(button('healthkit_workouts_read').disabled).toBe(true);
    expect(box('healthkit_workouts_route').getAttribute('aria-checked')).toBe(
      'false',
    );
  });
  it('requires a read action with consent and a separate send action with consent', async () => {
    await render();
    await act(async () => box('healthkit_workouts_read_consent').click());
    await act(async () => button('healthkit_workouts_read').click());
    expect(native.readWorkouts).toHaveBeenCalledWith({
      apiBaseURL: 'https://train.example.org/api',
      accountID: '42',
      historyDays: 30,
      includeSensors: true,
      includeRoute: false,
      localConsent: true,
    });
    expect(native.send).not.toHaveBeenCalled();
    expect(button('healthkit_workouts_send').disabled).toBe(true);
    await act(async () => box('healthkit_workouts_send_consent').click());
    await act(async () => button('healthkit_workouts_send').click());
    expect(native.send).toHaveBeenCalledWith(
      expect.objectContaining({
        consent: true,
        uuids: [loaded.workouts[0].uuid],
      }),
    );
    expect(button('healthkit_workouts_send').disabled).toBe(false);
  });
  it('requires another read and fresh consent after adding GPS', async () => {
    native.workoutStatus.mockResolvedValue(loaded);
    await render();
    await act(async () => box('healthkit_workouts_send_consent').click());
    expect(button('healthkit_workouts_send').disabled).toBe(false);
    await act(async () => box('healthkit_workouts_route').click());
    expect(button('healthkit_workouts_send').disabled).toBe(true);
    expect(button('healthkit_workouts_read').disabled).toBe(true);
    expect(native.readWorkouts).not.toHaveBeenCalled();
    expect(native.send).not.toHaveBeenCalled();
  });
  it('discards an earlier account’s pending read', async () => {
    let finish!: (value: typeof loaded) => void;
    native.readWorkouts.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await render();
    await act(async () => box('healthkit_workouts_read_consent').click());
    await act(async () => button('healthkit_workouts_read').click());
    native.accountID = 43;
    await render();
    await act(async () => finish(loaded));
    expect(container.textContent).not.toContain('healthkit_workouts_count');
    expect(native.send).not.toHaveBeenCalled();
  });
  it('remembers consent and automatic sync across closing and reopening settings', async () => {
    native.workoutStatus.mockResolvedValue(loaded);
    await render();
    await act(async () => box('healthkit_workouts_read_consent').click());
    await act(async () => box('healthkit_workouts_send_consent').click());
    await act(async () => box('healthkit_auto_enable').click());
    expect(native.syncSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ read: true, upload: true, automatic: true }),
    );
    act(() => root.unmount());
    root = createRoot(container);
    await render();
    expect(
      box('healthkit_workouts_read_consent').getAttribute('aria-checked'),
    ).toBe('true');
    expect(
      box('healthkit_workouts_send_consent').getAttribute('aria-checked'),
    ).toBe('true');
    expect(box('healthkit_auto_enable').getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(native.readWorkouts).not.toHaveBeenCalled();
    expect(native.send).not.toHaveBeenCalled();
  });
  it('shows safe failure details while keeping consent and the preview for retry', async () => {
    native.workoutStatus.mockResolvedValue(loaded);
    native.send.mockRejectedValueOnce(
      new HealthWorkoutUploadError(
        { response: { status: 409, data: 'private detail' } },
        'upload',
        2,
      ),
    );
    await render();
    await act(async () => box('healthkit_workouts_read_consent').click());
    await act(async () => box('healthkit_workouts_send_consent').click());
    await act(async () => button('healthkit_workouts_send').click());
    expect(container.textContent).toContain('healthkit_upload_conflict');
    expect(container.textContent).toContain(
      'healthkit_workouts_failure_reference',
    );
    expect(container.textContent).not.toContain('private detail');
    expect(
      box('healthkit_workouts_send_consent').getAttribute('aria-checked'),
    ).toBe('true');
    expect(button('healthkit_workouts_send').disabled).toBe(false);
    expect(native.clearWorkouts).not.toHaveBeenCalled();
  });
  it('turns automatic sync off when upload consent is revoked', async () => {
    native.workoutStatus.mockResolvedValue(loaded);
    await render();
    await act(async () => box('healthkit_workouts_read_consent').click());
    await act(async () => box('healthkit_workouts_send_consent').click());
    await act(async () => box('healthkit_auto_enable').click());
    await act(async () => box('healthkit_workouts_send_consent').click());
    expect(native.syncSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ read: true, upload: false, automatic: false }),
    );
    expect(box('healthkit_auto_enable').getAttribute('aria-checked')).toBe(
      'false',
    );
  });
  it('requires fresh consent for another account or a wider route scope', async () => {
    native.workoutStatus.mockResolvedValue(loaded);
    await render();
    await act(async () => box('healthkit_workouts_read_consent').click());
    await act(async () => box('healthkit_workouts_send_consent').click());
    await act(async () => box('healthkit_auto_enable').click());
    native.accountID = 43;
    await render();
    expect(
      box('healthkit_workouts_read_consent').getAttribute('aria-checked'),
    ).toBe('false');
    expect(
      box('healthkit_workouts_send_consent').getAttribute('aria-checked'),
    ).toBe('false');
    expect(box('healthkit_auto_enable').getAttribute('aria-checked')).toBe(
      'false',
    );
  });
});
