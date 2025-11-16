import { useEffect, useState } from 'react';

import type {
  CreateEventDto,
  CreateWorkoutStepDto,
  Event,
  WorkoutDto,
} from '@openathlete/shared';
import { EVENT_TYPE } from '@openathlete/shared';

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

export function useWorkoutSteps(props: Props) {
  const [workoutSteps, setWorkoutSteps] = useState<CreateWorkoutStepDto[]>([]);
  const edit = 'event' in props;
  const create = 'type' in props && 'date' in props;

  // Initialize workout steps from prefilled data or existing event
  useEffect(() => {
    const hasPrefilledData = 'prefilledData' in props && !!props.prefilledData;
    if (
      create &&
      hasPrefilledData &&
      props.prefilledData &&
      props.prefilledData.type === EVENT_TYPE.TRAINING
    ) {
      const prefilled = props.prefilledData;
      const hasWorkout = 'workout' in prefilled && !!prefilled.workout;
      if (
        hasWorkout &&
        prefilled.workout?.steps &&
        prefilled.workout.steps.length > 0
      ) {
        setWorkoutSteps(prefilled.workout.steps);
      } else {
        setWorkoutSteps([]);
      }
    } else if (
      edit &&
      'event' in props &&
      props.event &&
      props.event.type === EVENT_TYPE.TRAINING
    ) {
      const existingWorkout = (props.event as { workout?: WorkoutDto })
        ?.workout;
      if (existingWorkout?.steps) {
        setWorkoutSteps(cleanWorkoutSteps(existingWorkout.steps));
      } else {
        setWorkoutSteps([]);
      }
    } else {
      setWorkoutSteps([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    create,
    edit,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    'prefilledData' in props ? props.prefilledData : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    'event' in props ? props.event : null,
  ]);

  return {
    workoutSteps,
    setWorkoutSteps,
  };
}
