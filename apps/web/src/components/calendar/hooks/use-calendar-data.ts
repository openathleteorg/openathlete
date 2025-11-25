import { useCallback, useMemo, useState } from 'react';

import { Event } from '@openathlete/shared';

interface CalendarData {
  defaultMonth?: Date;
  events?: Event[];
}

export function useCalendarData({ defaultMonth, events }: CalendarData) {
  const [displayedMonth, setDisplayedMonth] = useState(
    defaultMonth || new Date(),
  );

  const nextMonth = useCallback(() => {
    const nextMonth = new Date(
      displayedMonth.setMonth(displayedMonth.getMonth() + 1),
    );
    setDisplayedMonth(nextMonth);
  }, [displayedMonth]);

  const prevMonth = useCallback(() => {
    const prevMonth = new Date(
      displayedMonth.setMonth(displayedMonth.getMonth() - 1),
    );
    setDisplayedMonth(prevMonth);
  }, [displayedMonth]);

  const goToCurrentMonth = useCallback(() => {
    setDisplayedMonth(new Date());
  }, []);

  const displayedWeeks = useMemo(() => {
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
    return weeks;
  }, [displayedMonth]);

  return {
    displayedMonth,
    nextMonth,
    prevMonth,
    goToCurrentMonth,
    displayedWeeks,
    events: events || [],
  };
}
