import {
  useCancelSubscription,
  useCreateCheckout,
  useCurrentSubscription,
  useCustomerPortal,
  useInvoices,
  useResumeSubscription,
} from '@/api/subscription';
import { ConfirmAction } from '@/components/confirm-action';
import { SupporterOffer } from '@/components/paywall/supporter-offer';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { manageAppStoreSubscription } from '@/utils/app-store';
import { purchaseChannel } from '@/utils/capacitor';
import { supporterPriceLabel } from '@/utils/supporter';
import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsSection,
} from '@/views/dashboard/settings-view/settings-section';
import { format } from 'date-fns';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  BillingInterval,
  BillingProvider,
  FREE_PLAN_MAX_ATHLETES,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@openathlete/shared';

const subscriptionStatusMap: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: m.subscription_status_active(),
  [SubscriptionStatus.TRIALING]: m.subscription_status_trialing(),
  [SubscriptionStatus.CANCELED]: m.subscription_status_canceled(),
  [SubscriptionStatus.PAST_DUE]: m.subscription_status_past_due(),
  [SubscriptionStatus.INCOMPLETE]: m.subscription_status_incomplete(),
  [SubscriptionStatus.INCOMPLETE_EXPIRED]:
    m.subscription_status_incomplete_expired(),
  [SubscriptionStatus.UNPAID]: m.subscription_status_unpaid(),
};

const invoiceStatusMap: Record<string, string> = {
  paid: m.invoice_status_paid(),
  open: m.invoice_status_open(),
  draft: m.invoice_status_draft(),
  void: m.invoice_status_void(),
  uncollectible: m.invoice_status_uncollectible(),
};

function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return (
    status === SubscriptionStatus.ACTIVE ||
    status === SubscriptionStatus.TRIALING
  );
}

export function SubscriptionSettingsPage() {
  const { data: subscription, isLoading } = useCurrentSubscription();
  const { data: invoices } = useInvoices();
  const cancelMutation = useCancelSubscription();
  const resumeMutation = useResumeSubscription();
  const portalMutation = useCustomerPortal();
  const createCheckout = useCreateCheckout();
  const posthog = usePostHog();

  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const channel = purchaseChannel();

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);
    try {
      posthog?.capture(AnalyticsEvent.subscription_manage_billing_opened);
      const returnUrl = `${window.location.origin}/dashboard/settings?tab=subscription`;
      const { url } = await portalMutation.mutateAsync(returnUrl);
      window.location.href = url;
    } catch {
      toast.error(m.subscription_portal_error());
      setIsLoadingPortal(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync();
      posthog?.capture('subscription_cancelled');
      toast.success(m.subscription_cancel_success());
      setCancelOpen(false);
    } catch {
      toast.error(m.subscription_cancel_error());
    }
  };

  const handleResume = async () => {
    try {
      await resumeMutation.mutateAsync();
      posthog?.capture('subscription_resumed');
      toast.success(m.subscription_resume_success());
    } catch {
      toast.error(m.subscription_resume_error());
    }
  };

  if (isLoading) {
    return <div>{m.loading()}</div>;
  }

  if (!subscription) {
    return <div>{m.subscription_not_found()}</div>;
  }

  const plan = subscription.plan as SubscriptionPlan;
  const status = subscription.status as SubscriptionStatus;
  const interval = subscription.billingInterval;

  // A lapsed Supporter subscription leaves the free plan
  if (plan === SubscriptionPlan.FREE || !isSubscriptionActive(status)) {
    // The Android app neither sells nor points to a way to buy
    if (channel === null) {
      return (
        <SettingsSection
          title={m.subscription_free_title()}
          description={m.subscription_unavailable_in_app()}
        />
      );
    }
    return (
      <SettingsSection
        title={m.subscription_free_title()}
        description={m.subscription_free_description({
          count: FREE_PLAN_MAX_ATHLETES,
        })}
      >
        <SupporterOffer
          analyticsSource="subscription_settings"
          className="rounded-2xl"
        />
      </SettingsSection>
    );
  }

  const otherInterval =
    interval === BillingInterval.YEAR
      ? BillingInterval.MONTH
      : BillingInterval.YEAR;
  const billedByAppStore = subscription.provider === BillingProvider.APPLE;
  // Stripe is managed on the web only; the App Store in the iOS app, and the
  // web says where. The other apps show the subscription without managing it
  const managesStripe = channel === 'stripe' && !billedByAppStore;
  const managesAppStore = channel === 'app-store' && billedByAppStore;

  const handleSwitchInterval = async () => {
    const settingsUrl = `${window.location.origin}/dashboard/settings?tab=subscription`;
    try {
      await createCheckout.mutateAsync({
        interval: otherInterval,
        successUrl: settingsUrl,
        cancelUrl: settingsUrl,
      });
      posthog?.capture('subscription_interval_changed', {
        interval: otherInterval,
      });
      toast.success(m.subscription_switch_success());
    } catch {
      toast.error(m.subscription_checkout_error());
    }
  };

  return (
    <div className="space-y-8">
      <SettingsSection
        title={m.subscription_current()}
        description={m.subscription_supporter_thanks()}
      >
        <SettingsPanel>
          <SettingsRow title={m.subscription_plan()}>
            <span className="text-sm text-muted-foreground">
              {m.plan_supporter_name()}
              {interval &&
                ` · ${
                  billedByAppStore
                    ? interval === BillingInterval.YEAR
                      ? m.supporter_interval_yearly()
                      : m.supporter_interval_monthly()
                    : supporterPriceLabel(interval)
                }`}
            </span>
          </SettingsRow>
          <SettingsRow title={m.subscription_status()}>
            <span className="text-sm text-muted-foreground">
              {subscriptionStatusMap[
                subscription.status as SubscriptionStatus
              ] || subscription.status}
            </span>
          </SettingsRow>
          {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
            <SettingsRow
              title={m.subscription_period()}
              description={
                subscription.cancelAtPeriodEnd && (
                  <span className="text-orange-600">
                    {m.subscription_cancel_at_period_end()}
                  </span>
                )
              }
            >
              <span className="text-sm text-muted-foreground">
                {format(new Date(subscription.currentPeriodStart), 'PP')} -{' '}
                {format(new Date(subscription.currentPeriodEnd), 'PP')}
              </span>
            </SettingsRow>
          )}
        </SettingsPanel>

        {channel === 'stripe' && billedByAppStore && (
          <p className="px-1 text-sm text-muted-foreground">
            {m.subscription_managed_by_app_store()}
          </p>
        )}

        {managesAppStore && (
          <Button
            variant="outline"
            onClick={() => manageAppStoreSubscription()}
            className="w-full sm:w-auto"
          >
            {m.subscription_manage_app_store()}
          </Button>
        )}

        {managesStripe && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isLoadingPortal}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="size-4" />
              {m.subscription_manage_billing()}
            </Button>
            {interval && !subscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={handleSwitchInterval}
                disabled={createCheckout.isPending}
                className="w-full sm:w-auto"
              >
                {otherInterval === BillingInterval.YEAR
                  ? m.subscription_switch_to_yearly({
                      price: supporterPriceLabel(BillingInterval.YEAR),
                    })
                  : m.subscription_switch_to_monthly({
                      price: supporterPriceLabel(BillingInterval.MONTH),
                    })}
              </Button>
            )}
            {subscription.cancelAtPeriodEnd ? (
              <Button
                onClick={handleResume}
                disabled={resumeMutation.isPending}
                className="w-full sm:w-auto"
              >
                {m.subscription_resume()}
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setCancelOpen(true)}
                disabled={cancelMutation.isPending}
                className="w-full text-destructive-foreground sm:ml-auto sm:w-auto"
              >
                {m.subscription_cancel()}
              </Button>
            )}
          </div>
        )}
      </SettingsSection>

      {managesStripe && (
        <SettingsSection title={m.subscription_invoices()}>
          {!invoices || invoices.length === 0 ? (
            <SettingsEmpty>{m.subscription_no_invoices()}</SettingsEmpty>
          ) : (
            <SettingsPanel>
              {invoices.map((invoice) => (
                <SettingsRow
                  key={invoice.id}
                  leading={<FileText className="size-5" />}
                  title={`€${invoice.amount.toFixed(2)} ${invoice.currency.toUpperCase()}`}
                  description={`${format(new Date(invoice.createdAt), 'PP')} - ${
                    invoiceStatusMap[invoice.status.toLowerCase()] ||
                    invoice.status
                  }`}
                >
                  {invoice.invoiceUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="max-md:w-11"
                      aria-label={m.subscription_view_invoice()}
                      onClick={() => window.open(invoice.invoiceUrl!, '_blank')}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  )}
                  {invoice.invoicePdf && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="max-md:w-11"
                      aria-label={m.subscription_download_invoice()}
                      onClick={() => window.open(invoice.invoicePdf!, '_blank')}
                    >
                      <Download className="size-4" />
                    </Button>
                  )}
                </SettingsRow>
              ))}
            </SettingsPanel>
          )}
        </SettingsSection>
      )}
      <ConfirmAction
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title={m.subscription_cancel()}
        message={m.subscription_cancel_confirm()}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
