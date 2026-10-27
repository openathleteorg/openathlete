// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityReviews } from './activity-reviews';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  prepare: vi.fn(),
  resolve: vi.fn(),
}));
vi.mock('@/api/activity-review/activity-review.api', () => ({
  ActivityReviewAPI: api,
}));
vi.mock('@/utils/capacitor', () => ({
  getApiBaseUrl: () => 'https://train.example.org/api',
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn() } }));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const summary = {
  name: 'Synthetic recording',
  sport: 'CYCLING',
  startDate: '2020-01-02T09:00:00Z',
  endDate: '2020-01-02T10:00:00Z',
  distance: 10000,
};
const item = {
  id: 'source:12',
  revision: 2,
  provider: 'APPLE_HEALTH',
  externalId: '12345',
  summary,
  canImport: true,
  canLoadDetails: false,
  candidates: [
    {
      ...summary,
      name: 'Edited existing ride',
      provider: 'STRAVA',
      eventActivityId: 55,
      eventId: 77,
    },
  ],
};

describe('shared activity review', () => {
  let element: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let cache: QueryClient;
  const render = async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={cache}>
          <ActivityReviews userId={1} />
        </QueryClientProvider>,
      ),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
  };
  const button = (label: string) =>
    [...element.querySelectorAll('button')].find(
      (value) => value.textContent === label,
    )!;
  const click = async (label: string) => {
    await act(async () => button(label).click());
  };
  beforeEach(() => {
    vi.resetAllMocks();
    api.list.mockResolvedValue({
      total: 1,
      counts: { APPLE_HEALTH: 1 },
      items: [item],
      nextCursor: null,
    });
    api.resolve.mockResolvedValue({ resolved: true, pending: false });
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
  it('shows uploaded Apple Health and Strava comparisons without Garmin access or an import request', async () => {
    await render();
    expect(element.textContent).toContain('Apple Health');
    expect(element.textContent).toContain('Edited existing ride');
    expect(element.textContent).toContain('Strava');
    expect(api.resolve).not.toHaveBeenCalled();
    expect(api.prepare).not.toHaveBeenCalled();
  });
  it.each([
    [
      'activity_review_link',
      { id: 'source:12', revision: 2, action: 'link', eventActivityId: 55 },
    ],
    [
      'activity_review_import',
      { id: 'source:12', revision: 2, action: 'import' },
    ],
    [
      'activity_review_ignore',
      { id: 'source:12', revision: 2, action: 'ignore' },
    ],
  ])(
    'sends only the explicit %s decision and refreshes the list',
    async (label, decision) => {
      await render();
      api.list.mockResolvedValue({
        total: 0,
        counts: {},
        items: [],
        nextCursor: null,
      });
      await click(String(label));
      await render();
      expect(api.resolve).toHaveBeenCalledWith(decision, expect.anything());
      expect(element.textContent).toContain('activity_review_empty');
    },
  );
  it('automatically loads every legacy comparison and keeps the next one ready after a decision', async () => {
    let rows = [1, 2].map((id) => ({
      ...item,
      id: `garmin-personal:${id}`,
      provider: 'GARMIN_PERSONAL',
      revision: 1,
      summary: null as typeof summary | null,
      canLoadDetails: true,
    }));
    api.list.mockImplementation(async () => ({
      total: rows.length,
      counts: { GARMIN_PERSONAL: rows.length },
      items: rows,
      nextCursor: null,
    }));
    api.prepare.mockImplementation(async (id: string) => {
      rows = rows.map((row) =>
        row.id === id ? { ...row, summary: { ...summary, name: id } } : row,
      );
      return { loaded: true };
    });
    await render();
    await render();
    expect(api.prepare).toHaveBeenCalledTimes(2);
    expect(element.textContent).toContain('garmin-personal:1');
    expect(element.textContent).toContain('garmin-personal:2');
    api.resolve.mockImplementation(async ({ id }: { id: string }) => {
      rows = rows.filter((row) => row.id !== id);
      return { resolved: true, pending: false };
    });
    await click('activity_review_ignore');
    await render();
    expect(element.textContent).toContain('garmin-personal:2');
    expect(api.prepare).toHaveBeenCalledTimes(2);
    expect(button('activity_review_link').disabled).toBe(false);
  });
  it('offers a failed detail request its own retry without requiring an import', async () => {
    let ready = false;
    api.list.mockImplementation(async () => ({
      total: 1,
      counts: { GARMIN_PERSONAL: 1 },
      items: [
        {
          ...item,
          id: 'garmin-personal:1',
          provider: 'GARMIN_PERSONAL',
          summary: ready ? summary : null,
          canLoadDetails: true,
        },
      ],
      nextCursor: null,
    }));
    api.prepare.mockRejectedValueOnce(
      Object.assign(new Error('private upstream detail'), {
        isAxiosError: true,
        response: { status: 400, data: { message: 'imports_disabled' } },
      }),
    );
    await render();
    await render();
    expect(element.textContent).toContain('activity_review_details_failed');
    expect(element.textContent).not.toContain('private upstream detail');
    api.prepare.mockImplementation(async () => {
      ready = true;
      return { loaded: true };
    });
    await click('activity_review_retry_details');
    await render();
    expect(element.textContent).toContain('Synthetic recording');
    expect(api.resolve).not.toHaveBeenCalled();
  });
});
