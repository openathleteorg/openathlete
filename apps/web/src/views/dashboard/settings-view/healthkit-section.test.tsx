// @vitest-environment jsdom
import { type ReactNode, act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthKitSection } from './healthkit-section';

const native = vi.hoisted(() => ({
  available: true,
  accountID: 42,
  status: vi.fn(),
  read: vi.fn(),
  clear: vi.fn(),
  selectSource: vi.fn(),
  send: vi.fn(),
  syncSettings: vi.fn(),
}));
vi.mock('@/api/metric/health-metric-import', () => ({
  sendHealthSummaries: native.send,
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

const empty = {
  available: true,
  supportedTypes: [
    'heartRateVariabilitySDNN',
    'restingHeartRate',
    'sleepAnalysis',
    'bodyMass',
    'bodyFatPercentage',
  ],
  sampleCount: 0,
  reading: false,
  hasMore: false,
  summaryExportAvailable: true,
  summaryCount: 0,
  metrics: [],
  sleep: [],
  sources: [],
};

describe('HealthKit local preview controls', () => {
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
    native.status.mockResolvedValue(empty);
    native.send.mockResolvedValue({ imported: 1, skipped: 0 });
    native.clear.mockResolvedValue(empty);
    native.read.mockResolvedValue({
      ...empty,
      lastRead: '2026-01-15T12:00:00Z',
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });
  const render = () => act(async () => root.render(<HealthKitSection />));
  const button = (label: string) =>
    Array.from(container.querySelectorAll('button')).find(
      (item) => item.textContent === label,
    )!;

  it('does not read HealthKit on mount or without explicit consent', async () => {
    await render();
    expect(native.status).toHaveBeenCalledWith({
      apiBaseURL: 'https://train.example.org/api',
      accountID: '42',
    });
    expect(native.read).not.toHaveBeenCalled();
    expect(button('healthkit_read').disabled).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reads only after local consent, and never uploads', async () => {
    await render();
    const checkboxes = container.querySelectorAll<HTMLButtonElement>(
      'button[role="checkbox"]',
    );
    await act(async () => checkboxes[checkboxes.length - 1].click());
    await act(async () => button('healthkit_read').click());
    expect(native.read).toHaveBeenCalledWith(
      expect.objectContaining({
        localConsent: true,
        historyDays: 30,
        accountID: '42',
        apiBaseURL: 'https://train.example.org/api',
        types: [
          'heartRateVariabilitySDNN',
          'restingHeartRate',
          'sleepAnalysis',
        ],
      }),
    );
    expect(container.textContent).toContain('healthkit_no_readable_data');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('resets consent when the category selection changes', async () => {
    await render();
    const checkboxes = container.querySelectorAll<HTMLButtonElement>(
      'button[role="checkbox"]',
    );
    await act(async () => checkboxes[checkboxes.length - 1].click());
    expect(button('healthkit_read').disabled).toBe(false);
    await act(async () => checkboxes[0].click());
    expect(button('healthkit_read').disabled).toBe(true);
  });

  it('requires confirmation before clearing cached data', async () => {
    native.status.mockResolvedValue({ ...empty, sampleCount: 1 });
    await render();
    await act(async () => button('healthkit_clear').click());
    expect(native.clear).not.toHaveBeenCalled();
    await act(async () => button('healthkit_clear_confirm').click());
    expect(native.clear).toHaveBeenCalledWith({
      apiBaseURL: 'https://train.example.org/api',
      accountID: '42',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('offers local-cache recovery if protected storage cannot be decoded', async () => {
    native.status.mockRejectedValue(new Error('corrupt local file'));
    await render();
    expect(container.textContent).toContain('healthkit_read_failed');
    expect(button('healthkit_clear')).toBeDefined();
  });

  it('discards a previous account’s read result after the account changes', async () => {
    let finish!: (value: typeof empty) => void;
    native.read.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await render();
    const checkboxes = container.querySelectorAll<HTMLButtonElement>(
      'button[role="checkbox"]',
    );
    await act(async () => checkboxes[checkboxes.length - 1].click());
    await act(async () => button('healthkit_read').click());
    native.accountID = 43;
    await render();
    await act(async () => finish({ ...empty, sampleCount: 123 }));
    expect(container.textContent).not.toContain('healthkit_stored');
    expect(native.status).toHaveBeenLastCalledWith({
      apiBaseURL: 'https://train.example.org/api',
      accountID: '43',
    });
  });

  it('does not expose the feature in unsupported runtimes', async () => {
    native.available = false;
    await render();
    expect(container.textContent).toBe('');
    expect(native.status).not.toHaveBeenCalled();
  });

  it('offers body measurements without enabling them by default', async () => {
    await render();
    const weight = Array.from(
      container.querySelectorAll<HTMLLabelElement>('label'),
    ).find((label) => label.textContent === 'metric_weight');
    const bodyFat = Array.from(
      container.querySelectorAll<HTMLLabelElement>('label'),
    ).find((label) => label.textContent === 'metric_body_fat');
    expect(weight?.querySelector('button')?.getAttribute('aria-checked')).toBe(
      'false',
    );
    expect(bodyFat?.querySelector('button')?.getAttribute('aria-checked')).toBe(
      'false',
    );
    expect(native.read).not.toHaveBeenCalled();
  });

  it('shows normalized sleep without conflict warnings or a single-source picker', async () => {
    native.status.mockResolvedValue({
      ...empty,
      sampleCount: 1,
      sleep: [
        {
          date: '2026-01-15',
          core: 6.95,
          deep: 0,
          rem: 0,
          unspecified: 1,
          awake: 0.05,
          hasConflicts: true,
        },
      ],
      sources: [
        {
          type: 'sleepAnalysis',
          id: 'watch',
          name: 'Watch',
          selected: true,
          count: 3,
        },
      ],
    });
    await render();
    expect(container.textContent).toContain('healthkit_stages');
    expect(container.textContent).not.toContain('healthkit_stage_conflict');
    expect(container.textContent).not.toContain('healthkit_source');
  });

  it('requires separate upload consent and does not send anything on mount', async () => {
    native.status.mockResolvedValue({
      ...empty,
      sampleCount: 1,
      summaryCount: 1,
      lastRead: '2026-01-15T12:00:00Z',
      selection: {
        types: empty.supportedTypes,
        historyDays: 30,
        timeZone: 'Europe/Berlin',
      },
    });
    await render();
    expect(native.send).not.toHaveBeenCalled();
    expect(button('healthkit_send').disabled).toBe(true);
    await act(async () =>
      Array.from(container.querySelectorAll('label'))
        .find((label) => label.textContent === 'healthkit_send_consent')!
        .querySelector<HTMLButtonElement>('button')!
        .click(),
    );
    await act(async () => button('healthkit_send').click());
    expect(native.send).toHaveBeenCalledWith(
      expect.objectContaining({
        binding: {
          apiBaseURL: 'https://train.example.org/api',
          accountID: '42',
        },
        consent: true,
      }),
    );
    expect(container.textContent).toContain('healthkit_sent');
    expect(button('healthkit_send').disabled).toBe(false);
  });

  it('requires a new read after changing the scope before sending', async () => {
    native.status.mockResolvedValue({
      ...empty,
      sampleCount: 1,
      summaryCount: 1,
      lastRead: '2026-01-15T12:00:00Z',
      selection: {
        types: empty.supportedTypes,
        historyDays: 30,
        timeZone: 'Europe/Berlin',
      },
    });
    await render();
    const boxes = container.querySelectorAll<HTMLButtonElement>(
      'button[role="checkbox"]',
    );
    await act(async () =>
      Array.from(container.querySelectorAll('label'))
        .find((label) => label.textContent === 'healthkit_send_consent')!
        .querySelector<HTMLButtonElement>('button')!
        .click(),
    );
    expect(button('healthkit_send').disabled).toBe(false);
    await act(async () => boxes[0].click());
    expect(button('healthkit_send').disabled).toBe(true);
    expect(native.send).not.toHaveBeenCalled();
  });
});
