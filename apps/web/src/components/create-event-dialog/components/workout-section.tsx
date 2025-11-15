import { useCallback, useMemo } from 'react';

import type {
  CreateWorkoutStepDto,
  Event,
  WorkoutDto,
  WorkoutStepDto,
} from '@openathlete/shared';
import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

import { WorkoutBuilder } from '../../workout';
import { cleanWorkoutSteps } from '../utils/workout-helpers';

type CreateProps = {
  date?: Date;
  type?: EVENT_TYPE;
  prefilledData?: any;
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
};

export function WorkoutSection({
  props,
  type,
  workoutSteps,
  setWorkoutSteps,
  sportValue,
}: WorkoutSectionProps) {
  const edit = 'event' in props;
  const create = 'type' in props && 'date' in props;
  const isTraining = type === EVENT_TYPE.TRAINING;

  // Memoize workout steps key to avoid recreating the workout object
  const workoutStepsKey = useMemo(() => {
    return workoutSteps
      .map((s) => `${s.stepType}-${s.name}-${s.durationValue}`)
      .join('|');
  }, [workoutSteps]);

  const existingWorkout = useMemo(() => {
    if (edit && type === EVENT_TYPE.TRAINING && 'event' in props) {
      return (props.event as { workout?: WorkoutDto })?.workout ?? null;
    }
    if (create && type === EVENT_TYPE.TRAINING && workoutSteps.length > 0) {
      return {
        steps: workoutSteps.map((step, index) => ({
          ...step,
          workoutStepId: -(Date.now() + index),
          orderIndex: index,
        })) as WorkoutStepDto[],
      } as WorkoutDto;
    }
    return null;
  }, [
    edit,
    create,
    type,
    'event' in props ? props.event : null,
    workoutStepsKey,
  ]);

  const handleStepsChange = useCallback(
    (steps: WorkoutStepDto[]) => {
      const cleanedSteps = cleanWorkoutSteps(steps);
      setWorkoutSteps(cleanedSteps);
    },
    [setWorkoutSteps],
  );

  if (!isTraining) {
    return null;
  }

  return (
    <div className="border-t pt-6">
      <WorkoutBuilder
        trainingId={edit && 'event' in props ? props.event?.eventId || 0 : 0}
        workout={existingWorkout}
        hideMetadataForm={true}
        hideActions={true}
        onStepsChange={handleStepsChange}
        sport={sportValue ?? SPORT_TYPE.RUNNING}
      />
    </div>
  );
}
