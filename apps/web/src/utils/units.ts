import { m } from '@/paraglide/messages';

import {
  KG_TO_LB,
  KM_TO_MI,
  SpeedUnit,
  UnitSystem,
  formatDistance,
  localDistanceUnit,
  localSpeedUnit,
  toUnitElevation,
  toUnitTemperature,
  toUnitWeight,
} from '@openathlete/shared';

const METERS_PER_MILE = 1609.34;
const KM_PER_MILE = 1 / KM_TO_MI;

/**
 * Everything a screen needs to show values in the user's units. Values stay
 * metric in the API and in the database: only what is read or typed changes.
 */
export function unitsFor(unitSystem: UnitSystem) {
  const imperial = unitSystem === 'IMPERIAL';
  const distanceUnit = localDistanceUnit(unitSystem);
  return {
    unitSystem,
    distanceUnit,
    distanceLabel: imperial ? m.miles() : m.kilometers(),
    elevationLabel: imperial ? m.feet() : m.meters(),
    weightLabel: imperial ? m.pounds() : 'kg',
    /** Shown value per stored kilogram, for fields */
    weightFactor: imperial ? KG_TO_LB : 1,
    /** "/ mi" or "/ km" */
    perDistanceLabel: imperial ? m.per_mi() : m.per_km(),
    speedLabel: imperial ? m.miles_per_hour() : m.kilometers_per_hour(),
    verticalSpeedLabel: imperial
      ? m.statistics_feet_per_hour()
      : m.statistics_metres_per_hour(),
    /** How much longer a pace reads per this system's distance than per km */
    paceFactor: imperial ? KM_PER_MILE : 1,
    /** Metres in this system's long distance unit, as a number */
    distanceValue: (meters: number) =>
      meters / (imperial ? METERS_PER_MILE : 1000),
    /** "5.00": metres in this system's long distance unit */
    formatDist: (meters: number) => formatDistance(meters, distanceUnit),
    /** Pool distances read in yards; other sports as any distance */
    formatSportDist: (meters: number, sportSpeedUnit: SpeedUnit) =>
      imperial && sportSpeedUnit === 'min/100m'
        ? `${formatDistance(meters, 'yd')} ${m.yards()}`
        : `${formatDistance(meters, distanceUnit)} ${imperial ? m.miles() : m.kilometers()}`,
    /** "21.5 °C" or "70.7 °F" */
    formatTemp: (celsius: number) => {
      const { value, unit } = toUnitTemperature(celsius, unitSystem);
      return `${value.toFixed(1)} ${unit}`;
    },
    /** Whole feet or metres */
    elevation: (meters: number) => toUnitElevation(meters, unitSystem).value,
    weight: (kg: number) => toUnitWeight(kg, unitSystem).value,
    /** The sport's speed unit, in this system */
    speedUnit: (unit: SpeedUnit) => localSpeedUnit(unit, unitSystem),
    /** "12 km/h" or "7.5 mph", from a value in km/h */
    formatKmh: (kmh: number) =>
      imperial
        ? `${(kmh * KM_TO_MI).toFixed(1)} ${m.miles_per_hour()}`
        : `${kmh} ${m.kilometers_per_hour()}`,
  };
}

export type Units = ReturnType<typeof unitsFor>;
