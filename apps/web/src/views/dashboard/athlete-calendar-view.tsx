import { useGetMyEventsQuery } from '@/api/event';
import { Calendar } from '@/components/calendar/calendar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface P {
  athleteId: number;
}

export function AthleteCalendarView({ athleteId }: P) {
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

  const { data, refetch, isError, isFetching } = useGetMyEventsQuery(
    true,
    athleteId,
    startDate,
    endDate,
    {
      retry: false,
    },
  );

  useEffect(() => {
    refetch();
  }, [athleteId, startDate, endDate, refetch]);

  const handleMonthChange = useCallback((month: Date) => {
    setDisplayedMonth(month);
  }, []);

  if (isError) {
    return <Navigate to="/404" />;
  }
  return (
    <div className="p-8">
      <Calendar
        events={data}
        athleteId={athleteId}
        onMonthChange={handleMonthChange}
        isLoading={isFetching}
      />
    </div>
  );
}
