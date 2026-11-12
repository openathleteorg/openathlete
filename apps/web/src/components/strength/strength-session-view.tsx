import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useMemo } from 'react';

import type {
  CreateWorkoutStepDto,
  StrengthExercise,
} from '@openathlete/shared';
import { WORKOUT_REPEAT_KIND, strengthBlocks } from '@openathlete/shared';

import { formatStepLength } from '../session-builder/step-summary';
import { ExerciseVisual } from './exercise-visual';
import { setsSummary } from './sets-summary';
import { formatSeconds, formatWork } from './strength-input';
import { groupKindLabel, sideLabel } from './strength-labels';
import { useExercises } from './use-exercises';

function ExerciseLine({
  exercise,
  detail,
}: {
  exercise: StrengthExercise;
  detail: string;
}) {
  const { resolve } = useExercises();
  const info = resolve(exercise.exerciseRef, exercise.name);
  return (
    <li className="group flex items-center gap-3" data-session-exercise>
      <ExerciseVisual
        exercise={info}
        animate="hover"
        className="size-14 shrink-0 rounded-lg bg-muted/50 [&>div]:m-1"
      />
      <div className="min-w-0">
        <p className="truncate font-medium">{exercise.name || info?.name}</p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {[
            detail,
            exercise.side && sideLabel(exercise.side),
            exercise.tempo && `${m.strength_tempo()} ${exercise.tempo}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {exercise.notes && (
          <p className="text-sm italic text-muted-foreground">
            {exercise.notes}
          </p>
        )}
      </div>
    </li>
  );
}

/** A strength session as the athlete reads it: each exercise drawn, with its sets */
export function StrengthSessionView({
  steps,
  className,
}: {
  steps: CreateWorkoutStepDto[];
  className?: string;
}) {
  const blocks = useMemo(() => strengthBlocks(steps), [steps]);
  return (
    <ol className={cn('space-y-3', className)} data-strength-view>
      {blocks.map((block, index) => {
        if (block.kind === 'exercise') {
          return (
            <ul key={index}>
              <ExerciseLine
                exercise={block.exercise}
                detail={setsSummary(block.exercise.sets)}
              />
            </ul>
          );
        }
        if (block.kind === 'group') {
          const timing =
            block.group === WORKOUT_REPEAT_KIND.AMRAP
              ? formatSeconds(block.timeCapSeconds)
              : block.group === WORKOUT_REPEAT_KIND.EMOM
                ? `${block.rounds} × ${formatSeconds(block.intervalSeconds)}`
                : `${block.rounds} ${m.strength_rounds().toLowerCase()}`;
          return (
            <li
              key={index}
              className="rounded-xl border-2 border-primary/20 p-3"
            >
              <p className="mb-2 text-sm font-semibold">
                {block.name || groupKindLabel(block.group)} · {timing}
                {block.roundRest
                  ? ` · ${m.strength_round_rest()} ${formatSeconds(block.roundRest)}`
                  : ''}
              </p>
              <ul className="space-y-2">
                {block.exercises.map((exercise, position) => (
                  <ExerciseLine
                    key={position}
                    exercise={exercise}
                    detail={[
                      exercise.sets[0] &&
                        (exercise.sets[0].work.type === 'REPS'
                          ? `${exercise.sets[0].work.value} ${m.strength_reps_short()}`
                          : formatWork(exercise.sets[0].work)),
                      exercise.sets[0]?.load && `${exercise.sets[0].load} kg`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  />
                ))}
              </ul>
            </li>
          );
        }
        return (
          <li key={index} className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatStepLength(block.step)}
            </span>{' '}
            {block.step.name}
          </li>
        );
      })}
    </ol>
  );
}
