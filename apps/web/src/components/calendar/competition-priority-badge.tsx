import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import { COMPETITION_PRIORITY } from '@openathlete/shared';

const STYLE: Record<COMPETITION_PRIORITY, string> = {
  A: 'bg-red-600 text-white',
  B: 'bg-amber-500 text-white',
  C: 'bg-muted-foreground/30 text-foreground',
};

/** The A, B or C letter of a race, with its meaning for screen readers */
export function CompetitionPriorityBadge({
  priority,
  className,
}: {
  priority: `${COMPETITION_PRIORITY}` | null | undefined;
  className?: string;
}) {
  if (!priority) return null;
  return (
    <span
      role="img"
      aria-label={m.competition_priority_badge({ priority })}
      title={m.competition_priority_badge({ priority })}
      className={cn(
        'inline-flex size-4 items-center justify-center rounded-sm text-[10px] font-bold leading-none',
        STYLE[priority as COMPETITION_PRIORITY],
        className,
      )}
    >
      {priority}
    </span>
  );
}
