import { LoadingScreen } from '@/components/loading-screen';
import { TrainingZoneEditor } from '@/components/training-zone-editor';
import { useGetMyAthleteQuery } from '@/api/athlete';

export function TrainingZonesTab() {
  const { data: athlete, isLoading: athleteLoading } = useGetMyAthleteQuery();
  const athleteId = athlete?.athleteId;

  if (athleteLoading || !athlete || !athleteId) return <LoadingScreen />;

  return <TrainingZoneEditor athleteId={athleteId} />;
}
