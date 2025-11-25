import { useCallback, useEffect, useMemo, useRef } from 'react';

import type {
  CreateEventDto,
  CreateWorkoutStepDto,
  Event,
  WorkoutDto,
  WorkoutStepDto,
} from '@openathlete/shared';
import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

import { WorkoutBuilder, WorkoutGraph } from '../../workout';
import { cleanWorkoutSteps } from '../utils/workout-helpers';

type CreateProps = {
  date?: Date;
  type?: EVENT_TYPE;
  prefilledData?: CreateEventDto;
};

type EditProps = {
  event?: Event;
};

type Props = CreateProps | EditProps;

type WorkoutSectionProps = {
  props: Props;
  type: EVENT_TYPE;
  workoutSteps: CreateWorkoutStepDto[];
  setWorkoutSteps: (steps: CreateWorkoutStepDto[]) => void;
  sportValue?: SPORT_TYPE;
  athleteId?: number;
};

export function WorkoutSection({
  props,
  type,
  workoutSteps,
  setWorkoutSteps,
  sportValue,
  athleteId,
}: WorkoutSectionProps) {
  const edit = 'event' in props;
  const create = 'type' in props && 'date' in props;
  const isTraining = type === EVENT_TYPE.TRAINING;

  // Use ref to store previous workoutSteps content to avoid infinite loops
  const prevWorkoutStepsRef = useRef<string>('');
  const prevWorkoutRef = useRef<WorkoutDto | null>(null);

  const existingWorkout = useMemo(() => {
    // Always use workoutSteps as source of truth when available (for both create and edit modes)
    // This ensures that AI modifications are properly reflected in the UI
    if (type === EVENT_TYPE.TRAINING && workoutSteps.length > 0) {
      // Create a stable content hash to detect actual changes
      const contentHash = JSON.stringify(workoutSteps);

      // Only create new workout object if content actually changed
      if (
        contentHash === prevWorkoutStepsRef.current &&
        prevWorkoutRef.current
      ) {
        return prevWorkoutRef.current;
      }

      const generateStableId = (
        step: CreateWorkoutStepDto,
        index: number,
        parentPath?: string,
      ) => {
        // Include childSteps in hash for repeat blocks to ensure uniqueness
        const stepHash = JSON.stringify({
          stepType: step.stepType,
          name: step.name,
          durationType: step.durationType,
          durationValue: step.durationValue,
          index,
          parentPath: parentPath ?? '',
          // Include childSteps content for repeat blocks to ensure stable IDs
          childStepsHash: step.repeatBlock?.childSteps
            ? JSON.stringify(step.repeatBlock.childSteps)
            : undefined,
        });
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < stepHash.length; i++) {
          const char = stepHash.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
      };

      const transformStep = (
        step: CreateWorkoutStepDto,
        index: number,
        parentPath?: string,
      ): WorkoutStepDto => {
        const currentPath = parentPath
          ? `${parentPath}.${index}`
          : `step.${index}`;
        const baseStep: WorkoutStepDto = {
          ...step,
          workoutStepId: generateStableId(step, index, parentPath),
          orderIndex: index,
        } as WorkoutStepDto;

        if (step.repeatBlock?.childSteps) {
          return {
            ...baseStep,
            repeatBlock: {
              ...step.repeatBlock,
              // Use childSteps directly from API - only add IDs if missing
              childSteps: step.repeatBlock.childSteps.map(
                (childStep, childIndex) => {
                  // If childStep already has an ID, use it; otherwise generate one
                  return {
                    ...childStep,
                    workoutStepId:
                      (childStep as WorkoutStepDto).workoutStepId ??
                      generateStableId(childStep, childIndex, currentPath),
                    orderIndex: childIndex,
                  } as WorkoutStepDto;
                },
              ),
            },
          } as WorkoutStepDto;
        }

        return baseStep;
      };

      const newWorkout = {
        steps: workoutSteps.map((step, index) => transformStep(step, index)),
      } as WorkoutDto;

      // Store for next comparison
      prevWorkoutStepsRef.current = contentHash;
      prevWorkoutRef.current = newWorkout;

      return newWorkout;
    }
    // Fallback to event workout if no workoutSteps (initial load in edit mode)
    if (edit && type === EVENT_TYPE.TRAINING && 'event' in props) {
      const eventWorkout =
        (props.event as { workout?: WorkoutDto })?.workout ?? null;
      // Reset refs when switching to event workout
      prevWorkoutStepsRef.current = '';
      prevWorkoutRef.current = eventWorkout;
      return eventWorkout;
    }
    // Reset refs when no workout
    prevWorkoutStepsRef.current = '';
    prevWorkoutRef.current = null;
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    edit,
    create,
    type,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    'event' in props ? props.event : null,
    // Use workoutSteps directly to detect all changes, including nested properties
    workoutSteps,
  ]);

  // Use ref to track last cleaned steps to avoid infinite loops
  const lastCleanedStepsRef = useRef<string>('');

  // Update ref when workoutSteps changes externally (e.g., from AI modification)
  useEffect(() => {
    const currentHash = JSON.stringify(workoutSteps);
    lastCleanedStepsRef.current = currentHash;
  }, [workoutSteps]);

  const handleStepsChange = useCallback(
    (steps: WorkoutStepDto[]) => {
      const cleanedSteps = cleanWorkoutSteps(steps);
      // Only update if steps actually changed to avoid infinite loops
      const newHash = JSON.stringify(cleanedSteps);
      if (lastCleanedStepsRef.current !== newHash) {
        lastCleanedStepsRef.current = newHash;
        setWorkoutSteps(cleanedSteps);
      }
    },
    [setWorkoutSteps],
  );

  if (!isTraining) {
    return null;
  }

  return (
    <div className="border-t pt-6">
      <div className="space-y-6">
        {existingWorkout?.steps?.length ? (
          <div className="bg-muted/40 border rounded-lg p-3">
            <WorkoutGraph
              workout={existingWorkout}
              sport={sportValue ?? SPORT_TYPE.RUNNING}
              athleteId={athleteId}
              maxHeight={80}
              className="w-full"
            />
          </div>
        ) : null}
        <WorkoutBuilder
          workout={existingWorkout}
          hideMetadataForm={true}
          hideActions={true}
          onStepsChange={handleStepsChange}
          sport={sportValue ?? SPORT_TYPE.RUNNING}
        />
      </div>
    </div>
  );
}
