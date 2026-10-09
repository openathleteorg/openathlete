import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { cn } from '@/utils/shadcn';
import { format } from 'date-fns';

import { CalendarDayForm } from '@openathlete/shared';

/**
 * The week's load day by day: done in full colour, still planned lighter.
 * A glance at how the load is spread, next to the week's total.
 */
export function CalendarWeekLoadBars({
  week,
  dailyForm,
}: {
  week: Date[];
  dailyForm: Record<string, CalendarDayForm>;
}) {
  const days = week.map((date) => ({
    date,
    form: dailyForm[format(date, 'yyyy-MM-dd')],
  }));
  const max = Math.max(...days.map(({ form }) => form?.load ?? 0));
  if (!max) return null;
  const locale = getLocale();

  return (
    <ul
      className="flex h-6 items-end gap-0.5"
      aria-label={m.calendar_week_daily_load()}
      data-week-load-bars
    >
      {days.map(({ date, form }) => {
        const load = form?.load ?? 0;
        const label = m.calendar_week_daily_load_day({
          day: date.toLocaleDateString(locale, { weekday: 'long' }),
          load,
        });
        return (
          <li
            key={date.toISOString()}
            className="flex h-full flex-1 items-end"
            title={
              form?.projected && load
                ? `${label} · ${m.calendar_week_form_projected()}`
                : label
            }
          >
            <span
              className={cn(
                'w-full rounded-t-[2px]',
                form?.projected ? 'bg-primary/30' : 'bg-primary/80',
                !load && 'bg-muted',
              )}
              style={{
                height: load ? `${Math.max(12, (load / max) * 100)}%` : '2px',
              }}
            />
            <span className="sr-only">{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
