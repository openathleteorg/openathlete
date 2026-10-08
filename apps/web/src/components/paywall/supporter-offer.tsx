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
import { supporterPriceLabel, termsOfSaleUrl } from '@/utils/supporter';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  BillingInterval,
  FREE_PLAN_MAX_ATHLETES,
  SubscriptionPlan,
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
  className?: string;
};

/**
 * The Supporter subscription: what it adds to the free plan, monthly or
 * yearly, sold through Stripe on the web and the App Store in the iOS app.
 * Builds that sell nothing (the Android app) never show it.
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

function SupporterPerks() {
  const perks = [
    m.supporter_perk_athletes({ count: FREE_PLAN_MAX_ATHLETES }),
    m.supporter_perk_ai(),
    m.supporter_perk_project(),
  ];
  return (
    <ul className="space-y-2">
      {perks.map((perk) => (
        <li key={perk} className="flex items-start gap-2 text-sm">
          <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
          <span>{perk}</span>
        </li>
      ))}
    </ul>
  );
}

function StripeSupporterOffer({ analyticsSource, className }: OfferProps) {
  const posthog = usePostHog();
  const createCheckout = useCreateCheckout();
  const [interval, setInterval] = useState(BillingInterval.YEAR);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const subscribe = async () => {
    const settingsUrl = `${window.location.origin}/dashboard/settings?tab=subscription`;
    try {
      const { url } = await createCheckout.mutateAsync({
        interval,
        acceptTerms: true,
        successUrl: `${settingsUrl}&success=true`,
        cancelUrl: `${settingsUrl}&canceled=true`,
      });
      posthog?.capture('subscription_upgrade_initiated', {
        plan: SubscriptionPlan.SUPPORTER,
        interval,
        source: analyticsSource,
      });
      window.location.href = url;
    } catch (error) {
      posthog?.capture(AnalyticsEvent.subscription_checkout_failed, {
        plan: SubscriptionPlan.SUPPORTER,
        interval,
        source: analyticsSource,
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
        onChange={setInterval}
        priceLabel={supporterPriceLabel}
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
function AppStoreSupporterOffer({ analyticsSource, className }: OfferProps) {
  const posthog = usePostHog();
  const purchase = useAppStorePurchase();
  const restore = useRestoreAppStorePurchases();
  const [interval, setInterval] = useState(BillingInterval.YEAR);
  const prices = useQuery({
    queryKey: ['app-store', 'supporter-prices'],
    queryFn: supporterPrices,
    staleTime: Infinity,
  });
  const privacyUrl = privacyPolicyUrl();

  const priceLabel = (option: BillingInterval) => {
    const price = prices.data?.[option];
    if (!price) return '…';
    return option === BillingInterval.YEAR
      ? m.app_store_price_year({ price })
      : m.app_store_price_month({ price });
  };

  const subscribe = async () => {
    posthog?.capture('subscription_upgrade_initiated', {
      plan: SubscriptionPlan.SUPPORTER,
      interval,
      source: analyticsSource,
      store: 'app_store',
    });
    try {
      await purchase.mutateAsync(interval);
      toast.success(m.app_store_purchase_success());
    } catch (error) {
      if (error instanceof PurchaseCancelledError) return;
      posthog?.capture(AnalyticsEvent.subscription_checkout_failed, {
        plan: SubscriptionPlan.SUPPORTER,
        interval,
        source: analyticsSource,
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
        onChange={setInterval}
        priceLabel={priceLabel}
      />
      <SupporterPerks />

      <div className="space-y-3">
        <Button
          className="h-11 w-full"
          onClick={subscribe}
          disabled={purchase.isPending || !prices.data?.[interval]}
        >
          {purchase.isPending ? m.loading() : m.supporter_cta()}
        </Button>
        {prices.isError && (
          <p className="text-center text-xs text-destructive">
            {m.app_store_products_unavailable()}
          </p>
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
