import { useGetConnectedProvidersQuery } from '@/api/provider';
import { useCurrentSubscription } from '@/api/subscription';
import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { m } from '@/paraglide/messages';
import {
  BUY_ME_A_COFFEE_URL,
  shouldShowSupportReminder,
} from '@/utils/support-reminder';
import { useQueryClient } from '@tanstack/react-query';
import { Coffee, X } from 'lucide-react';

import { User } from '@openathlete/shared';

/** Asks self-hosters for a coffee once, at the foot of the sidebar */
export function SupportReminder() {
  const { state, isMobile } = useSidebar();
  const { data: subscription } = useCurrentSubscription();
  const { data: providers } = useGetConnectedProvidersQuery();
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();
  const { mutate: updateAccount } = useUpdateAccountMutation();

  const visible =
    subscription !== undefined &&
    me !== undefined &&
    shouldShowSupportReminder({
      billingEnabled: subscription.billingEnabled,
      dismissed: Boolean(me.supportReminderDismissedAt),
      accountCreatedAt: new Date(me.createdAt),
      fullImportsCompletedAt: (providers ?? []).map(
        (provider) => provider.fullImportCompletedAt,
      ),
      now: new Date(),
    });
  if (!visible || (state === 'collapsed' && !isMobile)) return null;

  const dismiss = () => {
    queryClient.setQueryData<User>([userKeys.getMe], (old) =>
      old ? { ...old, supportReminderDismissedAt: new Date() } : old,
    );
    updateAccount({ supportReminderDismissed: true });
  };

  return (
    <div className="relative rounded-md border bg-background p-3 pr-8 text-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label={m.support_reminder_dismiss()}
        className="absolute right-1.5 top-1.5 rounded-sm p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
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
    </div>
  );
}
