import type { CreateWorkoutStepDto } from '@openathlete/shared';
import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

import { SessionBuilder } from '../../session-builder/session-builder';
import { StrengthBuilder } from '../../strength/strength-builder';
import { isStrengthSport } from '../../strength/strength-sports';
import { WorkoutAthleteContext } from '../../workout/workout-athlete-context';

type WorkoutSectionProps = {
  type: EVENT_TYPE;
  workoutSteps: CreateWorkoutStepDto[];
  setWorkoutSteps: (steps: CreateWorkoutStepDto[]) => void;
  sportValue?: SPORT_TYPE;
  /** The session's athlete; null for a template (the user's own zones) */
  athleteId?: number | null;
};

export function WorkoutSection({
  type,
  workoutSteps,
  setWorkoutSteps,
  sportValue,
  athleteId,
}: WorkoutSectionProps) {
  if (type !== EVENT_TYPE.TRAINING) return null;
  return (
    // Zone pickers and badges inside use the session athlete's zones
    <WorkoutAthleteContext.Provider value={athleteId ?? null}>
      {isStrengthSport(sportValue) ? (
        <StrengthBuilder
          steps={workoutSteps}
          onChange={setWorkoutSteps}
          sport={sportValue!}
        />
      ) : (
        <SessionBuilder
          steps={workoutSteps}
          onChange={setWorkoutSteps}
          sport={sportValue ?? SPORT_TYPE.RUNNING}
          athleteId={athleteId ?? null}
        />
      )}
    </WorkoutAthleteContext.Provider>
  );
}
