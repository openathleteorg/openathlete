// @vitest-environment jsdom
import { waitUntil } from '@/utils/test/wait-until';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityAlertSettings } from './activity-alert-settings';

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock('@/utils/axios', () => ({ default: api }));
vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({ user: { userId: 7 } }),
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const settings = {
  notifyComments: true,
  notifyRpe: true,
  notifyNewActivities: true,
};

describe('per-athlete notification settings', () => {
  let container: HTMLDivElement;
  let root: Root;
  let cache: QueryClient;
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue({ data: settings });
    api.put
      .mockReset()
      .mockImplementation(async (_path: string, data: typeof settings) => ({
        data,
      }));
    cache = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    cache.clear();
    container.remove();
  });
  const render = async (athleteId = 12) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={cache}>
          <ActivityAlertSettings athleteId={athleteId} />
        </QueryClientProvider>,
      ),
    );
    await waitUntil(
      () => !!container.querySelector('[role="switch"], [role="alert"]'),
    );
  };
  it('changes only the selected switch for the selected athlete', async () => {
    await render();
    const switches =
      container.querySelectorAll<HTMLButtonElement>('[role="switch"]');
    expect(switches).toHaveLength(3);
    await act(async () => switches[1].click());
    await waitUntil(() =>
      expect(api.put).toHaveBeenCalledWith(
        '/messages/activity-alert-settings/12',
        { ...settings, notifyRpe: false },
      ),
    );
    await waitUntil(() =>
      expect(switches[1].getAttribute('aria-checked')).toBe('false'),
    );
    expect(switches[0].getAttribute('aria-checked')).toBe('true');
    await render(13);
    expect(api.get).toHaveBeenCalledWith(
      '/messages/activity-alert-settings/13',
    );
    await waitUntil(() =>
      expect(
        container
          .querySelectorAll('[role="switch"]')[1]
          .getAttribute('aria-checked'),
      ).toBe('true'),
    );
  });
  it('offers a retry after access or loading fails', async () => {
    api.get.mockRejectedValue(new Error('Forbidden'));
    await render();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector('[role="switch"]')).toBeNull();
    api.get.mockResolvedValue({ data: settings });
    await act(async () =>
      container.querySelector<HTMLButtonElement>('button')!.click(),
    );
    await waitUntil(() =>
      expect(container.querySelectorAll('[role="switch"]')).toHaveLength(3),
    );
  });
  it('keeps the saved preference when an update fails', async () => {
    api.put.mockRejectedValue(new Error('Unavailable'));
    await render();
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[role="switch"]')!.click(),
    );
    await waitUntil(() => !!container.querySelector('[role="alert"]'));
    expect(
      container.querySelector('[role="switch"]')?.getAttribute('aria-checked'),
    ).toBe('true');
  });
});
