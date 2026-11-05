import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
import { useAthleteTrainingZones } from '@/hooks/use-training-zones';
import { formatDuration } from '@/utils/workout';
import { useMemo } from 'react';

import {
  type SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  type WorkoutStepTargetDto,
  estimateStepDistanceFromDuration,
} from '@openathlete/shared';

import { useWorkoutAthleteId } from './workout-athlete-context';
import { metricValues } from './workout-profile';

interface DurationDisplayProps {
  durationType: WORKOUT_DURATION_TYPE;
  durationValue?: number | null;
  targets?: WorkoutStepTargetDto[];
  sport?: SPORT_TYPE;
  athleteId?: number | null;
  className?: string;
}

export function DurationDisplay({
  durationType,
  durationValue,
  targets,
  sport,
  athleteId,
  className,
}: DurationDisplayProps) {
  const workoutAthleteId = useWorkoutAthleteId();
  const ownerId = athleteId === undefined ? workoutAthleteId : athleteId;
  const { data: me } = useGetMyAthleteQuery();
  const { zones: trainingZones } = useAthleteTrainingZones(ownerId);
  const { data: latestMetrics } = useGetLatestMetricsQuery(
    ownerId ?? me?.athleteId,
  );
  const metrics = useMemo(() => metricValues(latestMetrics), [latestMetrics]);

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
