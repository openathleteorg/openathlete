import { formatDuration } from '@/utils/workout';
import { useMemo } from 'react';

import {
  type SPORT_TYPE,
  type StepZoneLike,
  WORKOUT_DURATION_TYPE,
  type WorkoutStepTargetDto,
  estimateStepDistanceFromDuration,
} from '@openathlete/shared';

interface DurationDisplayProps {
  durationType: WORKOUT_DURATION_TYPE;
  durationValue?: number | null;
  targets?: WorkoutStepTargetDto[];
  sport?: SPORT_TYPE;
  metrics?: Record<string, { value: number } | number>;
  trainingZones?: StepZoneLike[];
  className?: string;
}

export function DurationDisplay({
  durationType,
  durationValue,
  targets,
  sport,
  metrics,
  trainingZones,
  className,
}: DurationDisplayProps) {
  const formatted = formatDuration(durationType, durationValue);

  const estimatedDistance = useMemo(
    () =>
      estimateStepDistanceFromDuration(
        { durationType, durationValue, targets: targets ?? [] },
        metrics,
        sport,
        trainingZones,
      ),
    [durationType, durationValue, targets, metrics, sport, trainingZones],
  );

  if (estimatedDistance !== null && estimatedDistance > 0) {
    const formattedDistance = formatDuration(
      WORKOUT_DURATION_TYPE.DISTANCE,
      Math.round(estimatedDistance),
    );
    return (
      <span className={className}>
        {formatted} (~{formattedDistance})
      </span>
    );
  }

  return <span className={className}>{formatted}</span>;
}
