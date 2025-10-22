import { m } from '@/paraglide/messages';
import { RecordsView } from '@/views/dashboard/records-view';
import { useParams } from 'react-router-dom';

export function AthleteRecordsPage() {
  const { athleteId } = useParams<{ athleteId: string }>();

  return (
    <>
      <title>{m.records()}</title>
      <RecordsView
        athleteId={athleteId ? parseInt(athleteId, 10) : undefined}
      />
    </>
  );
}
