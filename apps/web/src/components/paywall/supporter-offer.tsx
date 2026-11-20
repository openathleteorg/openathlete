import {
  useAppStorePurchase,
  useCreateCheckout,
  useRestoreAppStorePurchases,
} from '@/api/subscription';
import { m } from '@/paraglide/messages';
import {
  AnalyticsEvent,
  analyticsErrorCodeFromUnknown,
} from '@/utils/analytics-events';
import { PurchaseCancelledError, supporterPrices } from '@/utils/app-store';
import { purchaseChannel } from '@/utils/capacitor';
import { privacyPolicyUrl } from '@/utils/consent';
import { cn } from '@/utils/shadcn';
import {
  FEATURED_SUPPORTER_TIER,
  featuredSupporterTier,
  sameTierIn,
  supporterPriceLabel,
  supporterTiers,
  termsOfSaleUrl,
} from '@/utils/supporter';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  BillingInterval,
  FREE_PLAN_MAX_ATHLETES,
  Feature,
  SubscriptionPlan,
  appleProductFor,
} from '@openathlete/shared';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { SparklesIcon } from '../ui/sparkles-icon';

/** Apple's standard licence agreement, the terms of App Store purchases */
const APPLE_STANDARD_EULA =
  'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

type OfferProps = {
  /** Where the offer was shown (PostHog) */
  analyticsSource: string;
  /** The locked feature whose paywall shows the offer */
  feature?: Feature;
  className?: string;
};

/**
 * The Supporter subscription: what it adds to the free plan, monthly or
 * yearly, at the tier the user picks (every tier gives the same), sold
 * through Stripe on the web and the App Store in the iOS app. Builds that
 * sell nothing (the Android app) never show it.
 */
export function SupporterOffer(props: OfferProps) {
  return purchaseChannel() === 'app-store' ? (
    <AppStoreSupporterOffer {...props} />
  ) : (
    <StripeSupporterOffer {...props} />
  );
}

function OfferHeader() {
  return (
    <div className="flex items-center gap-2">
      <SparklesIcon className="size-5 text-primary" />
      <h3 className="text-lg font-semibold">{m.plan_supporter_name()}</h3>
    </div>
  );
}

function IntervalPicker({
  value,
  onChange,
  priceLabel,
}: {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  priceLabel: (interval: BillingInterval) => string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={m.supporter_interval_label()}
      className="grid grid-cols-2 gap-2"
    >
      {[BillingInterval.MONTH, BillingInterval.YEAR].map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'flex min-h-11 flex-col items-start rounded-md border px-3 py-2 text-left text-sm transition-colors',
            value === option ? 'border-primary bg-primary/5' : 'hover:bg-muted',
          )}
        >
          <span className="flex flex-wrap items-center gap-2 font-medium">
            {option === BillingInterval.YEAR
              ? m.supporter_interval_yearly()
              : m.supporter_interval_monthly()}
            {option === BillingInterval.YEAR && (
              <Badge variant="secondary">{m.supporter_yearly_saving()}</Badge>
            )}
          </span>
          <span className="text-muted-foreground">{priceLabel(option)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The tier: a bigger contribution for the same perks. The suggested one is
 * preselected, and the lowest stays in sight.
 */
export function TierPicker({
  tiers,
  value,
  onChange,
  label,
}: {
  tiers: readonly number[];
  value: number;
  onChange: (amountCents: number) => void;
  label: (amountCents: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label={m.supporter_tier_label()}
        className="grid grid-cols-3 gap-2"
      >
        {tiers.map((tier, index) => (
          <button
            key={tier}
            type="button"
            role="radio"
            aria-checked={value === tier}
            onClick={() => onChange(tier)}
            className={cn(
              'flex min-h-11 flex-col items-center justify-center rounded-md border px-2 py-2 text-center text-sm transition-colors',
              value === tier ? 'border-primary bg-primary/5' : 'hover:bg-muted',
            )}
          >
            <span className="font-medium">{label(tier)}</span>
            {index === FEATURED_SUPPORTER_TIER && (
              <span className="text-xs text-primary">
                {m.supporter_tier_featured()}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{m.supporter_tier_note()}</p>
    </div>
  );
}

function SupporterPerks() {
  const perks = [
    m.supporter_perk_lab(),
    m.supporter_perk_early_access(),
    m.supporter_perk_coach_tools(),
    m.supporter_perk_athletes({ count: FREE_PLAN_MAX_ATHLETES }),
    m.supporter_perk_ai(),
    m.supporter_perk_badge(),
    m.supporter_perk_project(),
  ];
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{m.supporter_perks_title()}</p>
      <ul className="space-y-2">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
            <span>{perk}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StripeSupporterOffer({
  analyticsSource,
  feature,
  className,
}: OfferProps) {
  const posthog = usePostHog();
  const createCheckout = useCreateCheckout();
  const [interval, setInterval] = useState(BillingInterval.YEAR);
  const [amountCents, setAmountCents] = useState(() =>
    featuredSupporterTier(BillingInterval.YEAR),
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const changeInterval = (next: BillingInterval) => {
    setAmountCents(sameTierIn(amountCents, interval, next));
    setInterval(next);
  };

  const subscribe = async () => {
    const settingsUrl = `${window.location.origin}/dashboard/settings?tab=subscription`;
    try {
      const { url } = await createCheckout.mutateAsync({
        interval,
        amountCents,
        acceptTerms: true,
        successUrl: `${settingsUrl}&success=true`,
        cancelUrl: `${settingsUrl}&canceled=true`,
        feature,
      });
      posthog?.capture('subscription_upgrade_initiated', {
        plan: SubscriptionPlan.SUPPORTER,
        interval,
        amount_cents: amountCents,
        source: analyticsSource,
        feature: feature ?? null,
      });
      window.location.href = url;
    } catch (error) {
      posthog?.capture(AnalyticsEvent.subscription_checkout_failed, {
        plan: SubscriptionPlan.SUPPORTER,
        interval,
        source: analyticsSource,
        feature: feature ?? null,
        error_code: analyticsErrorCodeFromUnknown(error),
      });
      toast.error(m.subscription_checkout_error());
    }
  };

  return (
    <div className={cn('space-y-5 rounded-lg border p-5', className)}>
      <OfferHeader />
      <IntervalPicker
        value={interval}
        onChange={changeInterval}
        priceLabel={(option) =>
          supporterPriceLabel(option, sameTierIn(amountCents, interval, option))
        }
      />
      <TierPicker
        tiers={supporterTiers(interval)}
        value={amountCents}
        onChange={setAmountCents}
        label={(tier) => supporterPriceLabel(interval, tier)}
      />
      <SupporterPerks />

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="supporter-terms"
            className="mt-0.5"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
          />
          <Label
            htmlFor="supporter-terms"
            className="text-xs leading-relaxed font-normal text-muted-foreground"
          >
            {m.supporter_terms_consent()}
          </Label>
        </div>
        <a
          href={termsOfSaleUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs underline underline-offset-4"
        >
          {m.supporter_terms_link()}
        </a>
        <Button
          className="h-11 w-full"
          onClick={subscribe}
          disabled={!acceptTerms || createCheckout.isPending}
        >
          {createCheckout.isPending ? m.loading() : m.supporter_cta()}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {m.supporter_no_commitment()}
        </p>
      </div>
    </div>
  );
}

/**
 * In the iOS app, App Review requires the App Store's own localized prices,
 * the auto-renewal terms, links to the terms of use and the privacy policy,
 * and a way to restore purchases (guideline 3.1.2).
 */
function AppStoreSupporterOffer({
  analyticsSource,
  feature,
  className,
}: OfferProps) {
  const posthog = usePostHog();
  const purchase = useAppStorePurchase();
  const restore = useRestoreAppStorePurchases();
  const [interval, setInterval] = useState(BillingInterval.YEAR);
  const [chosen, setAmountCents] = useState(() =>
    featuredSupporterTier(BillingInterval.YEAR),
  );
  const prices = useQuery({
    queryKey: ['app-store', 'supporter-prices'],
    queryFn: supporterPrices,
    staleTime: Infinity,
  });
  const privacyUrl = privacyPolicyUrl();
  const storePrice = (option: BillingInterval, tier: number) => {
    const id = appleProductFor(option, tier)?.productId;
    return id ? prices.data?.[id] : undefined;
  };
  // Only the tiers the App Store sells for this storefront: a product
  // waiting for App Review is not returned yet
  const tiers = supporterTiers(interval).filter(
    (tier) =>
      appleProductFor(interval, tier) !== null &&
      (!prices.isSuccess || storePrice(interval, tier) !== undefined),
  );
  const amountCents = tiers.includes(chosen)
    ? chosen
    : tiers.includes(featuredSupporterTier(interval))
      ? featuredSupporterTier(interval)
      : (tiers[0] ?? chosen);
  const productId = appleProductFor(interval, amountCents)?.productId;

  const changeInterval = (next: BillingInterval) => {
    setAmountCents(sameTierIn(amountCents, interval, next));
    setInterval(next);
  };
  const priceLabel = (option: BillingInterval, tier: number) => {
    const price = storePrice(option, tier);
    if (!price) return '…';
    return option === BillingInterval.YEAR
      ? m.app_store_price_year({ price })
      : m.app_store_price_month({ price });
  };

  const subscribe = async () => {
    if (!productId) return;
    posthog?.capture('subscription_upgrade_initiated', {
      plan: SubscriptionPlan.SUPPORTER,
      interval,
      amount_cents: amountCents,
      source: analyticsSource,
      feature: feature ?? null,
      store: 'app_store',
    });
    try {
      await purchase.mutateAsync(productId);
      toast.success(m.app_store_purchase_success());
    } catch (error) {
      if (error instanceof PurchaseCancelledError) return;
      posthog?.capture(AnalyticsEvent.subscription_checkout_failed, {
        plan: SubscriptionPlan.SUPPORTER,
        interval,
        source: analyticsSource,
        feature: feature ?? null,
        store: 'app_store',
        error_code: analyticsErrorCodeFromUnknown(error),
      });
      toast.error(m.app_store_purchase_error());
    }
  };

  const restorePurchases = async () => {
    try {
      const restored = await restore.mutateAsync();
      if (restored) toast.success(m.app_store_restore_success());
      else toast.info(m.app_store_restore_none());
    } catch {
      toast.error(m.app_store_restore_error());
    }
  };

  return (
    <div className={cn('space-y-5 rounded-lg border p-5', className)}>
      <OfferHeader />
      <IntervalPicker
        value={interval}
        onChange={changeInterval}
        priceLabel={(option) =>
          priceLabel(option, sameTierIn(amountCents, interval, option))
        }
      />
      <TierPicker
        tiers={tiers}
        value={amountCents}
        onChange={setAmountCents}
        label={(tier) => storePrice(interval, tier) ?? '…'}
      />
      <SupporterPerks />

      <div className="space-y-3">
        <Button
          className="h-11 w-full"
          onClick={subscribe}
          disabled={purchase.isPending || !storePrice(interval, amountCents)}
        >
          {purchase.isPending ? m.loading() : m.supporter_cta()}
        </Button>
        {/* StoreKit answers without products when they are not set up for
            this storefront: say so instead of showing "…" forever */}
        {(prices.isError ||
          (prices.isSuccess && !storePrice(interval, amountCents))) && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-destructive">
              {m.app_store_products_unavailable()}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => prices.refetch()}
              disabled={prices.isFetching}
            >
              {m.app_store_retry()}
            </Button>
          </div>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {m.app_store_subscription_terms()}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <a
            href={APPLE_STANDARD_EULA}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            {m.app_store_terms_of_use()}
          </a>
          {privacyUrl && (
            <a
              href={privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              {m.app_store_privacy_policy()}
            </a>
          )}
        </div>
        <Button
          variant="ghost"
          className="h-11 w-full"
          onClick={restorePurchases}
          disabled={restore.isPending}
        >
          {restore.isPending ? m.loading() : m.app_store_restore()}
        </Button>
      </div>
    </div>
  );
}
