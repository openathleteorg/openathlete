import { formatDuration } from '@/utils/workout';

import type { WORKOUT_DURATION_TYPE } from '@openathlete/shared';

interface DurationDisplayProps {
  durationType: WORKOUT_DURATION_TYPE;
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
