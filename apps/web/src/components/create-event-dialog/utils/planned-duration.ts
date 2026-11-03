import { isDurationSetByHand } from '@openathlete/shared';

/** A planned session without a duration lasts an hour on the calendar */
const DEFAULT_SESSION_SECONDS = 3600;

export function plannedEndDate(
  start: Date,
  goalDuration: number | null | undefined,
): Date {
  return new Date(
    new Date(start).getTime() +
      (goalDuration || DEFAULT_SESSION_SECONDS) * 1000,
  );
}

/**
 * Whether the planned duration follows the workout's total. `settled` once
 * the duration the session opened with was compared to its workout.
 */
export type DurationMode = { manual: boolean; settled: boolean };

export const INITIAL_DURATION_MODE: DurationMode = {
  manual: false,
  settled: false,
};

/**
 * What the duration field becomes when the workout's total changes: the
 * total, unless the coach set the duration. A session that opens with a
 * duration other than its workout's keeps it: the coach chose it.
 * @returns the next mode, and the duration to write, if it changes
 */
export function followWorkoutTotal(
  mode: DurationMode,
  goalDuration: number | null | undefined,
  workoutTotal: number | null,
): { mode: DurationMode; goalDuration?: number } {
  if (workoutTotal === null) return { mode };
  if (!mode.settled) {
    const manual = isDurationSetByHand(goalDuration, workoutTotal);
    const settledMode = { manual, settled: true };
    return manual || goalDuration === workoutTotal
      ? { mode: settledMode }
      : { mode: settledMode, goalDuration: workoutTotal };
  }
  if (mode.manual || goalDuration === workoutTotal) return { mode };
  return { mode, goalDuration: workoutTotal };
}

/**
 * A duration that comes with new steps (an AI answer): kept when it differs
 * from their total, otherwise the duration follows the workout
 */
export function adoptDuration(
  goalDuration: number | null | undefined,
  workoutTotal: number | null,
): { mode: DurationMode; goalDuration: number | null } {
  const manual = isDurationSetByHand(goalDuration, workoutTotal);
  return {
    mode: { manual, settled: workoutTotal !== null },
    goalDuration: manual ? (goalDuration ?? null) : (workoutTotal ?? null),
  };
}
