import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import type { StrengthLog, StrengthLogSet } from '@openathlete/shared';
import { strengthLogSchema } from '@openathlete/shared';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ExerciseVisual } from './exercise-visual';
import { formatSeconds } from './strength-input';
import { useExercises } from './use-exercises';

/** The sets of each exercise, in the order exercises came: a superset's too */
function byExercise(sets: StrengthLogSet[]) {
  const groups = new Map<
    string,
    { name: string; ref: string | null; sets: StrengthLogSet[] }
  >();
  for (const set of sets) {
    const key = set.exerciseRef ?? set.name;
    const group = groups.get(key);
    if (group) group.sets.push(set);
    else groups.set(key, { name: set.name, ref: set.exerciseRef, sets: [set] });
  }
  return [...groups.values()];
}

function setText(set: StrengthLogSet): string {
  const work =
    set.reps !== null
      ? String(set.reps)
      : set.seconds !== null
        ? formatSeconds(set.seconds) || '0"'
        : '✓';
  return set.load ? `${work} × ${set.load} kg` : work;
}

/** What the athlete did in the session player, set by set */
export function StrengthLogCard({
  log: raw,
  className,
}: {
  log: unknown;
  className?: string;
}) {
  const { resolve } = useExercises();
  const parsed = strengthLogSchema.safeParse(raw);
  if (!parsed.success) return null;
  const log: StrengthLog = parsed.data;
  const groups = byExercise(log.sets);
  const rounds = Object.values(log.amrapRounds);
  return (
    <Card className={className} data-strength-log>
      <CardHeader>
        <CardTitle>{m.player_log_title()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rounds.map((count, index) => (
          <p key={index} className="text-sm font-medium">
            {m.player_log_rounds({ count })}
          </p>
        ))}
        <ul className="space-y-3">
          {groups.map((group, index) => (
            <li key={index} className="flex items-center gap-3">
              <ExerciseVisual
                exercise={resolve(group.ref, group.name)}
                className="size-12 shrink-0 rounded-lg bg-muted/50 [&>div]:m-1"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{group.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {group.sets.map((set) => (
                    <span
                      key={set.key}
                      className={cn(
                        'rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums',
                        set.skipped && 'text-muted-foreground line-through',
                      )}
                      title={set.skipped ? m.player_log_skipped() : undefined}
                    >
                      {setText(set)}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
