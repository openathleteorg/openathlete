import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { useFeature } from '@/hooks/use-feature';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { purchaseChannel } from '@/utils/capacitor';
import { HeartHandshake, Users } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { FREE_PLAN_MAX_ATHLETES, Feature } from '@openathlete/shared';

import { FEATURE_TEXTS } from '../supporter-perks/feature-texts';
import { formatFeatureDay } from '../supporter-perks/format-feature-day';
import { SupporterGoal } from '../supporter/supporter-goal';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { SupporterOffer } from './supporter-offer';

type PaywallReason = 'ai-feature' | 'athlete-limit' | 'feature';

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: PaywallReason;
  /** With reason "feature": the feature of FEATURES it is about */
  feature?: Feature;
  /** Where the paywall was opened from (PostHog). */
  analyticsSource?: string;
}

const REASON_EVENT: Record<PaywallReason, string> = {
  'ai-feature': 'ai_feature',
  'athlete-limit': 'athlete_limit',
  feature: 'feature',
};

/** Offers the Supporter subscription when a free account reaches a limit. */
export function PaywallDialog({
  open,
  onOpenChange,
  reason = 'ai-feature',
  feature,
  analyticsSource = 'paywall_dialog',
}: PaywallDialogProps) {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const isAIReason = reason === 'ai-feature';
  const featureKey = reason === 'feature' ? (feature ?? null) : null;

  useEffect(() => {
    if (!open) return;
    posthog?.capture(AnalyticsEvent.paywall_viewed, {
      reason: REASON_EVENT[reason],
      feature: featureKey,
      source: analyticsSource,
    });
    // Kept for the AI funnels built on it
    if (reason !== 'feature') {
      posthog?.capture(AnalyticsEvent.ai_paywall_viewed, {
        reason: REASON_EVENT[reason],
        source: analyticsSource,
      });
    }
  }, [open, reason, featureKey, analyticsSource, posthog]);

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
        {featureKey ? (
          <FeatureHeader feature={featureKey} />
        ) : (
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
        )}

        {featureKey && <SupporterGoal />}

        <SupporterOffer
          analyticsSource={analyticsSource}
          feature={featureKey ?? undefined}
        />

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

/** What the feature does, a thank-you, and when it opens to all */
function FeatureHeader({ feature }: { feature: Feature }) {
  const { availableToAllOn } = useFeature(feature);
  const texts = FEATURE_TEXTS[feature];
  return (
    <DialogHeader>
      <div className="mb-2 flex items-center gap-3">
        <HeartHandshake className="size-7 shrink-0 text-primary" />
        <DialogTitle className="text-xl">{texts.title()}</DialogTitle>
      </div>
      <DialogDescription className="text-base text-pretty">
        {texts.body()}
      </DialogDescription>
      <p className="text-sm text-pretty text-muted-foreground">
        {availableToAllOn
          ? m.feature_paywall_early_access({
              date: formatFeatureDay(availableToAllOn),
            })
          : m.feature_paywall_thanks()}
      </p>
    </DialogHeader>
  );
}
