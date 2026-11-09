// @vitest-environment jsdom
import { userKeys } from '@/api/user/user.keys';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { SubscriptionPlan, SubscriptionStatus } from '@openathlete/shared';

const state = vi.hoisted(() => ({
  updateAccount: vi.fn(),
  capture: vi.fn(),
}));
vi.mock('@/api/subscription', () => ({
  useCurrentSubscription: () => ({
    data: {
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      billingEnabled: true,
    },
  }),
}));
vi.mock('@/api/user', async () => {
  const { useQuery } = await import('@tanstack/react-query');
  const { userKeys } = await import('@/api/user/user.keys');
  return {
    useGetMeQuery: () =>
      useQuery({ queryKey: [userKeys.getMe], queryFn: () => null }),
    useUpdateAccountMutation: () => ({ mutate: state.updateAccount }),
  };
});
vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: state.capture }),
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'web', isNativePlatform: () => false },
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('useSupporterNudge', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  // Each test imports the hook afresh (it keeps the mention shown in module
  // state). Transforming its module graph cold can outlast a test's timeout
  // on a busy machine, so warm it once here
  beforeAll(async () => {
    await import('./use-supporter-nudge');
  }, 60_000);

  beforeEach(() => {
    vi.resetModules();
    state.updateAccount.mockClear();
    state.capture.mockClear();
    queryClient = new QueryClient();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function renderNudges(seenAt: Date | null) {
    queryClient.setQueryData([userKeys.getMe], {
      supporterNudgeSeenAt: seenAt,
    });
    const { useSupporterNudge } = await import('./use-supporter-nudge');
    function Nudge({ id }: { id: string }) {
      const visible = useSupporterNudge('year_review', id, true);
      return visible ? <p data-nudge={id} /> : null;
    }
    act(() =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <Nudge id="2025" />
          <Nudge id="2026" />
        </QueryClientProvider>,
      ),
    );
  }

  it('shows one mention at a time and dates it', async () => {
    await renderNudges(null);

    expect(container.querySelectorAll('[data-nudge]')).toHaveLength(1);
    expect(state.updateAccount).toHaveBeenCalledOnce();
    expect(state.updateAccount).toHaveBeenCalledWith({
      supporterNudgeSeen: true,
    });
    expect(state.capture).toHaveBeenCalledWith('supporter_nudge_viewed', {
      source: 'year_review',
    });
  });

  it('stays quiet for two weeks after the last one', async () => {
    await renderNudges(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));

    expect(container.querySelectorAll('[data-nudge]')).toHaveLength(0);
    expect(state.updateAccount).not.toHaveBeenCalled();
  });
});
