import {
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  TrainingZone,
  TrainingZoneValue,
} from '@openathlete/shared';

export type AthleteZone = TrainingZone & { values: TrainingZoneValue[] };

export type ZoneOption = {
  id: number;
  name: string;
  description: string;
  color: string;
  min: number;
  max: number;
};

/**
 * The zones of a type with bounds for the sport, in order, as options. Only
 * real zones: their ids are what a workout target stores.
 */
export function zoneOptions(
  zones: AthleteZone[] | undefined,
  type: TRAINING_ZONE_TYPE,
  sport?: SPORT_TYPE,
): ZoneOption[] {
  return (zones ?? [])
    .filter((zone) => zone.type === type)
    .sort((a, b) => a.index - b.index)
    .flatMap((zone) => {
      const values = zone.values.filter(
        (value) => !sport || value.sports.includes(sport),
      );
      if (values.length === 0) return [];
      return [
        {
          id: zone.trainingZoneId,
          name: zone.name,
          description: zone.description,
          color: zone.color,
          min: values[0].min,
          max: values[0].max,
        },
      ];
    });
}
