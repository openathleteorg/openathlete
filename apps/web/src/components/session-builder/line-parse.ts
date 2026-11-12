import type {
  CreateWorkoutStepDto,
  CreateWorkoutStepTarget,
  WorkoutTextIssue,
} from '@openathlete/shared';
import {
  WORKOUT_STEP_TYPE,
  parseWorkoutText,
  serializeStepLine,
} from '@openathlete/shared';

import type { BuilderEnv } from './use-builder-env';

/**
 * Every input of the builder reads the workout text grammar: a duration
 * typed in a chip, a target, a whole line, the quick add. One syntax to
 * learn, the same everywhere.
 */

export function parseLines(
  text: string,
  env: BuilderEnv,
  stepType?: WORKOUT_STEP_TYPE,
): { steps: CreateWorkoutStepDto[]; issues: WorkoutTextIssue[] } {
  return parseWorkoutText(text, {
    sport: env.sport,
    zones: env.zones,
    stepType,
  });
}

/** One step written as a line, keeping the step's type */
export function parseLine(
  text: string,
  env: BuilderEnv,
  stepType: WORKOUT_STEP_TYPE,
) {
  const result = parseLines(`- ${text}`, env, stepType);
  const errors = result.issues.filter((issue) => issue.severity === 'error');
  // Columns of the issues, on the text without the "- " added
  return {
    steps: result.steps,
    errors: errors.map((issue) => ({
      ...issue,
      from: Math.max(0, issue.from - 2),
      to: Math.max(0, issue.to - 2),
    })),
  };
}

export function lineOf(step: CreateWorkoutStepDto, env: BuilderEnv): string {
  return serializeStepLine(step, {
    sport: env.sport,
    zones: env.zones,
    locale: env.locale,
  });
}

/** "10'", "400m", "1:30": a step length, or null */
export function parseLength(
  text: string,
  env: BuilderEnv,
): Pick<CreateWorkoutStepDto, 'durationType' | 'durationValue'> | null {
  const { steps, errors } = parseLine(text, env, WORKOUT_STEP_TYPE.STEADY);
  if (errors.length || steps.length !== 1 || steps[0].targets?.length) {
    return null;
  }
  return {
    durationType: steps[0].durationType,
    durationValue: steps[0].durationValue,
  };
}

/** "Z3", "4:20-4:30/km 180spm": targets, an empty list, or null on error */
export function parseTargets(
  text: string,
  env: BuilderEnv,
): CreateWorkoutStepTarget[] | null {
  if (!text.trim()) return [];
  const { steps, errors } = parseLine(
    `1m ${text}`,
    env,
    WORKOUT_STEP_TYPE.STEADY,
  );
  if (errors.length || steps.length !== 1) return null;
  return steps[0].targets ?? [];
}
