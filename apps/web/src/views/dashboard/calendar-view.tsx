import { Calendar } from '@/components/calendar/calendar';
import { useSpaceContext } from '@/contexts/space';
import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetMyEventsQuery } from '@/api/event';
import { useEffect } from 'react';

export function CalendarView() {
  const { data: athlete } = useGetMyAthleteQuery();
  const { space } = useSpaceContext();
  const { data, refetch } = useGetMyEventsQuery(
    space === 'COACH' ? true : undefined,
  );

  useEffect(() => {
    refetch();
  }, [space, refetch]);

  return (
    <div className="p-8">
      <Calendar
        events={data}
        athleteId={space === 'ATHLETE' ? athlete?.athleteId : undefined}
        allowCreate={space === 'ATHLETE'}
      />
    </div>
  );
}
