import { useInstanceInfoQuery } from '@/api/instance';
import { GarminPersonalSection } from '@/views/dashboard/settings-view/garmin-personal-section';

export function GarminPersonalSync() {
  const { data: instance } = useInstanceInfoQuery();
  return instance?.garminPersonalApi ? (
    <GarminPersonalSection mode="sync" />
  ) : null;
}
