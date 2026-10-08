import {
  useCancelSubscription,
  useCreateCheckout,
  useCurrentSubscription,
  useCustomerPortal,
  useInvoices,
  useResumeSubscription,
} from '@/api/subscription';
import { SupporterOffer } from '@/components/paywall/supporter-offer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { m } from '@/paraglide/messages';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { manageAppStoreSubscription } from '@/utils/app-store';
import { purchaseChannel } from '@/utils/capacitor';
import { supporterPriceLabel } from '@/utils/supporter';
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
    if (confirm(m.subscription_cancel_confirm())) {
      try {
        await cancelMutation.mutateAsync();
        posthog?.capture('subscription_cancelled');
        toast.success(m.subscription_cancel_success());
      } catch {
        toast.error(m.subscription_cancel_error());
      }
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{m.subscription_free_title()}</CardTitle>
              <CardDescription>
                {m.subscription_unavailable_in_app()}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{m.subscription_free_title()}</CardTitle>
            <CardDescription>
              {m.subscription_free_description({
                count: FREE_PLAN_MAX_ATHLETES,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupporterOffer
              analyticsSource="subscription_settings"
              className="max-w-xl"
            />
          </CardContent>
        </Card>
      </div>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{m.subscription_current()}</CardTitle>
          <CardDescription>{m.subscription_supporter_thanks()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">
                {m.subscription_plan()}
              </div>
              <div className="text-lg font-semibold">
                {m.plan_supporter_name()}
                {interval &&
                  ` · ${
                    billedByAppStore
                      ? interval === BillingInterval.YEAR
                        ? m.supporter_interval_yearly()
                        : m.supporter_interval_monthly()
                      : supporterPriceLabel(interval)
                  }`}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {m.subscription_status()}
              </div>
              <div className="text-lg font-semibold">
                {subscriptionStatusMap[
                  subscription.status as SubscriptionStatus
                ] || subscription.status}
              </div>
            </div>
            {subscription.currentPeriodStart &&
              subscription.currentPeriodEnd && (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {m.subscription_period()}
                    </div>
                    <div className="text-sm">
                      {format(new Date(subscription.currentPeriodStart), 'PP')}{' '}
                      - {format(new Date(subscription.currentPeriodEnd), 'PP')}
                    </div>
                  </div>
                  <div>
                    {subscription.cancelAtPeriodEnd && (
                      <div className="text-sm text-orange-600">
                        {m.subscription_cancel_at_period_end()}
                      </div>
                    )}
                  </div>
                </>
              )}
          </div>

          {channel === 'stripe' && billedByAppStore && (
            <p className="text-sm text-muted-foreground">
              {m.subscription_managed_by_app_store()}
            </p>
          )}

          {managesAppStore && (
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => manageAppStoreSubscription()}
                className="w-full sm:w-auto"
              >
                {m.subscription_manage_app_store()}
              </Button>
            </div>
          )}

          {managesStripe && (
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
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
                  variant="outline"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {m.subscription_cancel()}
                </Button>
              )}
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
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={isLoadingPortal}
                className="w-full sm:w-auto"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {m.subscription_manage_billing()}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {managesStripe && (
        <Card>
          <CardHeader>
            <CardTitle>{m.subscription_invoices()}</CardTitle>
          </CardHeader>
          <CardContent>
            {!invoices || invoices.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {m.subscription_no_invoices()}
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <div className="font-medium">
                          €{invoice.amount.toFixed(2)}{' '}
                          {invoice.currency.toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(invoice.createdAt), 'PP')} -{' '}
                          {invoiceStatusMap[invoice.status.toLowerCase()] ||
                            invoice.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {invoice.invoiceUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(invoice.invoiceUrl!, '_blank')
                          }
                          className="w-full sm:w-auto"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {m.subscription_view_invoice()}
                        </Button>
                      )}
                      {invoice.invoicePdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(invoice.invoicePdf!, '_blank')
                          }
                          className="w-full sm:w-auto"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {m.subscription_download_invoice()}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
