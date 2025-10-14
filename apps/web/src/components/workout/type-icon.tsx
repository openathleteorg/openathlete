import {
  Activity,
  Flame,
  Repeat,
  Snowflake,
  Timer,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { getStepTypeColor } from '@/utils/workout/formatters';

import type { WorkoutStepType } from '@openathlete/shared';

import { cn } from '@/utils/shadcn';

interface TypeIconProps {
  stepType: WorkoutStepType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Get the appropriate icon for a step type
 */
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

/**
 * Component that displays an icon for a workout step type with appropriate color
 */
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
