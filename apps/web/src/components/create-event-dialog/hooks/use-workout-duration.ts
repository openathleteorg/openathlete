import { useEffect, useMemo } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';

import type { CreateWorkoutStepDto } from '@openathlete/shared';

import type { EventFormValues } from '../utils/event-form-schemas';
import { calculateWorkoutDurationFromSteps } from '../utils/workout-helpers';

export function useWorkoutDuration(
  workoutSteps: CreateWorkoutStepDto[],
  watch: UseFormWatch<EventFormValues>,
  setValue: UseFormSetValue<EventFormValues>,
) {
  const startDateValue = watch('startDate');

  // Calculate total duration from workout steps
  const calculatedDuration = useMemo(() => {
    return calculateWorkoutDurationFromSteps(workoutSteps);
  }, [workoutSteps]);

  const hasStepsWithDuration = calculatedDuration !== null;

  // Update goalDuration when calculated duration changes
  useEffect(() => {
    if (hasStepsWithDuration && calculatedDuration !== null) {
      setValue('goalDuration', calculatedDuration);
      // Update endDate based on calculated duration
      const start = new Date(startDateValue);
      const end = new Date(start);
      end.setSeconds(start.getSeconds() + calculatedDuration);
      setValue('endDate', end);
    }
  }, [calculatedDuration, hasStepsWithDuration, setValue, startDateValue]);

  return {
    calculatedDuration,
    hasStepsWithDuration,
  };
}

