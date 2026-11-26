import { useGetLatestMetricsQuery } from '@/api/metric';
import { useTrainingZones } from '@/hooks/use-training-zones';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { useMemo } from 'react';

import {
  ActivityEvent,
  ActivityStream,
  TRAINING_ZONE_TYPE,
  getSportConfig,
  paceDistanceMeters,
} from '@openathlete/shared';

import { LapOptions, StepCompliance, ZoneBounds } from './laps';
import { cadenceFactor } from './tracks';

export const stepComplianceDot: Record<StepCompliance, string> = {
  in: 'bg-green-500',
  near: 'bg-yellow-400',
  off: 'bg-orange-500',
};

export const stepComplianceLabel: Record<StepCompliance, () => string> = {
  in: m.activity_step_in,
  near: m.activity_step_near,
  off: m.activity_step_off,
};

/**
 * What the lap table needs to grade a plan: the athlete's thresholds (VMA,
 * FTP, heart rate max) and zones, the athlete being the activity's owner.
 */
export function useLapOptions(
  event: ActivityEvent,
  stream: ActivityStream | undefined,
): LapOptions {
  const units = useUnits();
  const athleteId = event.athleteId ?? undefined;
  const { data: latest } = useGetLatestMetricsQuery(athleteId);
  const heartrate = useTrainingZones(
    TRAINING_ZONE_TYPE.HEARTRATE,
    event.sport,
    athleteId,
  );
  const power = useTrainingZones(
    TRAINING_ZONE_TYPE.POWER,
    event.sport,
    athleteId,
  );
  const pace = useTrainingZones(
    TRAINING_ZONE_TYPE.PACE,
    event.sport,
    athleteId,
  );

  return useMemo(() => {
    const config = getSportConfig(event.sport);
    const metrics = Object.fromEntries(
      Object.entries(latest ?? {}).map(([type, metric]) => [
        type,
        metric.value,
      ]),
    );
    const zones: ZoneBounds[] = [
      ...heartrate.map((z) => ({ ...z, type: TRAINING_ZONE_TYPE.HEARTRATE })),
      ...power.map((z) => ({ ...z, type: TRAINING_ZONE_TYPE.POWER })),
      ...pace.map((z) => ({ ...z, type: TRAINING_ZONE_TYPE.PACE })),
    ].filter((zone) => zone.id > 0);
    return {
      stream,
      sport: event.sport,
      laps: (event.segments ?? []).filter(
        (segment) => segment.segmentType === 'LAP',
      ),
      workout: event.plannedSession?.workout,
      splitMeters: config.showSplits
        ? paceDistanceMeters(units.speedUnit(config.speedUnit))
        : undefined,
      metrics,
      zones,
      cadenceFactor: cadenceFactor(event.sport),
    };
  }, [event, stream, latest, heartrate, power, pace, units]);
}
