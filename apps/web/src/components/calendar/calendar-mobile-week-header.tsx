import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { endOfDay, format, getISOWeek, startOfDay } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Event } from '@openathlete/shared';

import { CalendarWeekActions } from './calendar-week-actions';
import { CalendarWeekSummary } from './calendar-week-summary';
import { useCalendarContext } from './hooks/use-calendar-context';
import {
  formatCompactDuration,
  formatCompactKilometers,
  summarizeWeek,
} from './utils/week-summary';

interface P {
  week: Date[];
  events: Event[];
}

/** A line per week with its totals; the full summary opens from it. */
export function CalendarMobileWeekHeader({ week, events }: P) {
  const { allowCreate } = useCalendarContext();
  const [open, setOpen] = useState(false);
  const weekStart = week[0];
  const weekEnd = week[6];
  const weekEvents = events.filter(
    (event) =>
      event.startDate.getTime() >= startOfDay(weekStart).getTime() &&
      event.startDate.getTime() <= endOfDay(weekEnd).getTime(),
  );
  const dateFnsLocale = getDateFnsLocale(getLocale());
  const summary = summarizeWeek(weekEvents);
  const duration = summary.duration.done || summary.duration.planned;
  const distance = summary.distance.done || summary.distance.planned;
  const totals = [
    !!duration && formatCompactDuration(duration),
    !!distance && `${formatCompactKilometers(distance, getLocale())} km`,
  ].filter(Boolean);

  return (
    <div className="border-b border-border/60 bg-muted/50">
      <div className="flex min-h-11 items-center gap-2 pr-1 pl-4">
        <button
          type="button"
          aria-expanded={open}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="text-sm font-semibold first-letter:uppercase">
            {m.calendar_week_title({ week: getISOWeek(weekStart) })}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {format(weekStart, 'd MMM', { locale: dateFnsLocale })} –{' '}
            {format(weekEnd, 'd MMM', { locale: dateFnsLocale })}
          </span>
          <span className="ml-auto shrink-0 text-xs font-medium text-muted-foreground">
            {totals.join(' · ')}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
        {allowCreate && (
          <CalendarWeekActions weekStart={weekStart} events={weekEvents} />
        )}
      </div>
      {open && (
        <div className="px-4 pb-3">
          <CalendarWeekSummary events={weekEvents} week={week} />
        </div>
      )}
    </div>
  );
}
