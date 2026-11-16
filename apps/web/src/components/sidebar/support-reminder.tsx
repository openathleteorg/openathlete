import { useGetConnectedProvidersQuery } from '@/api/provider';
import {
  useCurrentSubscription,
  useSupporterCountQuery,
} from '@/api/subscription';
import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import {
  BUY_ME_A_COFFEE_URL,
  shouldShowSupportReminder,
  shouldShowSupporterReminder,
} from '@/utils/support-reminder';
import { isActiveSupporter } from '@/utils/supporter';
import { useQueryClient } from '@tanstack/react-query';
import { Coffee, Heart, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { User } from '@openathlete/shared';

import { SupporterGauge } from '../supporter/supporter-goal';

/**
 * Asks at the foot of the sidebar: self-hosters once for a coffee, users of
 * the hosted instance to become Supporters, a few times a year at most
 */
export function SupportReminder() {
  const { state, isMobile } = useSidebar();
  const { data: subscription } = useCurrentSubscription();
  const { data: providers } = useGetConnectedProvidersQuery();
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();
  const { mutate: updateAccount } = useUpdateAccountMutation();

  const ready = subscription !== undefined && me !== undefined;
  const reminder = {
    billingEnabled: Boolean(subscription?.billingEnabled),
    fullImportsCompletedAt: (providers ?? []).map(
      (provider) => provider.fullImportCompletedAt,
    ),
    now: new Date(),
  };
  const coffee =
    ready &&
    shouldShowSupportReminder({
      ...reminder,
      dismissed: Boolean(me.supportReminderDismissedAt),
      accountCreatedAt: new Date(me.createdAt),
    });
  const supporter =
    ready &&
    shouldShowSupporterReminder({
      ...reminder,
      isSupporter: isActiveSupporter(subscription),
      dismissedAt: me.supportReminderDismissedAt
        ? new Date(me.supportReminderDismissedAt)
        : null,
      dismissCount: me.supportReminderDismissCount ?? 0,
    });
  const { data: supporters } = useSupporterCountQuery(supporter);
  if (!(coffee || supporter) || (state === 'collapsed' && !isMobile)) {
    return null;
  }

  const dismiss = () => {
    queryClient.setQueryData<User>([userKeys.getMe], (old) =>
      old
        ? {
            ...old,
            supportReminderDismissedAt: new Date(),
            supportReminderDismissCount:
              (old.supportReminderDismissCount ?? 0) + 1,
          }
        : old,
    );
    updateAccount({ supportReminderDismissed: true });
  };

  return (
    <div className="relative rounded-md border bg-background p-3 pr-8 text-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label={
          supporter ? m.support_reminder_later() : m.support_reminder_dismiss()
        }
        className="absolute right-1.5 top-1.5 rounded-sm p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {supporter ? (
        <>
          <p className="text-muted-foreground">
            {m.support_reminder_supporter_text()}
          </p>
          {supporters && <SupporterGauge {...supporters} className="mt-2" />}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={dismiss}
          >
            <Link to={`${getPath(['dashboard', 'settings'])}?tab=subscription`}>
              <Heart className="h-4 w-4" />
              {m.supporter_cta()}
            </Link>
          </Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground">{m.support_reminder_text()}</p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={dismiss}
          >
            <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noreferrer">
              <Coffee className="h-4 w-4" />
              {m.buy_me_a_coffee()}
            </a>
          </Button>
        </>
      )}
    </div>
  );
}
