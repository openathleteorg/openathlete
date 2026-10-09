import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import { endOfDay, format, getISOWeek, startOfDay } from 'date-fns';

import { Event } from '@openathlete/shared';

import { CalendarWeekSummary } from './calendar-week-summary';

interface P {
  week: Date[];
  events: Event[];
}

export function CalendarMobileWeekHeader({ week, events }: P) {
  const weekStart = week[0];
  const weekEnd = week[6];

  const weekEvents = events.filter(
    (event) =>
      event.startDate.getTime() >= startOfDay(weekStart).getTime() &&
      event.startDate.getTime() <= endOfDay(weekEnd).getTime(),
  );

  // Calculate week number (ISO week)
  const weekNumber = getISOWeek(weekStart);
  const year = weekStart.getFullYear();

  // Format dates
  const dateFnsLocale = getDateFnsLocale(getLocale());
  const formattedStart = format(weekStart, 'd MMM', { locale: dateFnsLocale });
  const formattedEnd = format(weekEnd, 'd MMM', { locale: dateFnsLocale });

  return (
    <div className="sticky top-0 z-10 bg-muted/50 border-b border-border shadow-sm">
      <div className="px-4 py-3">
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {m.week_summary()} {m.ui_week_prefix()} {weekNumber} ({year})
          </h3>
          <p className="text-xs text-muted-foreground">
            {formattedStart} - {formattedEnd}
          </p>
        </div>
        <CalendarWeekSummary events={weekEvents} week={week} />
      </div>
    </div>
  );
}
