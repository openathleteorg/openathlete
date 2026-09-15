import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { endOfDay, format, getISOWeek, startOfDay } from 'date-fns';

import { Event } from '@openathlete/shared';

import { CalendarWeekSummary } from './calendar-week-summary';
import { useCalendarContext } from './hooks/use-calendar-context';

interface P {
  week: Date[];
  events: Event[];
}

export function CalendarMobileWeekHeader({ week, events }: P) {
  const { summaryType, setSummaryType } = useCalendarContext();
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
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {m.week_summary()} {m.ui_week_prefix()} {weekNumber} ({year})
          </h3>
          <p className="text-xs text-muted-foreground">
            {formattedStart} - {formattedEnd}
          </p>
        </div>
        <div className="flex items-center justify-end mb-3">
          <div className="flex gap-1">
            <button
              onClick={() => setSummaryType('planned-done')}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                summaryType === 'planned-done'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {m.planned_done()}
            </button>
            <button
              onClick={() => setSummaryType('planned')}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                summaryType === 'planned'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {m.planned()}
            </button>
            <button
              onClick={() => setSummaryType('done')}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                summaryType === 'done'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {m.done()}
            </button>
          </div>
        </div>
        <CalendarWeekSummary events={weekEvents} week={week} />
      </div>
    </div>
  );
}
