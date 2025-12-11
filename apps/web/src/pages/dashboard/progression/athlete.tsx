import { ProgressionView } from '@/views/dashboard/progression-view';
import { useParams } from 'react-router-dom';

export function AthleteProgressionPage() {
  const { athleteId } = useParams<{ athleteId: string }>();

  if (!athleteId) {
    return null;
  }

  return <ProgressionView athleteId={parseInt(athleteId, 10)} />;
}
