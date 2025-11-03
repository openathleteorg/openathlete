import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/shadcn';
import { formatTarget, getTargetTypeLabel } from '@/utils/workout';

import type { WorkoutStepTarget } from '@openathlete/shared';

interface TargetBadgeProps {
  target: WorkoutStepTarget;
  className?: string;
  showTooltip?: boolean;
}

export function TargetBadge({
  target,
  className,
  showTooltip = true,
}: TargetBadgeProps) {
  const formatted = formatTarget(target);
  const label = getTargetTypeLabel(target.targetType);

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        className,
      )}
    >
      {formatted}
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            <span className="font-medium">{label}:</span> {formatted}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
