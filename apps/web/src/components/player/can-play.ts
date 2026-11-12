import type { CreateWorkoutStepDto } from '@openathlete/shared';
import { WORKOUT_DURATION_TYPE, sessionTimeline } from '@openathlete/shared';

/** Sessions the player can run: exercises, or steps it can count or time */
export function canPlay(steps: CreateWorkoutStepDto[]): boolean {
  return sessionTimeline(steps).some(
    (moment) =>
      moment.kind === 'amrap' ||
      (moment.kind === 'work' &&
        (!!moment.exerciseRef ||
          moment.work.type === WORKOUT_DURATION_TYPE.REPS)),
  );
}
