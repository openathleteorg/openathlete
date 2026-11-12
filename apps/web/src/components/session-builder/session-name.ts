import type { CreateWorkoutStepDto } from '@openathlete/shared';
import { WORKOUT_STEP_TYPE } from '@openathlete/shared';

import { formatStepLength, formatTotal } from './step-summary';

/**
 * A name the session gets from its content while the coach has not typed
 * one: its main sets ("6 × 1 km · 3 × 10'"), else its length. Only the
 * effort of each set: the recovery is implied.
 */
export function suggestSessionName(
  steps: CreateWorkoutStepDto[],
  sportLabel: string,
  totalSeconds: number | null,
): string {
  // A strength session is named after its first exercises
  const exercises = steps
    .flatMap((step) =>
      step.repeatBlock ? step.repeatBlock.childSteps : [step],
    )
    .filter((step) => step.exerciseRef && step.name)
    .map((step) => step.name as string)
    .filter((name, index, names) => names.indexOf(name) === index);
  if (exercises.length) {
    const shown = exercises.slice(0, 3).join(', ');
    return exercises.length > 3 ? `${shown}…` : shown;
  }
  const sets = steps
    .filter((step) => step.repeatBlock?.childSteps?.length)
    .map((step) => {
      const children = step.repeatBlock!.childSteps;
      const effort =
        children.find(
          (child) => child.stepType !== WORKOUT_STEP_TYPE.INTERVAL_REST,
        ) ?? children[0];
      const length = formatStepLength(effort);
      const name = step.name?.trim();
      return name || `${step.repeatBlock!.repetitions} × ${length ?? '…'}`;
    });
  if (sets.length) return sets.slice(0, 2).join(' · ');
  if (totalSeconds) return `${sportLabel} ${formatTotal(totalSeconds)}`;
  return '';
}
