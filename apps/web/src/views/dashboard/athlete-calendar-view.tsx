import { Calendar } from '@/components/calendar/calendar';
import { useGetMyEventsQuery } from '@/api/event';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

interface P {
  athleteId: number;
}

export function AthleteCalendarView({ athleteId }: P) {
  const { data, refetch, isError } = useGetMyEventsQuery(true, athleteId, {
    retry: false,
  });

  useEffect(() => {
    refetch();
  }, [athleteId, refetch]);

  if (isError) {
    return <Navigate to="/404" />;
  }
  return (
    <div className="p-8">
      <Calendar events={data} athleteId={athleteId} />
    </div>
  );
}
