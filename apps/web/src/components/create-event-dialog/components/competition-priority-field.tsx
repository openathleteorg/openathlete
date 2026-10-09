import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Controller, useFormContext } from 'react-hook-form';

import { COMPETITION_PRIORITY } from '@openathlete/shared';

const OPTIONS: { value: COMPETITION_PRIORITY | null; label: () => string }[] = [
  { value: null, label: m.competition_priority_none },
  { value: COMPETITION_PRIORITY.A, label: () => 'A' },
  { value: COMPETITION_PRIORITY.B, label: () => 'B' },
  { value: COMPETITION_PRIORITY.C, label: () => 'C' },
];

/** A, B or C priority of a race, or none, as one row of buttons */
export function CompetitionPriorityField() {
  const { control } = useFormContext();
  return (
    <Controller
      name="priority"
      control={control}
      render={({ field }) => (
        <div className="grid gap-3">
          <Label id="competition-priority-label">
            {m.competition_priority()}
          </Label>
          <div
            role="radiogroup"
            aria-labelledby="competition-priority-label"
            className="inline-flex w-fit rounded-md border p-0.5"
          >
            {OPTIONS.map(({ value, label }) => {
              const checked = (field.value ?? null) === value;
              return (
                <button
                  key={value ?? 'none'}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => field.onChange(value)}
                  className={cn(
                    'min-w-10 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                    checked
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {label()}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {m.competition_priority_help()}
          </p>
        </div>
      )}
    />
  );
}
