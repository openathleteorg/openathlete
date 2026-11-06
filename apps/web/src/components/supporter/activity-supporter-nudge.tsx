import { useAiAccessQuery } from '@/api/ai-settings';
import { PaywallDialog } from '@/components/paywall';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { m } from '@/paraglide/messages';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';

import {
  ActivityEvent,
  AiTask,
  activityAiSummarySchema,
} from '@openathlete/shared';

import { SupporterNudge } from './supporter-nudge';
import { useSupporterNudge } from './use-supporter-nudge';

/** The AI writes its analysis of new activities only */
const AI_PREVIEW_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface P {
  event: ActivityEvent;
  isMyActivity: boolean;
}

/**
 * At most one Supporter mention on an activity of one's own: congratulations
 * after a race, or else, where the AI analysis would be, what Supporter
 * would have written.
 */
export function ActivitySupporterNudge({ event, isMyActivity }: P) {
  const race = useSupporterNudge(
    'race_activity',
    String(event.eventId),
    isMyActivity && !!event.isRace,
  );
  if (race) {
    return (
      <SupporterNudge source="race_activity" className="col-span-2">
        {m.supporter_nudge_race()}
      </SupporterNudge>
    );
  }
  if (!isMyActivity || event.isRace) return null;
  return <ActivityAiPreview event={event} />;
}

function ActivityAiPreview({ event }: { event: ActivityEvent }) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const posthog = usePostHog();
  // The viewer's own access: the activity is theirs
  const { data: access } = useAiAccessQuery();
  const recent =
    Date.now() - new Date(event.startDate).getTime() <= AI_PREVIEW_MAX_AGE_MS;
  const wanted =
    recent &&
    !activityAiSummarySchema.safeParse(event.aiSummary).success &&
    !!access &&
    !access.tasks[AiTask.ACTIVITY_SUMMARY].available &&
    access.upgradeUnlocksHosted;
  const visible = useSupporterNudge(
    'activity_ai_preview',
    String(event.eventId),
    wanted,
  );
  if (!visible) return null;

  return (
    <>
      <div
        className="col-span-2 flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center"
        data-supporter-nudge="activity_ai_preview"
      >
        <div className="flex-1 space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            <SparklesIcon className="size-4" />
            {m.activity_ai_summary_title()}
          </p>
          <p className="text-sm text-muted-foreground">
            {m.supporter_nudge_ai_preview()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-11 sm:h-9"
          onClick={() => {
            posthog?.capture(AnalyticsEvent.supporter_nudge_clicked, {
              source: 'activity_ai_preview',
            });
            setPaywallOpen(true);
          }}
        >
          {m.supporter_nudge_ai_preview_cta()}
        </Button>
      </div>
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="ai-feature"
        analyticsSource="activity_ai_preview"
      />
    </>
  );
}
