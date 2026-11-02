import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { Plus } from 'lucide-react';

import { Event } from '@openathlete/shared';

import { CalendarEvent } from './calendar-event';
import { CycleDaySegment } from './utils/cycle-day-layout';

interface P {
  day: Date;
  events: Event[];
  cycleSegments?: CycleDaySegment[];
  isToday: boolean;
  isSelected: boolean;
  onPlan?: (day: Date) => void;
}

export function CalendarMobileDay({
  day,
  events,
  cycleSegments = [],
  isToday,
  isSelected,
  onPlan,
}: P) {
  const dayName = day.toLocaleString(getDateLocale(getLocale()), {
    weekday: 'short',
  });

  return (
    <div
      data-mobile-calendar-day={day.toLocaleDateString('en-CA')}
      data-selected={isSelected || undefined}
      className="flex gap-3 border-b border-border/60 px-4 py-2.5"
    >
      <div className="flex w-10 shrink-0 flex-col items-center pt-0.5">
        <span className="text-[0.6875rem] font-medium text-muted-foreground uppercase">
          {dayName.replace('.', '')}
        </span>
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full text-lg font-semibold',
            isToday && 'bg-primary text-primary-foreground',
          )}
        >
          {day.getDate()}
        </span>
      </div>
      <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-2">
        {cycleSegments.map((segment, index) => (
          <div
            key={`${segment.cycle.cycleId}-${index}`}
            className="flex items-center gap-1.5"
          >
            <span
              className="size-2 rounded-full"
              style={{
                backgroundColor: segment.cycle.color || 'var(--primary)',
              }}
            />
            <span className="truncate text-xs font-medium">
              {segment.cycle.name}
            </span>
          </div>
        ))}
        {[...events]
          .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
          .map((event) => (
            <CalendarEvent key={event.eventId} event={event} />
          ))}
      </div>
      {onPlan && events.length === 0 && (
        <button
          type="button"
          aria-label={m.calendar_plan_on_day({
            date: day.toLocaleDateString(getDateLocale(getLocale())),
          })}
          className="-mr-2 flex size-11 shrink-0 items-center justify-center self-start rounded-full text-muted-foreground/70 active:bg-accent"
          onClick={() => onPlan(day)}
        >
          <Plus className="size-5" />
        </button>
      )}
    </div>
  );
}
