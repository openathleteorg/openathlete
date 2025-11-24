import { Separator } from '@/components/ui/separator';
import * as m from '@/paraglide/messages';
import { getStepTypeLabel } from '@/utils/workout';

import {
  type WorkoutDto,
  type WorkoutStepDto,
  type WorkoutStepTarget,
  calculateWorkoutDistance,
  calculateWorkoutDuration,
  formatDistance,
  formatDuration,
} from '@openathlete/shared';

import { DurationDisplay } from './duration-display';
import { TargetBadge } from './target-badge';
import { TypeIcon } from './type-icon';

interface WorkoutSummaryProps {
  workout: WorkoutDto;
}

export function WorkoutSummary({ workout }: WorkoutSummaryProps) {
  const estimatedDuration = calculateWorkoutDuration(workout);
  const totalDistance = calculateWorkoutDistance(workout);

  const renderStep = (step: WorkoutStepDto, index: number, isChild = false) => {
    const isRepeat = step.stepType === 'REPEAT' && step.repeatBlock;

    return (
      <div
        key={step.workoutStepId || index}
        className={`${isChild ? 'border-l-2 border-muted' : ''}`}
      >
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {isChild ? `${index + 1}` : `${m.step()} ${index + 1}`}
            </span>
            <TypeIcon stepType={step.stepType} className="h-8 w-8" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {getStepTypeLabel(step.stepType)}{' '}
                {step.name ? `- ${step.name}` : ''}
              </span>
              {step.exerciseName && (
                <span className="text-sm text-muted-foreground">
                  • {step.exerciseName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!step.repeatBlock && (
                <DurationDisplay
                  className="text-sm text-muted-foreground"
                  durationType={step.durationType}
                  durationValue={step.durationValue}
                />
              )}

              {step.targets && step.targets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step.targets.map(
                    (target: WorkoutStepTarget, idx: number) => (
                      <TargetBadge key={idx} target={target} />
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            {estimatedDuration && (
              <div>
                <span className="text-muted-foreground">
                  {m.workout_estimated_duration()}:
                </span>
                <span className="ml-2 font-medium">
                  {formatDuration(estimatedDuration)}
                </span>
              </div>
            )}
            {totalDistance && (
              <div>
                <span className="text-muted-foreground">
                  {m.workout_estimated_distance()}:
                </span>
                <span className="ml-2 font-medium">
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
