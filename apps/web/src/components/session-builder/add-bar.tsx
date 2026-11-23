import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Plus, Repeat } from 'lucide-react';

import { WORKOUT_STEP_TYPE } from '@openathlete/shared';

import { ADDABLE_TYPES, type AddableType } from './step-defaults';
import { STEP_TONE } from './step-summary';
import { stepTypeLabel } from './step-type-label';

/**
 * One tap per kind of step, for those who build the session with the
 * mouse: the step comes with a length and a zone, its panel open.
 */
export function AddBar({
  onAdd,
  className,
}: {
  onAdd: (type: AddableType) => void;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      data-add-bar
    >
      <span className="mr-0.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Plus className="size-3.5" aria-hidden />
        {m.builder_add_label()}
      </span>
      {ADDABLE_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed bg-background px-3 text-sm font-medium transition-colors hover:border-solid hover:bg-accent"
          data-add-step={type}
        >
          {type === WORKOUT_STEP_TYPE.REPEAT ? (
            <Repeat className="size-3.5 text-muted-foreground" aria-hidden />
          ) : (
            <span
              className="size-2 rounded-full"
              style={{ background: STEP_TONE[type] }}
              aria-hidden
            />
          )}
          {stepTypeLabel(type)}
        </button>
      ))}
    </div>
  );
}
