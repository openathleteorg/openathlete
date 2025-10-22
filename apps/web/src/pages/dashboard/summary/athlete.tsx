import { m } from '@/paraglide/messages';
import { SummaryView } from '@/views/dashboard';
import { useParams } from 'react-router-dom';

export function SummaryPage() {
  const { athleteId } = useParams<{ athleteId: string }>();

  return (
    <>
      <title>{m.summary()}</title>
      <SummaryView athleteId={athleteId} />
    </>
  );
}
