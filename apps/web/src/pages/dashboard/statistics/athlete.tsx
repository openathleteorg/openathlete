import { LoadingScreen } from '@/components/loading-screen';
import { m } from '@/paraglide/messages';
import { StatisticsView } from '@/views/dashboard/statistics-view';
import { useParams } from 'react-router-dom';

export function AthleteStatisticsPage() {
  const { athleteId } = useParams<{ athleteId: string }>();

  if (!athleteId) {
    return <LoadingScreen />;
  }

  return (
    <>
      <title>{m.statistics()}</title>
      <StatisticsView athleteId={parseInt(athleteId, 10)} />
    </>
  );
}
