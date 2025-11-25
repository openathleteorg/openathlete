import { useGetMyAthleteQuery } from '@/api/athlete';
import { LoadingScreen } from '@/components/loading-screen';
import { TrainingZoneEditor } from '@/components/training-zone-editor';
import { m } from '@/paraglide/messages';

import { SettingsSection } from './settings-section';

export function TrainingZonesTab() {
  const { data: athlete, isLoading: athleteLoading } = useGetMyAthleteQuery();
  const athleteId = athlete?.athleteId;

  if (athleteLoading || !athlete || !athleteId) return <LoadingScreen />;

  return (
    <SettingsSection
      title={m.training_zones()}
      description={m.training_zones_tab_description()}
    >
      <TrainingZoneEditor athleteId={athleteId} showHeading={false} />
    </SettingsSection>
  );
}
