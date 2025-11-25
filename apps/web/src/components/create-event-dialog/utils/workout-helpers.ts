import type {
  CreateWorkoutStepDto,
  WorkoutDto,
  WorkoutStepDto,
  WorkoutStepTarget,
} from '@openathlete/shared';
import { calculateWorkoutDuration } from '@openathlete/shared';

/**
 * Calculate total duration from workout steps
 * Estimates duration for DISTANCE-based steps using pace targets
 * @param steps - Workout steps to calculate duration for
 * @param metrics - Optional athlete metrics for estimating distance-based durations
 */
export function calculateWorkoutDurationFromSteps(
  steps: CreateWorkoutStepDto[],
  metrics?: Record<string, { value: number } | number>,
): number | null {
  if (steps.length === 0) {
    return null;
  }

  // Convert CreateWorkoutStepDto[] to WorkoutDto for calculation
  const workout = {
    steps: steps.map((step, index) => ({
      ...step,
      workoutStepId: -(Date.now() + index),
      orderIndex: index,
    })) as WorkoutStepDto[],
    eventTrainingId: 0, // Not used by calculateWorkoutDuration
  } as WorkoutDto;

  return calculateWorkoutDuration(workout, metrics);
}

/**
 * Clean workout steps by removing database-specific fields
 */
export function cleanWorkoutSteps(
  steps: WorkoutStepDto[],
): CreateWorkoutStepDto[] {
  return steps.map((step) => {
    const { workoutStepId, workoutId, createdAt, updatedAt, ...stepData } =
      step;

    const cleanedTargets = step.targets?.map((target: WorkoutStepTarget) => {
      const {
        workoutStepTargetId,
        stepId,
        createdAt: targetCreatedAt,
        updatedAt: targetUpdatedAt,
        ...targetData
      } = target;
      return targetData;
    });

    let cleanedRepeatBlock = stepData.repeatBlock;
    if (stepData.repeatBlock?.childSteps) {
      cleanedRepeatBlock = {
        ...stepData.repeatBlock,
        childSteps: stepData.repeatBlock.childSteps.map(
          (childStep: WorkoutStepDto) => {
            const {
              workoutStepId: childWorkoutStepId,
              workoutId: childWorkoutId,
              createdAt: childCreatedAt,
              updatedAt: childUpdatedAt,
              ...childStepData
            } = childStep;
            const cleanedChildTargets = childStep.targets?.map(
              (target: WorkoutStepTarget) => {
                const {
                  workoutStepTargetId: childTargetId,
                  stepId: childStepId,
                  createdAt: childTargetCreatedAt,
                  updatedAt: childTargetUpdatedAt,
                  ...targetData
                } = target;
                return targetData;
              },
            );
            return {
              ...childStepData,
              targets: cleanedChildTargets,
            };
          },
        ),
      };
    }

    return {
      ...stepData,
      targets: cleanedTargets,
      repeatBlock: cleanedRepeatBlock,
    };
  });
}
