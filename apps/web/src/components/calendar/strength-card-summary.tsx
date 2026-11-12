import { m } from '@/paraglide/messages';
import { Dumbbell } from 'lucide-react';
import { useMemo } from 'react';

import type { WorkoutStep } from '@openathlete/shared';
import { normalizeWorkoutForCreate, strengthBlocks } from '@openathlete/shared';

/** A strength session on its card: how many exercises, not an effort profile */
export function StrengthCardSummary({ steps }: { steps: WorkoutStep[] }) {
  const count = useMemo(() => {
    const blocks = strengthBlocks(
      normalizeWorkoutForCreate({ steps: steps as never }).steps,
    );
    return blocks.reduce(
      (sum, block) =>
        sum +
        (block.kind === 'exercise'
          ? 1
          : block.kind === 'group'
            ? block.exercises.length
            : 0),
      0,
    );
  }, [steps]);
  if (!count) return null;
  return (
    <span
      className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground"
      data-strength-card
    >
      <Dumbbell className="size-3" aria-hidden />
      {m.player_ready_count({ count })}
    </span>
  );
}
