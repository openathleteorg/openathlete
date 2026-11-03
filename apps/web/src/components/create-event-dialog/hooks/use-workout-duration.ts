import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

import type { CreateWorkoutStepDto, SPORT_TYPE } from '@openathlete/shared';

import type { EventFormValues } from '../utils/event-form-schemas';
import {
  INITIAL_DURATION_MODE,
  adoptDuration,
  followWorkoutTotal,
} from '../utils/planned-duration';
import { calculateWorkoutDurationFromSteps } from '../utils/workout-helpers';

/**
 * The planned duration follows the workout's total until the coach sets it
 * by hand; then it stays theirs until they ask for the total again.
 */
export function useWorkoutDuration(
  workoutSteps: CreateWorkoutStepDto[],
  sport: SPORT_TYPE | undefined,
  getValues: UseFormGetValues<EventFormValues>,
  setValue: UseFormSetValue<EventFormValues>,
) {
  const { data: athlete, isLoading: athleteLoading } = useGetMyAthleteQuery();
  const { data: latestMetrics = {}, isLoading: metricsLoading } =
    useGetLatestMetricsQuery(athlete?.athleteId);
  // Before the metrics arrive, the total of a stored session would differ
  // from the one it was saved with, and read as set by hand
  const metricsReady = !athleteLoading && !metricsLoading;

  const metricsForCalculation = useMemo(() => {
    const formatted: Record<string, { value: number }> = {};
    Object.entries(latestMetrics).forEach(([key, metric]) => {
      if (metric?.value !== undefined && metric?.value !== null) {
        formatted[key] = { value: metric.value };
      }
    });
    return formatted;
  }, [latestMetrics]);

  const totalOf = useCallback(
    (steps: CreateWorkoutStepDto[], stepsSport = sport) => {
      const total = calculateWorkoutDurationFromSteps(
        steps,
        metricsForCalculation,
        stepsSport,
      );
      return total === null ? null : Math.round(total);
    },
    [metricsForCalculation, sport],
  );

  const calculatedDuration = useMemo(
    () => totalOf(workoutSteps),
    [totalOf, workoutSteps],
  );

  const [mode, setMode] = useState(INITIAL_DURATION_MODE);

  useEffect(() => {
    if (!metricsReady) return;
    const next = followWorkoutTotal(
      mode,
      getValues('goalDuration'),
      calculatedDuration,
    );
    if (next.mode !== mode) setMode(next.mode);
    if (next.goalDuration !== undefined) {
      setValue('goalDuration', next.goalDuration);
    }
  }, [calculatedDuration, metricsReady, mode, getValues, setValue]);

  /** The coach typed a duration: the workout no longer overwrites it */
  const setDurationByHand = useCallback(
    () => setMode({ manual: true, settled: true }),
    [],
  );

  /** Back to the workout's total */
  const followWorkout = useCallback(
    () => setMode({ manual: false, settled: true }),
    [],
  );

  /**
   * New steps and duration together, as the AI returns them, with their
   * sport: the form's has not re-rendered yet
   */
  const adoptStepsDuration = useCallback(
    (
      steps: CreateWorkoutStepDto[],
      goalDuration: number | null | undefined,
      stepsSport?: SPORT_TYPE,
    ) => {
      const adopted = adoptDuration(
        goalDuration,
        totalOf(steps, stepsSport ?? sport),
      );
      setMode(adopted.mode);
      setValue('goalDuration', adopted.goalDuration);
    },
    [setValue, sport, totalOf],
  );

  return {
    calculatedDuration,
    durationSetByHand: mode.manual,
    setDurationByHand,
    followWorkout,
    adoptStepsDuration,
  };
}
