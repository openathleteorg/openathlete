import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';

import { EVENT_TYPE, endOfDay, startOfDay } from '@openathlete/shared';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CalendarDay } from './calendar-day';
import { CalendarWeekSummary } from './calendar-week-summary';
import { useCalendarContext } from './hooks/use-calendar-context';
import { calculateCyclesForDay } from './utils/cycle-day-layout';

export function CalendarBody() {
  const {
    displayedWeeks,
    events,
    cycles,
    summaryType,
    setSummaryType,
    cycleResize,
  } = useCalendarContext();

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
    <div className="w-full border-1 rounded-lg">
      <div className="grid grid-cols-8 border-b-1">
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
        <div className="h-8 [&:not(:last-child)]:border-r-1">
          <Select value={summaryType} onValueChange={setSummaryType}>
            <SelectTrigger
              className="border-0 shadow-none py-0 w-full"
              style={{ height: '100%' }}
            >
              <SelectValue className="font-bold" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned-done">{m.planned_done()}</SelectItem>
              <SelectItem value="planned">{m.planned()}</SelectItem>
              <SelectItem value="done">{m.done()}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {displayedWeeks.map((week, weekIndex) => (
        <div
          key={weekIndex}
          className="grid grid-cols-8 [&:not(:last-child)]:border-b-1"
        >
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
          <CalendarWeekSummary
            events={events.filter(
              (event) =>
                event.startDate.getTime() >= startOfDay(week[0]).getTime() &&
                event.startDate.getTime() <= endOfDay(week[6]).getTime(),
            )}
          />
        </div>
      ))}
    </div>
  );
}
