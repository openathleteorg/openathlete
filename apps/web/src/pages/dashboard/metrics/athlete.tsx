import { m } from '@/paraglide/messages';
import { MetricsView } from '@/views/dashboard';
import { useParams } from 'react-router-dom';

export function AthleteMetricsPage() {
  const { athleteId } = useParams<{ athleteId: string }>();

  return (
    <>
      <title>{m.metrics()}</title>
      <MetricsView
        athleteId={athleteId ? parseInt(athleteId, 10) : undefined}
      />
    </>
  );
}
