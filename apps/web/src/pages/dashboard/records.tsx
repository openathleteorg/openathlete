import { useGetMyAthleteQuery } from '@/api/athlete';
import { LoadingScreen } from '@/components/loading-screen';
import { m } from '@/paraglide/messages';
import { RecordsView } from '@/views/dashboard/records-view';

export function RecordsPage() {
  const { data: athlete } = useGetMyAthleteQuery();

  if (!athlete) {
    return <LoadingScreen />;
  }

  return (
    <>
      <title>{m.records()}</title>
      <RecordsView athleteId={athlete.athleteId} />
    </>
  );
}
