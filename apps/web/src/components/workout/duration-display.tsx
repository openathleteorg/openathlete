import { formatDuration } from '@/utils/workout/formatters';

import type { WorkoutDurationType } from '@openathlete/shared';

interface DurationDisplayProps {
  durationType: WorkoutDurationType;
  durationValue?: number | null;
  className?: string;
}

/**
 * Component that displays a formatted duration
 */
export function DurationDisplay({
  durationType,
  durationValue,
  className,
}: DurationDisplayProps) {
  const formatted = formatDuration(durationType, durationValue);

  return (
    <span className={className}>
      {formatted}
    </span>
  );
}
