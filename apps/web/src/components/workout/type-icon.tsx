import { cn } from '@/utils/shadcn';
import { getStepTypeColor } from '@/utils/workout';
import {
  Activity,
  Flame,
  type LucideIcon,
  Repeat,
  Snowflake,
  Timer,
  Zap,
} from 'lucide-react';

import type { WorkoutStepType } from '@openathlete/shared';

interface TypeIconProps {
  stepType: WorkoutStepType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getStepTypeIcon(stepType: WorkoutStepType): LucideIcon {
  const icons: Record<WorkoutStepType, LucideIcon> = {
    WARMUP: Flame,
    COOLDOWN: Snowflake,
    INTERVAL_ACTIVE: Zap,
    INTERVAL_REST: Timer,
    STEADY: Activity,
    REPEAT: Repeat,
    FREE: Activity,
  };
  return icons[stepType] || Activity;
}

export function TypeIcon({ stepType, size = 'md', className }: TypeIconProps) {
  const Icon = getStepTypeIcon(stepType);
  const colors = getStepTypeColor(stepType);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md p-1.5',
        colors.bg,
        className,
      )}
    >
      <Icon className={cn(sizeClasses[size], colors.text)} />
    </div>
  );
}
