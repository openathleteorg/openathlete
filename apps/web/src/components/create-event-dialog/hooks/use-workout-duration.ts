import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
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
  const { data: athlete } = useGetMyAthleteQuery();
  const { data: latestMetrics = {} } = useGetLatestMetricsQuery(
    athlete?.athleteId,
  );

  // Convert metrics format for calculateWorkoutDuration
  const metricsForCalculation = useMemo(() => {
    const formatted: Record<string, { value: number }> = {};
    Object.entries(latestMetrics).forEach(([key, metric]) => {
      if (metric?.value !== undefined && metric?.value !== null) {
        formatted[key] = { value: metric.value };
      }
    });
    return formatted;
  }, [latestMetrics]);

  // Calculate total duration from workout steps
  const calculatedDuration = useMemo(() => {
    return calculateWorkoutDurationFromSteps(
      workoutSteps,
      metricsForCalculation,
    );
  }, [workoutSteps, metricsForCalculation]);

  const hasStepsWithDuration = calculatedDuration !== null;

  // Update goalDuration when calculated duration changes
  useEffect(() => {
    if (hasStepsWithDuration && calculatedDuration !== null && startDateValue) {
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
