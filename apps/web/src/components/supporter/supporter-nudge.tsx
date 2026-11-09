import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { cn } from '@/utils/shadcn';
import { Heart } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { Link } from 'react-router-dom';

import { SupporterNudgeSource } from './use-supporter-nudge';

interface P {
  source: SupporterNudgeSource;
  children: React.ReactNode;
  className?: string;
}

/**
 * One quiet line under something the app just did well, pointing to the
 * Supporter offer. Shown through useSupporterNudge, so rarely.
 */
export function SupporterNudge({ source, children, className }: P) {
  const posthog = usePostHog();
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground',
        className,
      )}
      data-supporter-nudge={source}
    >
      <Heart className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        {children}{' '}
        <Link
          to={`${getPath(['dashboard', 'settings'])}?tab=subscription`}
          onClick={() =>
            posthog?.capture(AnalyticsEvent.supporter_nudge_clicked, {
              source,
            })
          }
          className="font-medium text-foreground underline underline-offset-4"
        >
          {m.supporter_cta()}
        </Link>
      </p>
    </div>
  );
}
