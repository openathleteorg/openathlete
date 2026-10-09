import type {
  TrainingZone,
  TrainingZoneValue,
  WorkoutStepDto,
  WorkoutStepTargetDto,
} from '@openathlete/shared';
import {
  METRIC_TYPE,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  WORKOUT_TARGET_TYPE,
  getTargetIntensity,
  kmhToSpeedMs,
} from '@openathlete/shared';

/**
 * How hard and how long each step of a structured workout is, from the
 * athlete's zones and metrics: what the workout graph and the calendar's
 * mini profiles draw.
 */

export interface StepSegment {
  step: WorkoutStepDto;
  duration: number; // in seconds
  startTime: number; // cumulative time in seconds
  color: string;
  intensity: number; // 0-5 (zone level)
  isWarmup: boolean;
  isCooldown: boolean;
}

export interface ZoneInfo {
  id: number;
  name: string;
  color: string;
  min: number;
  max: number;
  index: number;
}

// Default colors for step types when no zone is available
const STEP_TYPE_COLORS: Record<string, string> = {
  WARMUP: '#F97316', // orange-500
  COOLDOWN: '#8B5CF6', // violet-500
  INTERVAL_ACTIVE: '#EF4444', // red-500
  INTERVAL_REST: '#3B82F6', // blue-500
  STEADY: '#22C55E', // green-500
  FREE: '#9CA3AF', // gray-400
};

const DEFAULT_CYCLING_BASE_SPEED_KMH = 34; // ~34 km/h at baseline FTP
const MIN_HEART_RATE_INTENSITY_RATIO = 0.45;
const MAX_HEART_RATE_INTENSITY_RATIO = 1.15;

const DEFAULT_METRIC_VALUES: Partial<Record<METRIC_TYPE, number>> = {
  [METRIC_TYPE.VMA]: 15.0, // km/h - average VMA (~4:00 min/km pace)
  [METRIC_TYPE.FTP_RUNNING]: 275, // W - average running FTP
  [METRIC_TYPE.FTP_CYCLING]: 225, // W - average cycling FTP
  [METRIC_TYPE.HR_MAX]: 190, // bpm - average max HR
  [METRIC_TYPE.HR_RESERVE]: 130, // bpm - average HR reserve
  [METRIC_TYPE.HR_REST]: 60, // bpm - average rest HR
};

/**
 * Calculate intensity (0-5) and color based on target type
 */
function calculateIntensityFromTarget(
  target: WorkoutStepTargetDto,
  zonesByType: Record<TRAINING_ZONE_TYPE, ZoneInfo[]>,
  metrics: Record<string, { value: number }> | undefined,
  sport?: SPORT_TYPE,
): { intensity: number; color: string } | null {
  const intensityValues = getTargetIntensity(target, metrics);
  const { targetType } = target;
  const targetValue = intensityValues.value;
  const targetMin = intensityValues.min;
  const targetMax = intensityValues.max;

  if (targetType === 'ZONE' && targetValue) {
    for (const zoneType of [
      TRAINING_ZONE_TYPE.HEARTRATE,
      TRAINING_ZONE_TYPE.POWER,
      TRAINING_ZONE_TYPE.PACE,
    ]) {
      const zones = zonesByType[zoneType] || [];
      const zone = zones.find((z) => z.id === targetValue);
      if (zone) {
        return { intensity: zone.index, color: zone.color };
      }
    }
  }

  if (targetType === 'HEARTRATE') {
    const hrZones = zonesByType[TRAINING_ZONE_TYPE.HEARTRATE] || [];
    const hrValue =
      targetValue ||
      (targetMin && targetMax ? (targetMin + targetMax) / 2 : null);

    if (hrValue !== null && hrZones.length > 0) {
      for (const zone of hrZones) {
        if (hrValue >= zone.min && hrValue <= zone.max) {
          return { intensity: zone.index, color: zone.color };
        }
      }
    }
  }

  if (targetType === 'PACE') {
    const paceZones = zonesByType[TRAINING_ZONE_TYPE.PACE] || [];
    let paceValue: number | null = null;
    if (targetValue !== null && targetValue !== undefined) {
      paceValue = targetValue;
    } else if (
      targetMin !== null &&
      targetMin !== undefined &&
      targetMax !== null &&
      targetMax !== undefined
    ) {
      paceValue = (targetMin + targetMax) / 2;
    }

    if (paceValue !== null) {
      if (paceZones.length > 0) {
        for (const zone of paceZones) {
          const zoneMinMs = 1000 / (zone.max * 60); // zone.max is slower (higher min/km)
          const zoneMaxMs = 1000 / (zone.min * 60); // zone.min is faster (lower min/km)
          if (paceValue >= zoneMinMs && paceValue <= zoneMaxMs) {
            return { intensity: zone.index, color: zone.color };
          }
        }
      }

      // Fallback to VMA if available
      const vma = metrics?.[METRIC_TYPE.VMA]?.value;
      if (vma && vma > 0) {
        // convert vma (km/h) to m/s
        const convertedVma = kmhToSpeedMs(vma);
        // Estimate intensity based on % of VMA
        const vmaPercent = (paceValue / convertedVma) * 100;
        // Map %VMA to zone (approximate)
        if (vmaPercent >= 100) return { intensity: 5, color: '#EF4444' };
        if (vmaPercent >= 90) return { intensity: 4, color: '#F97316' };
        if (vmaPercent >= 80) return { intensity: 3, color: '#EAB308' };
        if (vmaPercent >= 70) return { intensity: 2, color: '#22C55E' };
        return { intensity: 1, color: '#9CA3AF' };
      }
    }
  }

  // POWER target: use power zones or FTP
  if (targetType === 'POWER') {
    const powerZones = zonesByType[TRAINING_ZONE_TYPE.POWER] || [];
    const powerValue =
      targetValue ||
      (targetMin && targetMax ? (targetMin + targetMax) / 2 : null);

    if (powerValue !== null) {
      // Try power zones first
      if (powerZones.length > 0) {
        for (const zone of powerZones) {
          if (powerValue >= zone.min && powerValue <= zone.max) {
            return { intensity: zone.index, color: zone.color };
          }
        }
      }

      // Fallback to FTP if available
      const ftpKey =
        sport === SPORT_TYPE.CYCLING
          ? METRIC_TYPE.FTP_CYCLING
          : METRIC_TYPE.FTP_RUNNING;
      const ftp = metrics?.[ftpKey]?.value;
      if (ftp && ftp > 0) {
        // Estimate intensity based on % of FTP
        const ftpPercent = (powerValue / ftp) * 100;
        // Map %FTP to zone (approximate)
        if (ftpPercent >= 120) return { intensity: 5, color: '#EF4444' };
        if (ftpPercent >= 105) return { intensity: 4, color: '#F97316' };
        if (ftpPercent >= 90) return { intensity: 3, color: '#EAB308' };
        if (ftpPercent >= 75) return { intensity: 2, color: '#22C55E' };
        return { intensity: 1, color: '#9CA3AF' };
      }
    }
  }

  // RPE target: convert RPE (1-10) to intensity (0-5)
  if (targetType === 'RPE') {
    const rpeValue =
      targetValue ||
      (targetMin && targetMax ? (targetMin + targetMax) / 2 : null);
    if (rpeValue !== null) {
      // Map RPE 1-10 to intensity 0-5
      const intensity = Math.min(
        5,
        Math.max(0, Math.round((rpeValue / 10) * 5)),
      );
      // Map intensity to color
      const colors = [
        '#9CA3AF',
        '#9CA3AF',
        '#22C55E',
        '#EAB308',
        '#F97316',
        '#EF4444',
      ];
      return { intensity, color: colors[intensity] || '#9CA3AF' };
    }
  }

  return null;
}

function getStepColor(
  step: WorkoutStepDto,
  zonesByType: Record<TRAINING_ZONE_TYPE, ZoneInfo[]>,
  metrics: Record<string, { value: number }> | undefined,
  sport?: SPORT_TYPE,
): { color: string; intensity: number } {
  if (step.targets && step.targets.length > 0) {
    for (const target of step.targets) {
      const intensityInfo = calculateIntensityFromTarget(
        target,
        zonesByType,
        metrics,
        sport,
      );
      if (intensityInfo) {
        return intensityInfo;
      }
    }
  }

  const defaultColor = STEP_TYPE_COLORS[step.stepType] || STEP_TYPE_COLORS.FREE;
  return { color: defaultColor, intensity: 0 };
}

function getPaceSpeedFromTargets(
  targets: WorkoutStepTargetDto[] | undefined,
  metrics: Record<string, { value: number }> | undefined,
): number | null {
  if (!targets || targets.length === 0) {
    return null;
  }

  for (const target of targets) {
    if (target.targetType !== WORKOUT_TARGET_TYPE.PACE) {
      continue;
    }

    const { value, min, max } = getTargetIntensity(target, metrics);
    const absoluteSpeed =
      value ??
      (min !== null && min !== undefined && max !== null && max !== undefined
        ? (min + max) / 2
        : null);

    if (absoluteSpeed && absoluteSpeed > 0) {
      return absoluteSpeed;
    }
  }

  return null;
}

function getMetricValueWithFallback(
  metricType: METRIC_TYPE,
  metrics?: Record<string, { value: number } | number>,
): number | null {
  if (!metricType) return null;

  const metric = metrics?.[metricType];
  if (metric !== undefined && metric !== null) {
    return typeof metric === 'number' ? metric : metric.value;
  }

  const fallbackValue = DEFAULT_METRIC_VALUES[metricType];
  return fallbackValue ?? null;
}

function resolveTargetNumericValue(
  target: WorkoutStepTargetDto,
): number | null {
  if (target.targetValue !== null && target.targetValue !== undefined) {
    return target.targetValue;
  }

  if (
    target.targetMin !== null &&
    target.targetMin !== undefined &&
    target.targetMax !== null &&
    target.targetMax !== undefined
  ) {
    return (target.targetMin + target.targetMax) / 2;
  }

  if (target.targetMin !== null && target.targetMin !== undefined) {
    return target.targetMin;
  }

  if (target.targetMax !== null && target.targetMax !== undefined) {
    return target.targetMax;
  }

  return null;
}

function getHeartRateIntensityRatio(
  targets: WorkoutStepTargetDto[] | undefined,
  metrics: Record<string, { value: number }> | undefined,
  zonesByType?: Record<TRAINING_ZONE_TYPE, ZoneInfo[]>,
): number | null {
  if (!targets || targets.length === 0) {
    return null;
  }

  const hrZones = zonesByType?.[TRAINING_ZONE_TYPE.HEARTRATE] || [];
  const hrMax = getMetricValueWithFallback(METRIC_TYPE.HR_MAX, metrics);

  for (const target of targets) {
    if (target.targetType !== WORKOUT_TARGET_TYPE.HEARTRATE) {
      if (
        target.targetType === WORKOUT_TARGET_TYPE.ZONE &&
        hrZones.length > 0 &&
        target.targetValue
      ) {
        const zone = hrZones.find((z) => z.id === target.targetValue);
        if (zone && hrMax && hrMax > 0) {
          const zoneMid = (zone.min + zone.max) / 2;
          return zoneMid / hrMax;
        }
      }
      continue;
    }

    const rawValue = resolveTargetNumericValue(target);
    if (rawValue === null) {
      continue;
    }

    if (target.metricType) {
      return rawValue;
    }

    if (hrMax && hrMax > 0) {
      return rawValue / hrMax;
    }
  }

  return null;
}

function getBaseSpeedFromPerformanceMetrics(
  metrics: Record<string, { value: number }> | undefined,
  sport?: SPORT_TYPE,
): number | null {
  if (sport === SPORT_TYPE.CYCLING) {
    const ftpCycling = getMetricValueWithFallback(
      METRIC_TYPE.FTP_CYCLING,
      metrics,
    );
    const ftpBaseline = DEFAULT_METRIC_VALUES[METRIC_TYPE.FTP_CYCLING];
    if (ftpCycling && ftpCycling > 0 && ftpBaseline && ftpBaseline > 0) {
      const speedAtFtp =
        DEFAULT_CYCLING_BASE_SPEED_KMH * (ftpCycling / ftpBaseline);
      return kmhToSpeedMs(speedAtFtp);
    }

    // Cycling fallback: assume endurance pace ~30 km/h
    return kmhToSpeedMs(DEFAULT_CYCLING_BASE_SPEED_KMH);
  }

  const vmaValue = getMetricValueWithFallback(METRIC_TYPE.VMA, metrics);
  if (vmaValue && vmaValue > 0) {
    return kmhToSpeedMs(vmaValue);
  }

  const ftpRunning = getMetricValueWithFallback(
    METRIC_TYPE.FTP_RUNNING,
    metrics,
  );
  const ftpBaseline = DEFAULT_METRIC_VALUES[METRIC_TYPE.FTP_RUNNING];
  const baselineVma = DEFAULT_METRIC_VALUES[METRIC_TYPE.VMA];
  if (
    ftpRunning &&
    ftpRunning > 0 &&
    ftpBaseline &&
    ftpBaseline > 0 &&
    baselineVma
  ) {
    const vmaEquivalent = baselineVma * (ftpRunning / ftpBaseline);
    return kmhToSpeedMs(vmaEquivalent);
  }

  return baselineVma ? kmhToSpeedMs(baselineVma) : null;
}

function getHeartRateBasedSpeedFromTargets(
  targets: WorkoutStepTargetDto[] | undefined,
  metrics: Record<string, { value: number }> | undefined,
  sport?: SPORT_TYPE,
  zonesByType?: Record<TRAINING_ZONE_TYPE, ZoneInfo[]>,
): number | null {
  const hrRatio = getHeartRateIntensityRatio(targets, metrics, zonesByType);
  if (hrRatio === null) {
    return null;
  }

  const baseSpeed = getBaseSpeedFromPerformanceMetrics(metrics, sport);
  if (!baseSpeed) {
    return null;
  }

  const boundedRatio = Math.min(
    MAX_HEART_RATE_INTENSITY_RATIO,
    Math.max(MIN_HEART_RATE_INTENSITY_RATIO, hrRatio),
  );

  return baseSpeed * boundedRatio;
}

function calculateStepDuration(
  step: WorkoutStepDto,
  metrics: Record<string, { value: number }> | undefined,
  sport?: SPORT_TYPE,
  zonesByType?: Record<TRAINING_ZONE_TYPE, ZoneInfo[]>,
): number {
  if (step.durationType === 'TIME' && step.durationValue) {
    return step.durationValue;
  }

  if (
    step.durationType === 'DISTANCE' &&
    step.durationValue &&
    step.durationValue > 0
  ) {
    const estimatedSpeed =
      getPaceSpeedFromTargets(step.targets, metrics) ||
      getHeartRateBasedSpeedFromTargets(
        step.targets,
        metrics,
        sport,
        zonesByType,
      );
    if (estimatedSpeed) {
      return step.durationValue / estimatedSpeed;
    }
  }

  // For other duration types, we'll use a default or calculate from repeat blocks
  if (step.repeatBlock) {
    const childDuration = step.repeatBlock.childSteps.reduce(
      (acc: number, child: WorkoutStepDto) =>
        acc + calculateStepDuration(child, metrics, sport, zonesByType),
      0,
    );
    return childDuration * step.repeatBlock.repetitions;
  }
  return 0;
}

export function flattenSteps(
  steps: WorkoutStepDto[],
  zonesByType: Record<TRAINING_ZONE_TYPE, ZoneInfo[]>,
  metrics: Record<string, { value: number }> | undefined,
  sport?: SPORT_TYPE,
): StepSegment[] {
  const segments: StepSegment[] = [];
  let currentTime = 0;

  const processStep = (step: WorkoutStepDto) => {
    if (step.stepType === 'REPEAT' && step.repeatBlock) {
      // Expand repeat blocks
      for (let rep = 0; rep < step.repeatBlock.repetitions; rep++) {
        for (const childStep of step.repeatBlock.childSteps) {
          const duration = calculateStepDuration(
            childStep,
            metrics,
            sport,
            zonesByType,
          );
          const { color, intensity } = getStepColor(
            childStep,
            zonesByType,
            metrics,
            sport,
          );
          segments.push({
            step: childStep,
            duration,
            startTime: currentTime,
            color,
            intensity,
            isWarmup: childStep.stepType === 'WARMUP',
            isCooldown: childStep.stepType === 'COOLDOWN',
          });
          currentTime += duration;
        }
      }
    } else {
      const duration = calculateStepDuration(step, metrics, sport, zonesByType);
      if (duration > 0) {
        const { color, intensity } = getStepColor(
          step,
          zonesByType,
          metrics,
          sport,
        );
        segments.push({
          step,
          duration,
          startTime: currentTime,
          color,
          intensity,
          isWarmup: step.stepType === 'WARMUP',
          isCooldown: step.stepType === 'COOLDOWN',
        });
        currentTime += duration;
      }
    }
  };

  for (const step of steps) {
    processStep(step);
  }

  return segments;
}

export type ZonesByType = Record<TRAINING_ZONE_TYPE, ZoneInfo[]>;

/** The athlete's zones of each type that apply to `sport`, in order */
export function buildZonesByType(
  zones: (TrainingZone & { values: TrainingZoneValue[] })[],
  sport?: SPORT_TYPE,
): ZonesByType {
  const result: ZonesByType = {
    [TRAINING_ZONE_TYPE.HEARTRATE]: [],
    [TRAINING_ZONE_TYPE.POWER]: [],
    [TRAINING_ZONE_TYPE.PACE]: [],
  };
  for (const zoneType of [
    TRAINING_ZONE_TYPE.HEARTRATE,
    TRAINING_ZONE_TYPE.POWER,
    TRAINING_ZONE_TYPE.PACE,
  ]) {
    result[zoneType] = zones
      .filter((zone) => zone.type === zoneType)
      .sort((a, b) => a.index - b.index)
      .map((zone) => {
        const values = zone.values.filter(
          (value) => !sport || value.sports.includes(sport),
        );
        if (values.length === 0) return null;
        return {
          id: zone.trainingZoneId,
          name: zone.name,
          color: zone.color,
          min: values[0].min,
          max: values[0].max,
          index: zone.index,
        };
      })
      .filter((zone): zone is ZoneInfo => zone !== null);
  }
  return result;
}

/** Latest metrics as { type: { value } }, the shape targets resolve against */
export function metricValues(
  latest: Record<string, unknown> | undefined,
): Record<string, { value: number }> | undefined {
  if (!latest) return undefined;
  const formatted: Record<string, { value: number }> = {};
  for (const [key, metric] of Object.entries(latest)) {
    if (metric && typeof metric === 'object' && 'value' in metric) {
      formatted[key] = { value: (metric as { value: number }).value };
    }
  }
  return formatted;
}
