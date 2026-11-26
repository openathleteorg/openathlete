import type { CreateWorkoutStepTarget, UnitSystem } from '@openathlete/shared';
import {
  KG_TO_LB,
  KM_TO_MI,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  WORKOUT_TARGET_TYPE,
  formatSpeed,
  getSportConfig,
  getTargetIntensity,
  localSpeedUnit,
} from '@openathlete/shared';

import type { ZoneInfo, ZonesByType } from '../workout/workout-profile';

/**
 * What a target means for the athlete: "Z3" with its bounds, "95% VMA"
 * with the pace it gives. The builder shows both, as coaches think in
 * zones and athletes run paces.
 */
export interface TargetLabel {
  /** As prescribed: "Z3", "95% VMA", "4:30/km" */
  primary: string;
  /** What it gives this athlete, when that says something more */
  secondary: string | null;
  kind: 'hr' | 'pace' | 'power' | 'cadence' | 'rpe' | 'weight' | 'other';
  color: string | null;
  zoneIndex: number | null;
}

const PERCENT_LABEL: Record<string, string> = {
  HR_MAX: 'FCmax',
  VMA: 'VMA',
  FTP_CYCLING: 'FTP',
  FTP_RUNNING: 'FTP',
  CRITICAL_POWER_CYCLING: 'CP',
  CRITICAL_POWER_RUNNING: 'CP',
};

/** "4:30/km" in running, "1:45/100m" in the pool, "32 km/h" on the bike */
export function formatSportSpeed(
  speed: number,
  sport: SPORT_TYPE,
  unitSystem: UnitSystem = 'METRIC',
): string {
  const unit = localSpeedUnit(
    getSportConfig(sport)?.speedUnit ?? 'km/h',
    unitSystem,
  );
  if (unit === 'km/h') return `${(speed * 3.6).toFixed(1)} km/h`;
  if (unit === 'mph') return `${(speed * 2.23694).toFixed(1)} mph`;
  const per =
    unit === 'min/100m'
      ? '/100m'
      : unit === 'min/500m'
        ? '/500m'
        : unit === 'min/mi'
          ? '/mi'
          : '/km';
  return `${formatSpeed(speed, unit)}${per}`;
}

function paceMinutes(minutes: number): string {
  const total = Math.round(minutes * 60);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function zoneBounds(
  zone: ZoneInfo,
  type: TRAINING_ZONE_TYPE,
  unitSystem: UnitSystem = 'METRIC',
): string {
  const top = zone.max >= 250 && type === TRAINING_ZONE_TYPE.HEARTRATE;
  switch (type) {
    case TRAINING_ZONE_TYPE.HEARTRATE:
      return top
        ? `> ${Math.round(zone.min)} bpm`
        : `${Math.round(zone.min)}–${Math.round(zone.max)} bpm`;
    case TRAINING_ZONE_TYPE.POWER:
      return `${Math.round(zone.min)}–${Math.round(zone.max)} W`;
    case TRAINING_ZONE_TYPE.PACE: {
      // Stored in decimal minutes per km; the faster bound first
      const factor = unitSystem === 'IMPERIAL' ? 1 / KM_TO_MI : 1;
      const suffix = unitSystem === 'IMPERIAL' ? '/mi' : '/km';
      return `${paceMinutes(Math.min(zone.min, zone.max) * factor)}–${paceMinutes(Math.max(zone.min, zone.max) * factor)}${suffix}`;
    }
  }
}

const KIND_OF_ZONE: Record<TRAINING_ZONE_TYPE, TargetLabel['kind']> = {
  [TRAINING_ZONE_TYPE.HEARTRATE]: 'hr',
  [TRAINING_ZONE_TYPE.POWER]: 'power',
  [TRAINING_ZONE_TYPE.PACE]: 'pace',
};

const KIND_OF_TARGET: Partial<
  Record<WORKOUT_TARGET_TYPE, TargetLabel['kind']>
> = {
  [WORKOUT_TARGET_TYPE.HEARTRATE]: 'hr',
  [WORKOUT_TARGET_TYPE.PACE]: 'pace',
  [WORKOUT_TARGET_TYPE.POWER]: 'power',
  [WORKOUT_TARGET_TYPE.CADENCE]: 'cadence',
  [WORKOUT_TARGET_TYPE.RPE]: 'rpe',
  [WORKOUT_TARGET_TYPE.WEIGHT]: 'weight',
};

export function findZone(
  zonesByType: ZonesByType,
  id: number | null | undefined,
): { zone: ZoneInfo; type: TRAINING_ZONE_TYPE } | null {
  if (id === null || id === undefined) return null;
  for (const type of Object.values(
    TRAINING_ZONE_TYPE,
  ) as TRAINING_ZONE_TYPE[]) {
    const zone = zonesByType[type]?.find((z) => z.id === id);
    if (zone) return { zone, type };
  }
  return null;
}

function bounds(target: CreateWorkoutStepTarget): [number, number] | null {
  if (target.targetValue !== null && target.targetValue !== undefined) {
    return [target.targetValue, target.targetValue];
  }
  if (
    target.targetMin !== null &&
    target.targetMin !== undefined &&
    target.targetMax !== null &&
    target.targetMax !== undefined
  ) {
    return [target.targetMin, target.targetMax];
  }
  return null;
}

function range(
  [low, high]: [number, number],
  format: (value: number) => string,
  unit: string,
): string {
  return low === high
    ? `${format(low)}${unit}`
    : `${format(low)}–${format(high)}${unit}`;
}

function speedRange(
  [low, high]: [number, number],
  sport: SPORT_TYPE,
  unitSystem: UnitSystem = 'METRIC',
): string {
  if (low === high) return formatSportSpeed(low, sport, unitSystem);
  const unit = localSpeedUnit(
    getSportConfig(sport)?.speedUnit ?? 'km/h',
    unitSystem,
  );
  if (unit === 'km/h')
    return `${(low * 3.6).toFixed(1)}–${(high * 3.6).toFixed(1)} km/h`;
  if (unit === 'mph')
    return `${(low * 2.23694).toFixed(1)}–${(high * 2.23694).toFixed(1)} mph`;
  // Faster first: 3:50–4:00/km
  const faster = formatSportSpeed(Math.max(low, high), sport, unitSystem);
  const slower = formatSportSpeed(Math.min(low, high), sport, unitSystem);
  return `${faster.replace(/\/.*$/, '')}–${slower}`;
}

export function describeTarget(
  target: CreateWorkoutStepTarget,
  sport: SPORT_TYPE,
  zonesByType: ZonesByType,
  metrics?: Record<string, { value: number }>,
  unitSystem: UnitSystem = 'METRIC',
): TargetLabel | null {
  const values = bounds(target);
  if (target.targetType === WORKOUT_TARGET_TYPE.ZONE) {
    const found = findZone(zonesByType, target.targetValue);
    if (!found) return null;
    const suffix = found.type === TRAINING_ZONE_TYPE.HEARTRATE ? ' FC' : '';
    return {
      primary: `Z${found.zone.index + 1}${suffix}`,
      secondary: zoneBounds(found.zone, found.type, unitSystem),
      kind: KIND_OF_ZONE[found.type],
      color: found.zone.color,
      zoneIndex: found.zone.index,
    };
  }
  if (!values) return null;
  const kind = KIND_OF_TARGET[target.targetType] ?? 'other';

  if (target.metricType) {
    const percent = range(values, (v) => String(Math.round(v * 100)), '%');
    const absolute = getTargetIntensity(target, metrics);
    const abs: [number, number] | null =
      absolute.value !== null
        ? [absolute.value, absolute.value]
        : absolute.min !== null && absolute.max !== null
          ? [absolute.min, absolute.max]
          : null;
    let secondary: string | null = null;
    if (abs) {
      if (target.targetType === WORKOUT_TARGET_TYPE.PACE) {
        secondary = speedRange(abs, sport, unitSystem);
      } else if (target.targetType === WORKOUT_TARGET_TYPE.HEARTRATE) {
        secondary = range(abs, (v) => String(Math.round(v)), ' bpm');
      } else if (target.targetType === WORKOUT_TARGET_TYPE.POWER) {
        secondary = range(abs, (v) => String(Math.round(v)), ' W');
      }
    }
    return {
      primary: `${percent} ${PERCENT_LABEL[target.metricType] ?? target.metricType}`,
      secondary,
      kind,
      color: null,
      zoneIndex: null,
    };
  }

  const primary = (() => {
    switch (target.targetType) {
      case WORKOUT_TARGET_TYPE.PACE:
        return speedRange(values, sport, unitSystem);
      case WORKOUT_TARGET_TYPE.HEARTRATE:
        return range(values, (v) => String(Math.round(v)), ' bpm');
      case WORKOUT_TARGET_TYPE.POWER:
        return range(values, (v) => String(Math.round(v)), ' W');
      case WORKOUT_TARGET_TYPE.CADENCE:
        return range(
          values,
          (v) => String(Math.round(v)),
          sport === SPORT_TYPE.CYCLING ? ' rpm' : ' spm',
        );
      case WORKOUT_TARGET_TYPE.RPE:
        return `RPE ${range(values, (v) => String(v), '')}`;
      case WORKOUT_TARGET_TYPE.WEIGHT:
        return unitSystem === 'IMPERIAL'
          ? range(values, (v) => (v * KG_TO_LB).toFixed(1), ' lb')
          : range(values, (v) => String(v), ' kg');
      default:
        return null;
    }
  })();
  if (!primary) return null;
  return { primary, secondary: null, kind, color: null, zoneIndex: null };
}
