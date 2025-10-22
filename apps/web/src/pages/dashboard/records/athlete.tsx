import { m } from '@/paraglide/messages';
import { RecordsView } from '@/views/dashboard/records-view';

export function AthleteRecordsPage() {
  // TODO: Get athleteId from params and pass to RecordsView when the service supports it
  // const { athleteId } = useParams<{ athleteId: string }>();

  return (
    <>
      <title>{m.records()}</title>
      <RecordsView />
    </>
  );
}
