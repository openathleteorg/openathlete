import { Loader } from '@/components/ui/loader';
import { m } from '@/paraglide/messages';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { EVENT_TYPE } from '@openathlete/shared';

import { CalendarMobileDay } from './calendar-mobile-day';
import { CalendarMobileWeekHeader } from './calendar-mobile-week-header';
import { useCalendarContext } from './hooks/use-calendar-context';
import { calculateCyclesForDay } from './utils/cycle-day-layout';

interface P {
  isLoading?: boolean;
  selectedDay: Date;
  onSelectedDayChange: (day: Date) => void;
  onPlanDay?: (day: Date) => void;
}

type ListItem =
  | { type: 'week-header'; week: Date[]; weekIndex: number }
  | { type: 'day'; day: Date; dayIndex: number };

export function CalendarMobileList({
  isLoading,
  selectedDay,
  onSelectedDayChange,
  onPlanDay,
}: P) {
  const { displayedWeeks, events, cycles, allowCreate } = useCalendarContext();

  const parentRef = useRef<HTMLDivElement>(null);
  // Set while scrolling to a tapped day: the scroll must not change it back
  const programmaticScroll = useRef(false);
  const initialScrollDone = useRef(false);
  const scrolledDay = useRef<string | null>(null);

  const items: ListItem[] = useMemo(() => {
    const result: ListItem[] = [];
    if (displayedWeeks && displayedWeeks.length > 0) {
      displayedWeeks.forEach((week, weekIndex) => {
        result.push({
          type: 'week-header',
          week,
          weekIndex,
        });
        week.forEach((day, dayIndex) => {
          result.push({
            type: 'day',
            day,
            dayIndex: weekIndex * 7 + dayIndex,
          });
        });
      });
    }
    return result;
  }, [displayedWeeks]);

  const dayIndex = useCallback(
    (date: Date) =>
      items.findIndex(
        (item) =>
          item.type === 'day' &&
          item.day.toDateString() === date.toDateString(),
      ),
    [items],
  );

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      if (index >= items.length || index < 0) {
        return 72;
      }
      const item = items[index];
      if (!item) {
        return 72;
      }
      if (item.type === 'week-header') {
        return 45;
      }
      const dayEvents = events.filter(
        (event) =>
          event.startDate.toDateString() === item.day.toDateString() &&
          !(
            (event.type === EVENT_TYPE.COMPETITION ||
              event.type === EVENT_TYPE.TRAINING) &&
            event.relatedActivity
          ),
      );
      const cycleSegments = calculateCyclesForDay(cycles, item.day);
      return (
        21 + Math.max(44, dayEvents.length * 72 + cycleSegments.length * 24)
      );
    },
    overscan: 10,
  });

  // Opens on today, or on the day already selected
  useEffect(() => {
    if (isLoading || initialScrollDone.current) return;
    const index = dayIndex(selectedDay);
    if (index < 0) return;
    initialScrollDone.current = true;
    scrolledDay.current = selectedDay.toDateString();
    virtualizer.scrollToIndex(index, { align: 'start' });
    // Rows above are measured as they render: settle on the day once more
    const frame = requestAnimationFrame(() =>
      virtualizer.scrollToIndex(index, { align: 'start' }),
    );
    return () => cancelAnimationFrame(frame);
  }, [isLoading, dayIndex, selectedDay, virtualizer]);

  // A day picked in the week strip
  useEffect(() => {
    if (!initialScrollDone.current) return;
    if (scrolledDay.current === selectedDay.toDateString()) return;
    const index = dayIndex(selectedDay);
    if (index < 0) return;
    scrolledDay.current = selectedDay.toDateString();
    programmaticScroll.current = true;
    virtualizer.scrollToIndex(index, { align: 'start', behavior: 'smooth' });
    const timeout = window.setTimeout(() => {
      programmaticScroll.current = false;
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [selectedDay, dayIndex, virtualizer]);

  // The week strip follows the list
  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;
    const onScroll = () => {
      if (programmaticScroll.current) return;
      const first = virtualizer.getVirtualItemForOffset(element.scrollTop + 1);
      const item = first && items[first.index];
      const day = item?.type === 'day' ? item.day : item?.week[0];
      if (!day || scrolledDay.current === day.toDateString()) return;
      scrolledDay.current = day.toDateString();
      onSelectedDayChange(day);
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    return () => element.removeEventListener('scroll', onScroll);
  }, [items, onSelectedDayChange, virtualizer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader size="lg" />
          <p className="text-sm text-muted-foreground">{m.loading()}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">{m.no_events()}</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      data-mobile-calendar-list
      className="relative h-full w-full overflow-auto overscroll-contain bg-background pb-24 scrollbar-hide"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().length === 0 && items.length > 0 && (
          <div className="p-4 text-sm text-muted-foreground">{m.loading()}</div>
        )}
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];

          if (!item) {
            return null;
          }

          const isToday =
            item.type === 'day' &&
            item.day.toDateString() === new Date().toDateString();

          if (item.type === 'week-header') {
            const weekEvents = events.filter(
              (event) =>
                event.startDate.getTime() >= item.week[0].getTime() &&
                event.startDate.getTime() <= item.week[6].getTime(),
            );
            return (
              <div
                key={`week-${item.weekIndex}`}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <CalendarMobileWeekHeader
                  week={item.week}
                  events={weekEvents}
                />
              </div>
            );
          }

          const dayEvents = events.filter(
            (event) =>
              event.startDate.toDateString() === item.day.toDateString() &&
              !(
                (event.type === EVENT_TYPE.COMPETITION ||
                  event.type === EVENT_TYPE.TRAINING) &&
                event.relatedActivity
              ),
          );
          const cycleSegments = calculateCyclesForDay(cycles, item.day);

          return (
            <div
              key={`day-${item.dayIndex}`}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <CalendarMobileDay
                day={item.day}
                events={dayEvents}
                cycleSegments={cycleSegments}
                isToday={isToday}
                isSelected={
                  item.day.toDateString() === selectedDay.toDateString()
                }
                onPlan={allowCreate ? onPlanDay : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
