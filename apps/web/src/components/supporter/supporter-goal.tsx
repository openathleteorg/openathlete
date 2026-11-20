import {
  useCurrentSubscription,
  useSupporterCountQuery,
} from '@/api/subscription';
import { m } from '@/paraglide/messages';
import { purchaseChannel } from '@/utils/capacitor';
import { cn } from '@/utils/shadcn';

import { SUPPORTER_GAUGE_FROM } from '@openathlete/shared';

/** How far the Supporters are from the goal: true figures, no pressure */
export function SupporterGauge({
  count,
  goal,
  className,
}: {
  count: number;
  goal: number;
  className?: string;
}) {
  if (count < SUPPORTER_GAUGE_FROM) return null;
  const percent = Math.min(100, Math.round((count / goal) * 100));
  return (
    <div className={cn('space-y-1', className)} data-supporter-gauge>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={count}
        aria-label={m.support_reminder_supporter_count({ count, goal })}
      >
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {m.support_reminder_supporter_count({ count, goal })}
      </p>
    </div>
  );
}

/**
 * The Supporters goal with the real count, founders included, on instances
 * that sell the subscription. Builds that sell nothing (Android) skip it.
 */
export function SupporterGoal({ className }: { className?: string }) {
  const { data: subscription } = useCurrentSubscription();
  const shown =
    Boolean(subscription?.billingEnabled) && purchaseChannel() !== null;
  const { data: supporters } = useSupporterCountQuery(shown);
  if (!shown || !supporters) return null;
  return <SupporterGauge {...supporters} className={className} />;
}
