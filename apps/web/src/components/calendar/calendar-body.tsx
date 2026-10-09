import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';

import { EVENT_TYPE, endOfDay, startOfDay } from '@openathlete/shared';

import { CalendarDay } from './calendar-day';
import { CalendarWeekSummary } from './calendar-week-summary';
import { useCalendarContext } from './hooks/use-calendar-context';
import { calculateCyclesForDay } from './utils/cycle-day-layout';

export function CalendarBody() {
  const { displayedWeeks, events, cycles, cycleResize } = useCalendarContext();

  // Create a modified cycles array with resize preview
  const displayedCycles = cycles.map((cycle) => {
    if (cycleResize && cycle.cycleId === cycleResize.cycleId) {
      return {
        ...cycle,
        startDate: cycleResize.currentStart,
        endDate: cycleResize.currentEnd,
      };
    }
    return cycle;
  });

  return (
    <div className="w-full border-1 rounded-lg shadow-sm">
      {/* Header row with days */}
      <div className="grid grid-cols-7 md:grid-cols-8 border-b-1">
        {displayedWeeks[0].map((day, i) => (
          <div
            key={i}
            className="h-8 flex justify-center items-center text-sm font-semibold [&:not(:last-child)]:border-r-1"
          >
            {new Date(day).toLocaleString(getDateLocale(getLocale()), {
              weekday: 'short',
            })}
          </div>
        ))}
        <div className="hidden md:flex h-8 items-center px-2 text-xs font-semibold text-muted-foreground">
          {m.calendar_week_summary_heading()}
        </div>
      </div>

      {/* Week rows */}
      {displayedWeeks.map((week, weekIndex) => (
        <div key={weekIndex}>
          <div className="grid grid-cols-7 md:grid-cols-8 [&:not(:last-child)]:border-b-1">
            {week.map((day, i) => (
              <CalendarDay
                key={i}
                day={day}
                events={events.filter(
                  (event) =>
                    event.startDate.toDateString() === day.toDateString() &&
                    !(
                      (event.type === EVENT_TYPE.COMPETITION ||
                        event.type === EVENT_TYPE.TRAINING) &&
                      event.relatedActivity
                    ),
                )}
                cycleSegments={calculateCyclesForDay(displayedCycles, day)}
              />
            ))}
            {/* Summary column - hidden on mobile, shown on desktop */}
            <div className="hidden md:block">
              <CalendarWeekSummary
                week={week}
                events={events.filter(
                  (event) =>
                    event.startDate.getTime() >=
                      startOfDay(week[0]).getTime() &&
                    event.startDate.getTime() <= endOfDay(week[6]).getTime(),
                )}
              />
            </div>
          </div>
          {/* Summary row for mobile - shown after each week row */}
          <div className="md:hidden border-b-1">
            <CalendarWeekSummary
              week={week}
              events={events.filter(
                (event) =>
                  event.startDate.getTime() >= startOfDay(week[0]).getTime() &&
                  event.startDate.getTime() <= endOfDay(week[6]).getTime(),
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
