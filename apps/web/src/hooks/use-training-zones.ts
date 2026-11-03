import { useGetMyAthleteQuery } from '@/api/athlete';
import { TrainingZoneAPI } from '@/api/training-zone/training-zone.api';
import { trainingZoneKeys } from '@/api/training-zone/training-zone.keys';
import { m } from '@/paraglide/messages';
import {
  AthleteZone,
  ZoneOption,
  zoneOptions,
} from '@/utils/training-zone-options';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { SPORT_TYPE, TRAINING_ZONE_TYPE } from '@openathlete/shared';

const DEFAULT_TRAINING_ZONES = [
  {
    type: TRAINING_ZONE_TYPE.HEARTRATE,
    values: [
      {
        name: m.zone_1(),
        description: m.recovery(),
        min: 0,
        max: 131,
        color: 'grey',
      },
      {
        name: m.zone_2(),
        description: m.endurance(),
        min: 132,
        max: 142,
        color: 'green',
      },
      {
        name: m.zone_3(),
        description: m.tempo(),
        min: 143,
        max: 152,
        color: 'yellow',
      },
      {
        name: m.zone_4(),
        description: m.threshold(),
        min: 153,
        max: 163,
        color: 'orange',
      },
      {
        name: m.zone_5(),
        description: m.vo2_max(),
        min: 164,
        max: 220,
        color: 'red',
      },
    ],
  },
];

/**
 * Every training zone of an athlete: the athlete's whose data is shown when
 * `athleteId` is given (a coach reading or planning for an athlete), else the
 * signed-in athlete's. Zone ids are per athlete: resolve and pick zones of the
 * athlete a session belongs to, never the viewer's.
 */
export function useAthleteTrainingZones(athleteId?: number | null) {
  const { data: athlete, isLoading: isLoadingMine } = useGetMyAthleteQuery();
  const forOther =
    athleteId !== undefined &&
    athleteId !== null &&
    athlete?.athleteId !== athleteId;
  const { data: otherZones, isLoading: isLoadingOther } = useQuery({
    queryKey: [trainingZoneKeys.getAllForAthlete, athleteId],
    queryFn: (): Promise<AthleteZone[]> =>
      TrainingZoneAPI.getAllForAthlete(athleteId!),
    enabled: forOther,
  });
  return {
    zones: forOther ? otherZones : athlete?.trainingZones,
    isLoading: forOther ? isLoadingOther : isLoadingMine,
  };
}

/**
 * The zones of a type and sport of an athlete (see `useAthleteTrainingZones`);
 * default heart rate zones when there are none, to read data against. Those
 * have negative ids: never store them as a workout target.
 */
export function useTrainingZones(
  type: TRAINING_ZONE_TYPE,
  sport?: SPORT_TYPE,
  athleteId?: number,
): ZoneOption[] {
  const { zones } = useAthleteTrainingZones(athleteId);

  // Stable between renders: callers memoise what they compute from it
  return useMemo(() => {
    const options = zoneOptions(zones, type, sport);
    if (options.length > 0) return options;
    const defaultZones = DEFAULT_TRAINING_ZONES.find(
      (zone) => zone.type === type,
    )?.values;
    // Negative ids: they belong to no athlete
    return (defaultZones ?? []).map((zone, index) => ({
      id: -(index + 1),
      ...zone,
    }));
  }, [zones, type, sport]);
}
