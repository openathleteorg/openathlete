import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetMyEventsQuery } from '@/api/event';
import { Calendar } from '@/components/calendar/calendar';
import { useSpaceContext } from '@/contexts/space';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function CalendarView() {
  const nav = useNavigate();
  const { data: athlete } = useGetMyAthleteQuery();
  const { space } = useSpaceContext();
  const [displayedMonth, setDisplayedMonth] = useState(new Date());

  const { startDate, endDate } = useMemo(() => {
    const start = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() - 1,
      1,
    );
    const end = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + 2,
      0,
    );
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }, [displayedMonth]);

  const { data, refetch, isPending } = useGetMyEventsQuery(
    undefined,
    undefined,
    startDate,
    endDate,
  );

  useEffect(() => {
    if (space === 'COACH') {
      nav('/dashboard/coach');
    }
    refetch();
  }, [space, startDate, endDate, refetch, nav]);

  const handleMonthChange = useCallback((month: Date) => {
    setDisplayedMonth(month);
  }, []);

  return (
    <div className="p-8">
      <Calendar
        events={data}
        athleteId={space === 'ATHLETE' ? athlete?.athleteId : undefined}
        allowCreate={space === 'ATHLETE'}
        onMonthChange={handleMonthChange}
        isLoading={isPending}
      />
    </div>
  );
}
