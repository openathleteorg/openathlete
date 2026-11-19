import type { UnitSystem } from '../types/dtos/core/unit-system.dto';
import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';
import type { DistanceUnit, SpeedUnit } from '../types/misc/core/metrics';
import { metricUnitMap } from './metric-unit.map';

export const KM_TO_MI = 0.621371;
export const M_TO_FT = 3.28084;
export const KG_TO_LB = 2.20462;
export const CM_TO_IN = 0.393701;
export const M_TO_YD = 1.09361;

/** The unit long distances are shown in */
export function localDistanceUnit(unitSystem: UnitSystem): DistanceUnit {
  return unitSystem === 'IMPERIAL' ? 'mi' : 'km';
}

/**
 * The unit a sport's speed is shown in. Swim and rowing paces stay per 100 m
 * and 500 m, the distances those sports are trained over.
 */
export function localSpeedUnit(
  unit: SpeedUnit,
  unitSystem: UnitSystem,
): SpeedUnit {
  if (unitSystem !== 'IMPERIAL') return unit;
  if (unit === 'km/h') return 'mph';
  if (unit === 'min/km') return 'min/mi';
  return unit;
}

export function toUnitWeight(
  kg: number,
  unitSystem: UnitSystem,
): { value: number; unit: string } {
  return unitSystem === 'IMPERIAL'
    ? { value: Number((kg * KG_TO_LB).toFixed(1)), unit: 'lb' }
    : { value: Number(kg.toFixed(1)), unit: 'kg' };
}

export function toUnitElevation(
  meters: number,
  unitSystem: UnitSystem,
): { value: number; unit: string } {
  return unitSystem === 'IMPERIAL'
    ? { value: Math.round(meters * M_TO_FT), unit: 'ft' }
    : { value: Math.round(meters), unit: 'm' };
}

export function toUnitTemperature(
  celsius: number,
  unitSystem: UnitSystem,
): { value: number; unit: string } {
  return unitSystem === 'IMPERIAL'
    ? { value: celsius * 1.8 + 32, unit: '°F' }
    : { value: celsius, unit: '°C' };
}

// Matched on the whole unit: 'W/kg' and 'kg/m²' are ratios that stay as they are
const IMPERIAL_METRIC_UNITS: Record<string, { unit: string; factor: number }> =
  {
    kg: { unit: 'lb', factor: KG_TO_LB },
    cm: { unit: 'in', factor: CM_TO_IN },
    km: { unit: 'mi', factor: KM_TO_MI },
    'km/h': { unit: 'mph', factor: KM_TO_MI },
    // Only a deviation is stored in °C here: no offset, unlike a temperature
    '°C': { unit: '°F', factor: 1.8 },
  };

const imperialMetric = (type: METRIC_TYPE, unitSystem: UnitSystem) =>
  unitSystem === 'IMPERIAL'
    ? IMPERIAL_METRIC_UNITS[metricUnitMap[type]]
    : undefined;

/** The unit a body metric is shown in; the API always speaks its stored unit */
export function metricDisplayUnit(
  type: METRIC_TYPE,
  unitSystem: UnitSystem,
): string {
  return imperialMetric(type, unitSystem)?.unit ?? metricUnitMap[type];
}

export function metricToDisplay(
  type: METRIC_TYPE,
  value: number,
  unitSystem: UnitSystem,
): number {
  return value * (imperialMetric(type, unitSystem)?.factor ?? 1);
}

export function metricFromDisplay(
  type: METRIC_TYPE,
  value: number,
  unitSystem: UnitSystem,
): number {
  return value / (imperialMetric(type, unitSystem)?.factor ?? 1);
}

/**
 * The unit system a new account starts with, from the browser's language.
 * The profile setting changes it afterwards.
 */
export function getDefaultUnitSystem(browserLocale?: string): UnitSystem {
  return browserLocale?.toLowerCase() === 'en-us' ? 'IMPERIAL' : 'METRIC';
}
