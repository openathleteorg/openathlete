import { m } from '@/paraglide/messages';
import { addDays, getISOWeek } from 'date-fns';

import { EVENT_TYPE } from '@openathlete/shared';

import { Loader } from '../ui/loader';
import { CalendarDay } from './calendar-day';
import { CalendarWeekActions } from './calendar-week-actions';
import { CalendarWeekSummary } from './calendar-week-summary';
import { useCalendarContext } from './hooks/use-calendar-context';
import { calculateCyclesForDay } from './utils/cycle-day-layout';

/** Reuses calendar day interactions and the existing planned/actual summary. */
export function CalendarWeekView({
  isLoading = false,
}: {
  isLoading?: boolean;
}) {
  const {
    displayedWeeks,
    weekStart,
    events,
    cycles,
    cycleResize,
    allowCreate,
  } = useCalendarContext();
  const days = displayedWeeks[0] ?? [];
  const end = addDays(weekStart, 7);
  const weekEvents = events.filter(
    (event) => event.startDate >= weekStart && event.startDate < end,
  );
  const displayedCycles = cycles.map((cycle) =>
    cycleResize?.cycleId === cycle.cycleId
      ? {
          ...cycle,
          startDate: cycleResize.currentStart,
          endDate: cycleResize.currentEnd,
        }
      : cycle,
  );
  return (
    <div
      data-calendar-week
      className="space-y-3 px-4 md:px-0"
      aria-busy={isLoading}
    >
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-7 rounded-lg border shadow-sm">
          {days.map((day) => (
            <CalendarDay
              key={day.toISOString()}
              day={day}
              variant="week"
              events={weekEvents.filter(
                (event) =>
                  event.startDate.toDateString() === day.toDateString() &&
                  !(
                    (event.type === EVENT_TYPE.TRAINING ||
                      event.type === EVENT_TYPE.COMPETITION) &&
                    event.relatedActivity
                  ),
              )}
              cycleSegments={calculateCyclesForDay(displayedCycles, day)}
            />
          ))}
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader />
            <span className="sr-only">{m.loading()}</span>
          </div>
        )}
      </div>
      <section className="rounded-lg border p-2">
        <div className="flex items-center justify-between gap-2 px-2">
          <h2 className="text-sm font-semibold">
            {m.calendar_week_title({ week: getISOWeek(weekStart) })}
            <span className="font-normal text-muted-foreground">
              {' · '}
              {m.calendar_week_summary_heading()}
            </span>
          </h2>
          {allowCreate && (
            <CalendarWeekActions weekStart={weekStart} events={weekEvents} />
          )}
        </div>
        <CalendarWeekSummary events={weekEvents} week={days} />
      </section>
    </div>
  );
}
