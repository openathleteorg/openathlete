import { useGetMyAthleteQuery } from '@/api/athlete';
import { LoadingScreen } from '@/components/loading-screen';
import { m } from '@/paraglide/messages';
import { ProgressionView } from '@/views/dashboard/progression-view';

export function ProgressionPage() {
  const { data: athlete } = useGetMyAthleteQuery();

  if (!athlete) {
    return <LoadingScreen />;
  }
  return (
    <>
      <title>{m.progression()}</title>
      <ProgressionView athleteId={athlete.athleteId} />
    </>
  );
}
