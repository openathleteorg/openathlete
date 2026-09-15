import { m } from '@/paraglide/messages';
import { AthleteCalendarView } from '@/views/dashboard/athlete-calendar-view';
import { useParams } from 'react-router-dom';

export function AthleteCalendarPage() {
  const { athleteId } = useParams();

  return (
    <>
      <title>{m.ui_athlete_calendar()} </title>
      <AthleteCalendarView athleteId={Number(athleteId)} />
    </>
  );
}
