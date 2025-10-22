import { m } from '@/paraglide/messages';
import { MetricsView } from '@/views/dashboard';

export function AthleteMetricsPage() {
  // TODO: Get athleteId from params and pass to MetricsView when the service supports it
  // const { athleteId } = useParams<{ athleteId: string }>();

  return (
    <>
      <title>{m.metrics()}</title>
      <MetricsView />
    </>
  );
}
