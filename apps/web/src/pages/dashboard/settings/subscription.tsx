import {
  useCancelSubscription,
  useCurrentSubscription,
  useCustomerPortal,
  useInvoices,
  useResumeSubscription,
} from '@/api/subscription';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { m } from '@/paraglide/messages';
import { format } from 'date-fns';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  PLAN_CONFIGS,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@openathlete/shared';

const planNameMap: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.FREE]: m.plan_free_name(),
  [SubscriptionPlan.ATHLETE_PRO]: m.plan_athlete_pro_name(),
  [SubscriptionPlan.COACH_PRO]: m.plan_coach_pro_name(),
  [SubscriptionPlan.COACH_ULTRA]: m.plan_coach_ultra_name(),
  [SubscriptionPlan.CLUB_PRO]: m.plan_club_pro_name(),
  [SubscriptionPlan.CLUB_ULTRA]: m.plan_club_ultra_name(),
};

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

export function SubscriptionSettingsPage() {
  const { data: subscription, isLoading } = useCurrentSubscription();
  const { data: invoices } = useInvoices();
  const cancelMutation = useCancelSubscription();
  const resumeMutation = useResumeSubscription();
  const portalMutation = useCustomerPortal();

  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);
    try {
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
        toast.success(m.subscription_cancel_success());
      } catch {
        toast.error(m.subscription_cancel_error());
      }
    }
  };

  const handleResume = async () => {
    try {
      await resumeMutation.mutateAsync();
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
  const planConfig = PLAN_CONFIGS[plan];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{m.subscription_current()}</CardTitle>
          <CardDescription>{m.subscription_current()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">
                {m.subscription_plan()}
              </div>
              <div className="text-lg font-semibold">
                {planNameMap[plan]} - €
                {planConfig.price.toFixed(2).replace('.', ',')}
                {m.plan_price_per_month()}
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
        </CardContent>
      </Card>

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
    </div>
  );
}
