import { m } from '@/paraglide/messages';
import { MetricsView } from '@/views/dashboard';

export function MetricsPage() {
  return (
    <>
      <title>{m.metrics()}</title>
      <MetricsView />
    </>
  );
}
