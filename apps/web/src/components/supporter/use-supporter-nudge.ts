import { useCurrentSubscription } from '@/api/subscription';
import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { supporterNudgeAllowed } from '@/utils/support-reminder';
import { isActiveSupporter } from '@/utils/supporter';
import { useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

import { User } from '@openathlete/shared';

/** Where a Supporter mention was shown (PostHog) */
export type SupporterNudgeSource =
  'race_activity' | 'year_review' | 'activity_ai_preview';

/**
 * The mention shown during this page load. Recording it dates the account,
 * which closes the window for every other one; this one stays until reload.
 */
let shownKey: string | null = null;

/**
 * Whether to show a Supporter mention in context. `key` names the place
 * (e.g. the activity), so that coming back to it shows the same mention,
 * and only one place ever gets it per two weeks.
 */
export function useSupporterNudge(
  source: SupporterNudgeSource,
  key: string,
  wanted: boolean,
): boolean {
  const { data: subscription } = useCurrentSubscription();
  const { data: me } = useGetMeQuery();
  const { mutate: updateAccount } = useUpdateAccountMutation();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const id = `${source}:${key}`;

  const visible =
    wanted &&
    subscription !== undefined &&
    me !== undefined &&
    (shownKey === id ||
      supporterNudgeAllowed({
        billingEnabled: subscription.billingEnabled,
        isSupporter: isActiveSupporter(subscription),
        seenAt: me.supporterNudgeSeenAt
          ? new Date(me.supporterNudgeSeenAt)
          : null,
        now: new Date(),
      }));

  useEffect(() => {
    // Another mention of this page load already took the window
    if (!visible || shownKey !== null) return;
    shownKey = id;
    queryClient.setQueryData<User>([userKeys.getMe], (old) =>
      old ? { ...old, supporterNudgeSeenAt: new Date() } : old,
    );
    updateAccount({ supporterNudgeSeen: true });
    posthog?.capture(AnalyticsEvent.supporter_nudge_viewed, { source });
  }, [visible, id, source, queryClient, updateAccount, posthog]);

  return visible && (shownKey === null || shownKey === id);
}
