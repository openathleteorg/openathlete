import { formatDuration } from '@/utils/workout';

import type { WorkoutDurationType } from '@openathlete/shared';

interface DurationDisplayProps {
  durationType: WorkoutDurationType;
  durationValue?: number | null;
  className?: string;
}

export function DurationDisplay({
  durationType,
  durationValue,
  className,
}: DurationDisplayProps) {
  const formatted = formatDuration(durationType, durationValue);

  return <span className={className}>{formatted}</span>;
}
