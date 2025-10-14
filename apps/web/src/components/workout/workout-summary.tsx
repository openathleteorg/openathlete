import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import * as m from '@/paraglide/messages';
import { Repeat } from 'lucide-react';

import type { WorkoutDto, WorkoutStepDto } from '@openathlete/shared';

import { DurationDisplay } from './duration-display';
import { TargetBadge } from './target-badge';
import { TypeIcon } from './type-icon';

interface WorkoutSummaryProps {
  workout: WorkoutDto;
  showCard?: boolean; // Whether to wrap in a Card component
}

/**
 * WorkoutSummary - Read-only visual summary of a workout
 * Displays workout structure without edit capabilities
 * Used in event details view
 */
export function WorkoutSummary({
  workout,
  showCard = true,
}: WorkoutSummaryProps) {
  const renderStep = (step: WorkoutStepDto, index: number, isChild = false) => {
    const isRepeat = step.stepType === 'REPEAT' && step.repeatBlock;

    return (
      <div
        key={step.workoutStepId || index}
        className={`${isChild ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}
      >
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          {/* Step Number & Type Icon */}
          <div className="flex items-center gap-2 min-w-[80px]">
            <span className="text-sm font-medium text-muted-foreground">
              {isChild ? `${index + 1}` : `Step ${index + 1}`}
            </span>
            <TypeIcon stepType={step.stepType} className="h-4 w-4" />
          </div>

          {/* Step Info */}
          <div className="flex-1 space-y-2">
            {/* Name & Exercise */}
            <div className="flex items-center gap-2">
              {step.name && (
                <span className="font-medium text-sm">{step.name}</span>
              )}
              {step.exerciseName && (
                <span className="text-sm text-muted-foreground">
                  • {step.exerciseName}
                </span>
              )}
            </div>

            {/* Duration */}
            <DurationDisplay
              durationType={step.durationType}
              durationValue={step.durationValue}
            />

            {/* Targets */}
            {step.targets && step.targets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {step.targets.map((target: any, idx: number) => (
                  <TargetBadge key={idx} target={target} />
                ))}
              </div>
            )}

            {/* Notes */}
            {step.notes && (
              <p className="text-sm text-muted-foreground italic">
                {step.notes}
              </p>
            )}

            {/* Repeat Block */}
            {isRepeat && step.repeatBlock && (
              <div className="mt-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
                <div className="flex items-center gap-2 mb-3">
                  <Repeat className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                    {m.workout_repetitions({
                      count: step.repeatBlock.repetitions,
                    })}
                  </span>
                </div>
                <div className="space-y-2">
                  {step.repeatBlock.childSteps.map(
                    (childStep: any, childIdx: number) =>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{m.workout_summary_title()}</h3>
        <span className="text-sm text-muted-foreground">
          {workout.steps.length === 1
            ? m.workout_summary_steps({ count: workout.steps.length })
            : m.workout_summary_steps_plural({ count: workout.steps.length })}
        </span>
      </div>

      {/* Steps */}
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

      {/* Workout Summary */}
      {workout.steps.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            {workout.estimatedDuration && (
              <div>
                <span className="text-muted-foreground">Est. Duration:</span>
                <span className="ml-2 font-medium">
                  {Math.floor(workout.estimatedDuration / 60)}min
                </span>
              </div>
            )}
            {workout.totalDistance && (
              <div>
                <span className="text-muted-foreground">Est. Distance:</span>
                <span className="ml-2 font-medium">
                  {(workout.totalDistance / 1000).toFixed(2)}km
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{m.workout_summary_title()}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {workout.steps.length === 1
                ? m.workout_summary_steps({ count: workout.steps.length })
                : m.workout_summary_steps_plural({
                    count: workout.steps.length,
                  })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <div>{content}</div>;
}
