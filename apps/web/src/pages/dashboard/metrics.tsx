import { LoadingScreen } from '@/components/loading-screen';
import { m } from '@/paraglide/messages';
import { useGetMyAthleteQuery } from '@/api/athlete';
import { MetricsView } from '@/views/dashboard';

export function MetricsPage() {
  const { data: athlete } = useGetMyAthleteQuery();

  if (!athlete) {
    return <LoadingScreen />;
  }

  return (
    <>
      <title>{m.metrics()}</title>
      <MetricsView athleteId={athlete.athleteId} />
    </>
  );
}
