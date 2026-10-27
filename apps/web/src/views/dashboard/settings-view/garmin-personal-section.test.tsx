// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GarminPersonalStatus } from '@openathlete/shared';

import { GarminPersonalSection } from './garmin-personal-section';

const state = vi.hoisted(() => ({ userId: 1 }));
const api = vi.hoisted(() => ({
  status: vi.fn(),
  reviews: vi.fn(),
  previewReview: vi.fn(),
  resolveReview: vi.fn(),
  connect: vi.fn(),
  preferences: vi.fn(),
  disconnect: vi.fn(),
  sync: vi.fn(),
}));
vi.mock('@/api/garmin-personal/garmin-personal.api', () => ({
  GarminPersonalAPI: api,
}));
vi.mock('@/api/activity-review/activity-review.hooks', () => ({
  useActivityReviewsQuery: () => ({ data: undefined }),
}));
vi.mock('@/api/user', () => ({
  useGetMeQuery: () => ({ data: { userId: state.userId } }),
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const disconnected: GarminPersonalStatus = {
  connected: false,
  preferences: { activities: false, automatic: false },
  status: 'disconnected',
  error: null,
  result: null,
  lastSyncedAt: null,
};

describe('Garmin Personal settings', () => {
  let element: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let cache: QueryClient;
  const render = async (mode: 'connection' | 'sync' = 'connection') => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={cache}>
          <MemoryRouter>
            <GarminPersonalSection mode={mode} />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  };
  const key = () =>
    element.querySelector<HTMLInputElement>('#garmin-personal-key')!;
  const fill = async (input: HTMLInputElement, value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  const button = (text: string) =>
    [...element.querySelectorAll('button')].find(
      (v) => v.textContent === text,
    )!;
  beforeEach(() => {
    vi.resetAllMocks();
    state.userId = 1;
    api.status.mockResolvedValue(disconnected);
    api.reviews.mockResolvedValue({ total: 0, items: [], nextCursor: null });
    cache = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    element = document.createElement('div');
    root = createRoot(element);
  });
  afterEach(() => {
    act(() => root.unmount());
    cache.clear();
  });

  it('requires separate activity consent and clears a rejected key', async () => {
    api.connect.mockRejectedValue(new Error('synthetic rejection'));
    await render();
    expect(element.querySelector('#garmin-personal-activities')).toBeNull();
    await fill(key(), 'synthetic-personal-key');
    await act(async () =>
      element
        .querySelector('form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        ),
    );
    await render();
    expect(api.connect).toHaveBeenCalledWith(
      { apiKey: 'synthetic-personal-key', activities: false, automatic: false },
      expect.anything(),
    );
    expect(key().value).toBe('');
  });
  it('clears a draft key when switching users', async () => {
    await render();
    await fill(key(), 'synthetic-personal-key');
    expect(key().value).toBe('synthetic-personal-key');
    state.userId = 2;
    await render();
    expect(key().value).toBe('');
    expect(cache.getQueryData(['garmin-personal', 2])).toEqual(disconnected);
  });
  it('shows queued work without claiming completion or starting it again', async () => {
    api.status.mockResolvedValue({
      ...disconnected,
      connected: true,
      preferences: { activities: true, automatic: false },
      status: 'queued',
    });
    await render('sync');
    expect(element.querySelector('[role=status]')?.textContent).toBe(
      'garmin_personal_queued',
    );
    expect(button('garmin_personal_sync').disabled).toBe(true);
    expect(element.querySelector('#garmin-personal-key')).toBeNull();
    expect(element.textContent).not.toContain('garmin_personal_disconnect');
    expect(api.sync).not.toHaveBeenCalled();
  });
  it('separates an import failure from the accepted key', async () => {
    api.status.mockResolvedValue({
      ...disconnected,
      connected: true,
      preferences: { activities: true, automatic: false },
      status: 'failed',
      error: 'unavailable',
    });
    await render('sync');
    expect(element.textContent).toContain('garmin_personal_key_accepted');
    expect(element.querySelector('[role=alert]')?.textContent).toBe(
      'garmin_personal_import_failed',
    );
    expect(element.textContent).not.toContain('garmin_personal_key_required');
    expect(element.textContent).not.toContain('garmin_personal_request_failed');
  });
  it('does not claim the key is accepted after Garmin rejects it', async () => {
    api.status.mockResolvedValue({
      ...disconnected,
      connected: true,
      preferences: { activities: true, automatic: false },
      status: 'key_required',
      error: 'key_required',
    });
    await render('sync');
    expect(element.textContent).not.toContain('garmin_personal_key_accepted');
    expect(element.querySelector('[role=alert]')?.textContent).toBe(
      'garmin_personal_key_required',
    );
  });
  it('keeps sync controls and import errors out of connection settings', async () => {
    api.status.mockResolvedValue({
      ...disconnected,
      connected: true,
      preferences: { activities: true, automatic: true },
      status: 'failed',
      error: 'unavailable',
    });
    await render();
    expect(key()).not.toBeNull();
    expect(element.textContent).toContain('garmin_personal_key_accepted');
    expect(element.querySelector('#garmin-personal-automatic')).toBeNull();
    expect(element.querySelector('#garmin-personal-start')).toBeNull();
    expect(element.querySelector('[role=alert]')).toBeNull();
    expect(element.querySelector('[role=status]')?.textContent).toBe(
      'garmin_personal_idle',
    );
  });
});
