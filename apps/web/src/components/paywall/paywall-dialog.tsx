import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { purchaseChannel } from '@/utils/capacitor';
import { Users } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { FREE_PLAN_MAX_ATHLETES } from '@openathlete/shared';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { SupporterOffer } from './supporter-offer';

type PaywallReason = 'ai-feature' | 'athlete-limit';

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: PaywallReason;
  /** Where the paywall was opened from (PostHog). */
  analyticsSource?: string;
}

/** Offers the Supporter subscription when a free account reaches a limit. */
export function PaywallDialog({
  open,
  onOpenChange,
  reason = 'ai-feature',
  analyticsSource = 'paywall_dialog',
}: PaywallDialogProps) {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const isAIReason = reason === 'ai-feature';

  useEffect(() => {
    if (!open) return;
    posthog?.capture(AnalyticsEvent.ai_paywall_viewed, {
      reason: isAIReason ? 'ai_feature' : 'athlete_limit',
      source: analyticsSource,
    });
  }, [open, isAIReason, analyticsSource, posthog]);

  // The Android app neither sells nor points to a way to buy
  if (purchaseChannel() === null) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {m.subscription_unavailable_title()}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              {m.subscription_unavailable_in_app()}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            {isAIReason ? (
              <SparklesIcon className="size-7 text-primary" />
            ) : (
              <Users className="size-7 text-primary" />
            )}
            <DialogTitle className="text-xl">
              {isAIReason
                ? m.paywall_ai_feature_title()
                : m.paywall_athlete_limit_title()}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {isAIReason
              ? m.paywall_ai_feature_description()
              : m.paywall_athlete_limit_description({
                  count: FREE_PLAN_MAX_ATHLETES,
                })}
          </DialogDescription>
        </DialogHeader>

        <SupporterOffer analyticsSource={analyticsSource} />

        {isAIReason && (
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => {
              onOpenChange(false);
              navigate(`${getPath(['dashboard', 'settings'])}?tab=ai`);
            }}
          >
            {m.paywall_ai_own_key()}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
