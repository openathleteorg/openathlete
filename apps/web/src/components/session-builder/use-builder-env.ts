import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
import { useAthleteTrainingZones } from '@/hooks/use-training-zones';
import { getLocale } from '@/paraglide/runtime';
import { useMemo } from 'react';

import type {
  SPORT_TYPE,
  WorkoutTextLocale,
  WorkoutTextZone,
} from '@openathlete/shared';
import { TRAINING_ZONE_TYPE, defaultZoneType } from '@openathlete/shared';

import {
  type ZonesByType,
  buildZonesByType,
  metricValues,
} from '../workout/workout-profile';

/**
 * What the builder reads targets against: the session athlete's zones for
 * the sport, their metrics, and the language step words are written in.
 */
export interface BuilderEnv {
  sport: SPORT_TYPE;
  athleteId: number | null;
  /** Zones as the workout text names them: "Z3" is index 2 of its type */
  zones: WorkoutTextZone[];
  zonesByType: ZonesByType;
  /** The type a bare "Z3" means for this sport and athlete */
  zoneType: TRAINING_ZONE_TYPE;
  metrics: Record<string, { value: number }> | undefined;
  locale: WorkoutTextLocale;
}

export function useBuilderEnv(
  sport: SPORT_TYPE,
  athleteId: number | null,
): BuilderEnv {
  const { data: me } = useGetMyAthleteQuery();
  const { zones: athleteZones } = useAthleteTrainingZones(athleteId);
  const { data: latestMetrics } = useGetLatestMetricsQuery(
    athleteId ?? me?.athleteId,
  );

  return useMemo(() => {
    const zonesByType = buildZonesByType(athleteZones ?? [], sport);
    const zones: WorkoutTextZone[] = (
      Object.values(TRAINING_ZONE_TYPE) as TRAINING_ZONE_TYPE[]
    ).flatMap((type) =>
      zonesByType[type].map((zone) => ({
        trainingZoneId: zone.id,
        type,
        index: zone.index,
      })),
    );
    return {
      sport,
      athleteId,
      zones,
      zonesByType,
      zoneType: defaultZoneType(sport, zones),
      metrics: metricValues(latestMetrics),
      locale: getLocale() as WorkoutTextLocale,
    };
  }, [athleteZones, sport, athleteId, latestMetrics]);
}
