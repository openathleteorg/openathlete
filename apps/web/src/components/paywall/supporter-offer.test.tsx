// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SupporterOffer } from './supporter-offer';

const mocks = vi.hoisted(() => {
  class PurchaseCancelledError extends Error {}
  return {
    PurchaseCancelledError,
    channel: vi.fn<() => 'stripe' | 'app-store' | null>(() => 'stripe'),
    checkout: vi.fn(),
    purchase: vi.fn(),
    restore: vi.fn(),
    toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
  };
});

vi.mock('@/api/subscription', () => ({
  useCreateCheckout: () => ({ mutateAsync: mocks.checkout, isPending: false }),
  useAppStorePurchase: () => ({
    mutateAsync: mocks.purchase,
    isPending: false,
  }),
  useRestoreAppStorePurchases: () => ({
    mutateAsync: mocks.restore,
    isPending: false,
  }),
}));
vi.mock('@/utils/capacitor', () => ({ purchaseChannel: mocks.channel }));
vi.mock('@/utils/app-store', () => ({
  PurchaseCancelledError: mocks.PurchaseCancelledError,
  supporterPrices: async () => ({ month: '4,99 €', year: '49,99 €' }),
}));
vi.mock('@/utils/consent', () => ({
  privacyPolicyUrl: () => 'https://openathlete.org/privacy-policy',
}));
vi.mock('posthog-js/react', () => ({ usePostHog: () => undefined }));
vi.mock('sonner', () => ({ toast: mocks.toast }));
vi.mock('@/paraglide/runtime', () => ({ getLocale: () => 'en' }));
vi.mock('@/paraglide/messages', () => ({
  m: {
    plan_supporter_name: () => 'Supporter',
    supporter_interval_label: () => 'Billing',
    supporter_interval_monthly: () => 'Monthly',
    supporter_interval_yearly: () => 'Yearly',
    supporter_yearly_saving: () => '2 months free',
    supporter_price_month: ({ price }: { price: number }) => `€${price}/month`,
    supporter_price_year: ({ price }: { price: number }) => `€${price}/year`,
    supporter_perk_athletes: ({ count }: { count: number }) =>
      `Unlimited athletes (free: ${count})`,
    supporter_perk_ai: () => 'AI included',
    supporter_perk_project: () => 'Fund the project',
    supporter_cta: () => 'Become a Supporter',
    supporter_terms_consent: () => 'I accept the terms of sale',
    supporter_terms_link: () => 'Read the terms of sale',
    supporter_no_commitment: () => 'Cancel anytime',
    loading: () => 'Loading',
    subscription_checkout_error: () => 'Checkout failed',
    app_store_price_month: ({ price }: { price: string }) => `${price}/month`,
    app_store_price_year: ({ price }: { price: string }) => `${price}/year`,
    app_store_purchase_success: () => 'Thank you',
    app_store_purchase_error: () => 'Purchase failed',
    app_store_restore: () => 'Restore purchases',
    app_store_restore_success: () => 'Restored',
    app_store_restore_none: () => 'Nothing to restore',
    app_store_restore_error: () => 'Restore failed',
    app_store_products_unavailable: () => 'No prices',
    app_store_subscription_terms: () => 'Renews automatically',
    app_store_terms_of_use: () => 'Terms of use',
    app_store_privacy_policy: () => 'Privacy policy',
  },
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function render() {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const queryClient = new QueryClient();
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <SupporterOffer analyticsSource="test" />
      </QueryClientProvider>,
    ),
  );
  // Let the App Store prices query resolve
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const button = (name: string) =>
  [...container.querySelectorAll('button')].find((item) =>
    item.textContent?.includes(name),
  )!;

describe('SupporterOffer on the web (Stripe)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.channel.mockReturnValue('stripe');
    mocks.checkout.mockResolvedValue({ url: '#checkout' });
    await render();
  });

  const acceptTerms = () =>
    act(() =>
      container.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
    );

  it('shows both prices and the free-plan limit', () => {
    expect(container.textContent).toContain('€5/month');
    expect(container.textContent).toContain('€50/year');
    expect(container.textContent).toContain('Unlimited athletes (free: 5)');
  });

  it('waits for the terms of sale to be accepted', () => {
    expect(button('Become a Supporter').disabled).toBe(true);
    expect(container.querySelector('a[href$="/terms-of-sale"]')).not.toBeNull();

    acceptTerms();

    expect(button('Become a Supporter').disabled).toBe(false);
  });

  it('defaults to yearly billing', async () => {
    expect(button('Yearly').getAttribute('aria-checked')).toBe('true');

    acceptTerms();
    await act(async () => button('Become a Supporter').click());

    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ interval: 'year', acceptTerms: true }),
    );
  });

  it('checks out the interval the user picks', async () => {
    act(() => button('Monthly').click());
    acceptTerms();
    await act(async () => button('Become a Supporter').click());

    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ interval: 'month' }),
    );
  });
});

describe('SupporterOffer in the iOS app (App Store)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.channel.mockReturnValue('app-store');
    await render();
  });

  it("shows what App Review requires: Apple's prices, terms, links and restore", () => {
    expect(container.textContent).toContain('4,99 €/month');
    expect(container.textContent).toContain('49,99 €/year');
    expect(container.textContent).toContain('Renews automatically');
    expect(
      container.querySelector('a[href*="apple.com/legal"]')?.textContent,
    ).toBe('Terms of use');
    expect(
      container.querySelector('a[href$="/privacy-policy"]')?.textContent,
    ).toBe('Privacy policy');
    expect(button('Restore purchases')).toBeDefined();
  });

  it('neither sells through Stripe nor links to the web terms of sale', () => {
    expect(container.querySelector('[role="checkbox"]')).toBeNull();
    expect(container.querySelector('a[href$="/terms-of-sale"]')).toBeNull();
    expect(container.textContent).not.toContain('€5/month');
  });

  it('buys the interval the user picks through the App Store', async () => {
    mocks.purchase.mockResolvedValue({});
    act(() => button('Monthly').click());
    await act(async () => button('Become a Supporter').click());

    expect(mocks.purchase).toHaveBeenCalledWith('month');
    expect(mocks.checkout).not.toHaveBeenCalled();
    expect(mocks.toast.success).toHaveBeenCalledWith('Thank you');
  });

  it('stays quiet when the user closes the App Store sheet', async () => {
    mocks.purchase.mockRejectedValue(new mocks.PurchaseCancelledError());
    await act(async () => button('Become a Supporter').click());

    expect(mocks.toast.error).not.toHaveBeenCalled();
  });

  it('reports a failed purchase', async () => {
    mocks.purchase.mockRejectedValue(new Error('network'));
    await act(async () => button('Become a Supporter').click());

    expect(mocks.toast.error).toHaveBeenCalledWith('Purchase failed');
  });

  it('says when there is nothing to restore', async () => {
    mocks.restore.mockResolvedValue(false);
    await act(async () => button('Restore purchases').click());

    expect(mocks.toast.info).toHaveBeenCalledWith('Nothing to restore');
  });
});
