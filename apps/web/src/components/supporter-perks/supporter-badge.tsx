import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Heart } from 'lucide-react';

/**
 * The small heart next to the name of a Supporter who kept their badge
 * on. Lists ask useSupporterBadges once for all their people.
 */
export function SupporterBadge({
  show,
  className,
}: {
  show: boolean;
  className?: string;
}) {
  if (!show) return null;
  return (
    <span
      role="img"
      aria-label={m.supporter_badge_label()}
      title={m.supporter_badge_label()}
      data-supporter-badge
      className={cn('inline-flex shrink-0 align-middle', className)}
    >
      <Heart aria-hidden className="size-3.5 fill-chart-1 text-chart-1" />
    </span>
  );
}
