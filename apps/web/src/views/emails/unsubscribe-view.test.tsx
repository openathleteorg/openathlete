// @vitest-environment jsdom
import { waitUntil } from '@/utils/test/wait-until';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UnsubscribeView } from './unsubscribe-view';

const api = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  resubscribe: vi.fn(),
}));

vi.mock('@/api/emails/emails.api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  EmailsAPI: { unsubscribe: api.unsubscribe, resubscribe: api.resubscribe },
}));
// Every message renders as its key, with its parameters
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get: (_target, key) => (params?: Record<string, string>) =>
        params
          ? `${String(key)}(${Object.values(params).join(',')})`
          : String(key),
    },
  ),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('UnsubscribeView', () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = async (url: string) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[url]}>
            <UnsubscribeView />
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );
  };
  const click = async (label: string) => {
    const button = [...container.querySelectorAll('button')].find(
      (b) => b.textContent === label,
    );
    expect(button).toBeDefined();
    await act(async () => button!.click());
  };

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('asks first, then unsubscribes from the list of the token, and can undo', async () => {
    api.unsubscribe.mockResolvedValue(undefined);
    api.resubscribe.mockResolvedValue(undefined);
    await render('/emails/unsubscribe?token=7.recap.sig');

    expect(container.textContent).toContain(
      'unsubscribe_confirm_text(unsubscribe_list_recap)',
    );
    expect(api.unsubscribe).not.toHaveBeenCalled();

    await click('unsubscribe_confirm');
    await waitUntil(() =>
      container.textContent!.includes('unsubscribe_done_title'),
    );
    expect(api.unsubscribe).toHaveBeenCalledWith(
      '7.recap.sig',
      expect.anything(),
    );

    await click('unsubscribe_undo');
    await waitUntil(() =>
      container.textContent!.includes(
        'unsubscribe_resubscribed(unsubscribe_list_recap)',
      ),
    );
    expect(api.resubscribe).toHaveBeenCalledWith(
      '7.recap.sig',
      expect.anything(),
    );
  });

  it('says when the link is not valid', async () => {
    await render('/emails/unsubscribe?token=garbage');
    expect(container.textContent).toContain('unsubscribe_invalid');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      '/dashboard/settings?tab=profile',
    );
  });
});
