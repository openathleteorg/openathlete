import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
import { Separator } from '@/components/ui/separator';
import { useAthleteTrainingZones } from '@/hooks/use-training-zones';
import * as m from '@/paraglide/messages';
import { getStepTypeLabel } from '@/utils/workout';
import { useMemo } from 'react';

import {
  type SPORT_TYPE,
  type WorkoutDto,
  type WorkoutStepDto,
  type WorkoutStepTargetDto,
  calculateWorkoutDistance,
  calculateWorkoutDuration,
  estimateStepDistanceFromDuration,
  formatDistance,
  formatDuration,
} from '@openathlete/shared';

import { DurationDisplay } from './duration-display';
import { TargetBadge } from './target-badge';
import { TypeIcon } from './type-icon';
import { metricValues } from './workout-profile';

interface WorkoutSummaryProps {
  workout: WorkoutDto;
  /** Distance steps without a pace are estimated at this sport's pace */
  sport?: SPORT_TYPE;
  /** The session's athlete: zone targets and metrics are theirs */
  athleteId?: number | null;
}

export function WorkoutSummary({
  workout,
  sport,
  athleteId,
}: WorkoutSummaryProps) {
  const { data: me } = useGetMyAthleteQuery();
  const { zones: trainingZones } = useAthleteTrainingZones(athleteId);
  const { data: latestMetrics } = useGetLatestMetricsQuery(
    athleteId ?? me?.athleteId,
  );
  const metrics = useMemo(() => metricValues(latestMetrics), [latestMetrics]);

  const estimatedDuration = calculateWorkoutDuration(workout, metrics, sport);
  const totalDistance = calculateWorkoutDistance(
    workout,
    metrics,
    sport,
    trainingZones,
  );
  const hasEstimatedDistance = useMemo(
    () =>
      workout.steps.some((step: WorkoutStepDto) => {
        if (step.stepType === 'REPEAT' && step.repeatBlock) {
          return step.repeatBlock.childSteps.some(
            (child: WorkoutStepDto) =>
              estimateStepDistanceFromDuration(
                child,
                metrics,
                sport,
                trainingZones,
              ) !== null,
          );
        }
        return (
          estimateStepDistanceFromDuration(
            step,
            metrics,
            sport,
            trainingZones,
          ) !== null
        );
      }),
    [workout.steps, metrics, sport, trainingZones],
  );

  const renderStep = (step: WorkoutStepDto, index: number, isChild = false) => {
    const isRepeat = step.stepType === 'REPEAT' && step.repeatBlock;

    return (
      <div
        key={step.workoutStepId || index}
        className={`${isChild ? 'border-l-2 border-muted' : ''}`}
      >
        <div className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {isChild ? `${index + 1}` : `${m.step()} ${index + 1}`}
            </span>
            <TypeIcon
              stepType={step.stepType}
              className="h-8 w-8 flex-shrink-0"
            />
          </div>

          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium text-sm break-words">
                {getStepTypeLabel(step.stepType)}{' '}
                {step.name ? `- ${step.name}` : ''}
              </span>
              {step.exerciseName && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  • {step.exerciseName}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {!step.repeatBlock && (
                <DurationDisplay
                  className="text-sm text-muted-foreground flex-shrink-0"
                  durationType={step.durationType}
                  durationValue={step.durationValue}
                  targets={step.targets}
                  sport={sport}
                  metrics={metrics}
                  trainingZones={trainingZones}
                />
              )}

              {step.targets && step.targets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step.targets.map(
                    (target: WorkoutStepTargetDto, idx: number) => (
                      <TargetBadge
                        key={idx}
                        target={target}
                        showAbsoluteValues={true}
                        athleteId={athleteId}
                      />
                    ),
                  )}
                </div>
              )}
            </div>

            {step.notes && (
              <p className="text-sm text-muted-foreground italic">
                {step.notes}
              </p>
            )}

            {isRepeat && step.repeatBlock && (
              <div className="mt-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                    {m.workout_repetitions({
                      count: step.repeatBlock.repetitions,
                    })}
                  </span>
                </div>
                <div className="space-y-2">
                  {step.repeatBlock.childSteps.map(
                    (childStep: WorkoutStepDto, childIdx: number) =>
                      renderStep(childStep, childIdx, true),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const content = (
    <>
      {workout.steps.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">{m.workout_summary_empty()}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workout.steps.map((step: WorkoutStepDto, index: number) =>
            renderStep(step, index),
          )}
        </div>
      )}

      {workout.steps.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {estimatedDuration && (
              <div>
                <span className="text-muted-foreground">
                  {m.workout_estimated_duration()}:
                </span>
                <span className="ml-2 font-medium">
                  {formatDuration(Math.round(estimatedDuration))}
                </span>
              </div>
            )}
            {totalDistance && (
              <div>
                <span className="text-muted-foreground">
                  {m.workout_estimated_distance()}:
                </span>
                <span className="ml-2 font-medium">
                  {hasEstimatedDistance ? '~' : ''}
                  {formatDistance(totalDistance, 'km')}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

  return <div>{content}</div>;
}
