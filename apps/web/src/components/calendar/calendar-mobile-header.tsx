import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppBar } from '@/hooks/use-app-bar';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { hapticTap } from '@/utils/haptics';
import { getDateFnsLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { addDays, format, isSameDay, isToday, startOfWeek } from 'date-fns';
import { BookOpen, SlidersHorizontal } from 'lucide-react';
import { type ReactNode, useMemo, useRef, useState } from 'react';

import { EVENT_TYPE } from '@openathlete/shared';

import { BulkWorkoutSelectButton } from './bulk-workout-select-button';
import { CalendarViewToggle } from './calendar-view-toggle';
import { ComplianceLegend } from './compliance-badge';
import { useTemplateLibrarySidebar } from './contexts/template-library-sidebar-context';
import { useCalendarContext } from './hooks/use-calendar-context';

interface P {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  /** Filters and display choices, shared with the desktop toolbar */
  options: ReactNode;
}

const SWIPE_DISTANCE = 48;

/** The week around the selected day: a tap jumps to a day, a swipe a week. */
function WeekStrip({
  selectedDay,
  onSelectDay,
}: Pick<P, 'selectedDay' | 'onSelectDay'>) {
  const { events } = useCalendarContext();
  const touchStart = useRef<number | null>(null);
  const monday = startOfWeek(selectedDay, { weekStartsOn: 1 });
  const locale = getDateFnsLocale(getLocale());
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const counts = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const event of events) {
      if (event.type === EVENT_TYPE.NOTE) continue;
      const key = event.startDate.toDateString();
      byDay[key] = (byDay[key] ?? 0) + 1;
    }
    return byDay;
  }, [events]);

  return (
    <div
      data-calendar-week-strip
      className="grid grid-cols-7 px-2 pb-1"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = event.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (Math.abs(distance) > SWIPE_DISTANCE) {
          hapticTap();
          onSelectDay(addDays(selectedDay, distance < 0 ? 7 : -7));
        }
      }}
    >
      {days.map((day) => {
        const selected = isSameDay(day, selectedDay);
        const today = isToday(day);
        const count = counts[day.toDateString()] ?? 0;
        return (
          <button
            key={day.toISOString()}
            type="button"
            aria-pressed={selected}
            aria-label={format(day, 'EEEE d MMMM', { locale })}
            className="flex min-h-14 flex-col items-center gap-0.5"
            onClick={() => {
              hapticTap();
              onSelectDay(day);
            }}
          >
            <span className="text-[0.6875rem] font-medium text-muted-foreground uppercase">
              {format(day, 'EEEEE', { locale })}
            </span>
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-[0.9375rem] font-medium transition-colors',
                selected && 'bg-primary text-primary-foreground',
                !selected &&
                  today &&
                  'text-destructive-foreground font-semibold',
              )}
            >
              {format(day, 'd')}
            </span>
            <span className="flex h-1 gap-0.5">
              {Array.from({ length: Math.min(count, 3) }, (_, index) => (
                <span
                  key={index}
                  className="size-1 rounded-full bg-muted-foreground/60"
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The calendar's title, week strip and everything that adjusts the view. */
export function CalendarMobileHeader({ selectedDay, onSelectDay, options }: P) {
  const { view, goToCurrentMonth, displayedMonth } = useCalendarContext();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const { setOpen: setTemplatesOpen } = useTemplateLibrarySidebar();
  const locale = getDateFnsLocale(getLocale());
  const onToday = isToday(selectedDay);
  const titleDate = view === 'month' ? selectedDay : displayedMonth;
  const title = format(titleDate, 'LLLL yyyy', { locale });

  const appBar = useMemo(
    () => ({
      titleContent: (
        <h1 className="truncate pl-1 text-[1.0625rem] font-semibold tracking-tight capitalize">
          {title}
        </h1>
      ),
      trailing: (
        <>
          {!onToday && view === 'month' && (
            <Button
              variant="ghost"
              className="h-11 rounded-full px-3 text-sm"
              data-calendar-today
              onClick={() => {
                goToCurrentMonth();
                onSelectDay(new Date());
              }}
            >
              {m.nav_tab_today()}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
            aria-label={m.calendar_options()}
            data-calendar-options
            onClick={() => setOptionsOpen(true)}
          >
            <SlidersHorizontal className="size-5" />
          </Button>
        </>
      ),
      fullHeight: view === 'month',
    }),
    [title, onToday, view, goToCurrentMonth, onSelectDay],
  );
  useAppBar(appBar);

  return (
    <div className="z-10 border-b bg-background">
      <div className="px-4 pb-2 [&_[role=tablist]]:grid [&_[role=tablist]]:h-10 [&_[role=tablist]]:w-full [&_[role=tablist]]:grid-cols-3">
        <CalendarViewToggle />
      </div>
      {view === 'month' && (
        <WeekStrip selectedDay={selectedDay} onSelectDay={onSelectDay} />
      )}
      <Dialog open={optionsOpen} onOpenChange={setOptionsOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{m.calendar_options()}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 [&_button[role=combobox]]:h-12 [&_button[role=combobox]]:w-full">
            {options}
            <Button
              variant="outline"
              className="h-12 justify-start"
              data-calendar-template-library
              onClick={() => {
                setOptionsOpen(false);
                setTemplatesOpen(true);
              }}
            >
              <BookOpen className="size-4" />
              {m.template_library()}
            </Button>
            <BulkWorkoutSelectButton />
            <ComplianceLegend />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
