import { RHFDatePicker, RHFSelect } from '@/components/hook-form';
import { SelectItem } from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { addDays } from 'date-fns';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { REPEAT_MAX_DAYS } from '@openathlete/shared';

import { endOfLocalDateInput } from '../../calendar/utils/local-date';
import { NO_REPEAT, countRepeats, defaultRepeatUntil } from '../utils/repeat';

const EVERY_WEEKS = [1, 2, 3, 4];

/** "Repeat every N weeks until a date", for a new session */
export function RepeatFields({ startDate }: { startDate?: Date }) {
  const { watch, setValue, getValues } = useFormContext();
  const everyWeeks = Number(watch('repeatEveryWeeks') ?? NO_REPEAT);
  const until = watch('repeatUntil') as string | undefined;

  // Turning the repetition on proposes eight weeks
  useEffect(() => {
    if (everyWeeks > 0 && !getValues('repeatUntil') && startDate) {
      const day = defaultRepeatUntil(startDate);
      day.setHours(12, 0, 0, 0);
      setValue('repeatUntil', day.toISOString());
    }
  }, [everyWeeks, startDate, getValues, setValue]);

  const count =
    everyWeeks > 0 && until && startDate
      ? countRepeats(startDate, everyWeeks, endOfLocalDateInput(until))
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-repeat-fields>
      <RHFSelect name="repeatEveryWeeks" label={m.repeat()}>
        <SelectItem value={NO_REPEAT}>{m.repeat_never()}</SelectItem>
        {EVERY_WEEKS.map((weeks) => (
          <SelectItem key={weeks} value={String(weeks)}>
            {weeks === 1
              ? m.repeat_every_week()
              : m.repeat_every_n_weeks({ count: weeks })}
          </SelectItem>
        ))}
      </RHFSelect>
      {everyWeeks > 0 && (
        <RHFDatePicker
          name="repeatUntil"
          label={m.repeat_until()}
          min={startDate}
          max={startDate ? addDays(startDate, REPEAT_MAX_DAYS) : undefined}
        />
      )}
      {everyWeeks > 0 && (
        <p className="text-xs text-muted-foreground md:col-span-2">
          {m.repeat_summary({ count })}
        </p>
      )}
    </div>
  );
}
