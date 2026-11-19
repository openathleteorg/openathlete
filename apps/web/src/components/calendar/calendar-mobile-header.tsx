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
import { getDateFnsLocale, localizeDatePattern } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { addDays, format, isSameDay, isToday, startOfWeek } from 'date-fns';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { type ReactNode, useMemo, useRef, useState } from 'react';

import { EVENT_TYPE } from '@openathlete/shared';

import { BulkWorkoutSelectButton } from './bulk-workout-select-button';
import { CalendarGoToDate } from './calendar-go-to-date';
import { CalendarViewToggle } from './calendar-view-toggle';
import { ComplianceLegend } from './compliance-badge';
import { useTemplateLibrarySidebar } from './contexts/template-library-sidebar-context';
import { useCalendarContext } from './hooks/use-calendar-context';
import { SWIPE_DISTANCE } from './utils/swipe';

interface P {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  /** Filters and display choices, shared with the desktop toolbar */
  options: ReactNode;
}

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
      if (
        event.type === EVENT_TYPE.NOTE ||
        event.type === EVENT_TYPE.QUESTIONNAIRE
      )
        continue;
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
            aria-label={format(
              day,
              localizeDatePattern('EEEE d MMMM', getLocale()),
              { locale },
            )}
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

/**
 * The week on screen, with arrows to step a week back or forward. A swipe on
 * the days does the same (CalendarWeekView).
 */
function WeekNav() {
  const { weekStart, nextWeek, prevWeek } = useCalendarContext();
  const locale = getDateFnsLocale(getLocale());
  const pattern = localizeDatePattern('d MMM', getLocale());
  const step = (move: () => void) => () => {
    hapticTap();
    move();
  };

  return (
    <div
      data-calendar-week-nav
      className="flex items-center justify-between px-2 pb-1"
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-11 rounded-full"
        aria-label={m.calendar_previous_week()}
        onClick={step(prevWeek)}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <span
        className="text-sm font-medium tabular-nums"
        aria-live="polite"
        data-calendar-week-range
      >
        {format(weekStart, pattern, { locale })}
        {' – '}
        {format(addDays(weekStart, 6), pattern, { locale })}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 rounded-full"
        aria-label={m.calendar_next_week()}
        onClick={step(nextWeek)}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}

/** The calendar's title, week strip and everything that adjusts the view. */
export function CalendarMobileHeader({ selectedDay, onSelectDay, options }: P) {
  const {
    view,
    goToCurrentMonth,
    goToCurrentWeek,
    goToDate,
    displayedMonth,
    weekStart,
  } = useCalendarContext();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const { setOpen: setTemplatesOpen } = useTemplateLibrarySidebar();
  const locale = getDateFnsLocale(getLocale());
  const onToday = isToday(selectedDay);
  const now = new Date();
  const onCurrentWeek = now >= weekStart && now < addDays(weekStart, 7);
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
          {(view === 'month'
            ? !onToday
            : view === 'week' && !onCurrentWeek) && (
            <Button
              variant="ghost"
              className="h-11 rounded-full px-3 text-sm"
              data-calendar-today
              onClick={() => {
                if (view === 'week') goToCurrentWeek();
                else goToCurrentMonth();
                onSelectDay(new Date());
              }}
            >
              {m.nav_tab_today()}
            </Button>
          )}
          <CalendarGoToDate
            current={view === 'week' ? weekStart : titleDate}
            onSelect={(date) => {
              goToDate(date);
              onSelectDay(date);
            }}
            variant="ghost"
            className="size-11 rounded-full"
          />
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
    [
      title,
      titleDate,
      weekStart,
      onToday,
      onCurrentWeek,
      view,
      goToCurrentMonth,
      goToCurrentWeek,
      goToDate,
      onSelectDay,
    ],
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
      {view === 'week' && <WeekNav />}
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
