import { useIsMobile } from '@/hooks/use-mobile';
import { addWeeks, startOfWeek } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';

import { Event } from '@openathlete/shared';

export type CalendarView = 'month' | 'week' | 'season';

interface CalendarData {
  defaultMonth?: Date;
  events?: Event[];
  view?: CalendarView;
}

/** Local Monday 00:00 of the week containing date. */
export const localWeekStart = (date: Date) =>
  startOfWeek(date, { weekStartsOn: 1 });

export function useCalendarData({
  defaultMonth,
  events,
  view = 'month',
}: CalendarData) {
  const isMobile = useIsMobile();
  const [displayedMonth, setDisplayedMonth] = useState(
    view === 'week'
      ? localWeekStart(defaultMonth || new Date())
      : defaultMonth || new Date(),
  );
  const [weekStart, setWeekStart] = useState(() =>
    localWeekStart(defaultMonth || new Date()),
  );

  // In week view the displayed month follows the week, so pages that load
  // events per month (onMonthChange) still cover it.
  const goToWeek = useCallback((date: Date) => {
    const start = localWeekStart(date);
    setWeekStart(start);
    setDisplayedMonth(new Date(start));
  }, []);
  const nextWeek = useCallback(
    () => goToWeek(addWeeks(weekStart, 1)),
    [goToWeek, weekStart],
  );
  const prevWeek = useCallback(
    () => goToWeek(addWeeks(weekStart, -1)),
    [goToWeek, weekStart],
  );
  const goToCurrentWeek = useCallback(() => goToWeek(new Date()), [goToWeek]);

  const nextMonth = useCallback(() => {
    const nextMonth = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + 1,
      1,
    );
    setDisplayedMonth(nextMonth);
  }, [displayedMonth]);

  const prevMonth = useCallback(() => {
    const prevMonth = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() - 1,
      1,
    );
    setDisplayedMonth(prevMonth);
  }, [displayedMonth]);

  const goToCurrentMonth = useCallback(() => {
    setDisplayedMonth(new Date());
  }, []);

  const displayedWeeks = useMemo(() => {
    if (view === 'week') {
      return [
        Array.from({ length: 7 }, (_, i) => {
          const day = new Date(weekStart);
          day.setDate(day.getDate() + i);
          return day;
        }),
      ];
    }
    const weeks: Date[][] = [];
    const firstDay = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth(),
      1,
    );
    const lastDay = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + 1,
      0,
    );
    const daysInMonth = lastDay.getDate();
    const firstDayWeek = (firstDay.getDay() + 6) % 7; // Adjust to make Monday the first day
    const lastDayPrevMonth = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth(),
      0,
    );
    const daysInPrevMonth = lastDayPrevMonth.getDate();
    const weeksInMonth = Math.ceil((daysInMonth + firstDayWeek) / 7);
    let day = 1;
    let dayPrevMonth = daysInPrevMonth - firstDayWeek + 1;
    let dayNextMonth = 1;

    // Generate weeks for the displayed month
    for (let i = 0; i < weeksInMonth; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDayWeek) {
          week.push(
            new Date(
              displayedMonth.getFullYear(),
              displayedMonth.getMonth() - 1,
              dayPrevMonth,
            ),
          );
          dayPrevMonth++;
        } else if (day > daysInMonth) {
          week.push(
            new Date(
              displayedMonth.getFullYear(),
              displayedMonth.getMonth() + 1,
              dayNextMonth,
            ),
          );
          dayNextMonth++;
        } else {
          week.push(
            new Date(
              displayedMonth.getFullYear(),
              displayedMonth.getMonth(),
              day,
            ),
          );
          day++;
        }
      }
      weeks.push(week);
    }

    if (isMobile) {
      const today = new Date();
      const maxFutureDate = new Date(
        today.getFullYear(),
        today.getMonth() + 12,
        0,
      );
      const minPastDate = new Date(
        today.getFullYear(),
        today.getMonth() - 6,
        1,
      );

      // Add weeks in the past
      const firstWeek = weeks[0];
      if (firstWeek && firstWeek.length > 0) {
        const firstDate = new Date(firstWeek[0]);
        firstDate.setDate(firstDate.getDate() - 1);

        while (firstDate >= minPastDate) {
          const week: Date[] = [];
          for (let j = 6; j >= 0; j--) {
            if (firstDate >= minPastDate) {
              week.unshift(new Date(firstDate));
              firstDate.setDate(firstDate.getDate() - 1);
            } else {
              week.unshift(new Date(minPastDate));
            }
          }
          weeks.unshift(week);
        }
      }

      // Add weeks in the future
      const lastWeek = weeks[weeks.length - 1];
      if (lastWeek && lastWeek.length > 0) {
        const currentDate = new Date(lastWeek[lastWeek.length - 1]);
        currentDate.setDate(currentDate.getDate() + 1);

        while (currentDate <= maxFutureDate) {
          const week: Date[] = [];
          for (let j = 0; j < 7; j++) {
            if (currentDate <= maxFutureDate) {
              week.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
            } else {
              week.push(new Date(maxFutureDate));
            }
          }
          weeks.push(week);
        }
      }
    }

    return weeks;
  }, [displayedMonth, isMobile, view, weekStart]);

  return {
    displayedMonth,
    nextMonth,
    prevMonth,
    goToCurrentMonth,
    weekStart,
    goToWeek,
    nextWeek,
    prevWeek,
    goToCurrentWeek,
    displayedWeeks,
    events: events || [],
  };
}
