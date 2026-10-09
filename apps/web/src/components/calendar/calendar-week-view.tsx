import { useMediaQuery } from '@/hooks/use-media-query';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { addDays, getISOWeek } from 'date-fns';

import { EVENT_TYPE } from '@openathlete/shared';

import { Loader } from '../ui/loader';
import { CalendarDay } from './calendar-day';
import { CalendarWeekActions } from './calendar-week-actions';
import { CalendarWeekSummary } from './calendar-week-summary';
import { useCalendarContext } from './hooks/use-calendar-context';
import { calculateCyclesForDay } from './utils/cycle-day-layout';
import { formatDayTotal } from './utils/day-total';
import { summarizeWeek } from './utils/week-summary';

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
  const sameDay = (event: (typeof events)[number], day: Date) =>
    event.startDate.toDateString() === day.toDateString();
  const locale = getLocale();
  // Tailwind's xl: room for the summary beside the days. Rendered once,
  // not hidden by CSS, so its actions exist once.
  const sideSummary = useMediaQuery('(min-width: 1280px)');

  return (
    <div
      data-calendar-week
      className="space-y-3 px-4 md:px-0"
      aria-busy={isLoading}
    >
      {/* The summary sits beside the days once there is room for both */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_11rem] xl:rounded-lg xl:border xl:shadow-sm">
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-7 rounded-lg border shadow-sm xl:rounded-none xl:border-0 xl:shadow-none">
            {days.map((day) => (
              <CalendarDay
                key={day.toISOString()}
                day={day}
                variant="week"
                total={formatDayTotal(
                  summarizeWeek(
                    weekEvents.filter((event) => sameDay(event, day)),
                  ),
                  locale,
                )}
                events={weekEvents.filter(
                  (event) =>
                    sameDay(event, day) &&
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
        {sideSummary && (
          <aside
            className="border-l"
            aria-label={m.calendar_week_summary_heading()}
          >
            <CalendarWeekSummary withActions events={weekEvents} week={days} />
          </aside>
        )}
      </div>
      {!sideSummary && (
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
      )}
    </div>
  );
}
