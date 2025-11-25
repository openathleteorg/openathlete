import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
import { useGetTrainingZones } from '@/api/training-zone/training-zone.hooks';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { m } from '@/paraglide/messages';
import { formatDuration, getStepTypeLabel } from '@/utils/workout';
import { useMemo } from 'react';

import { formatTarget, getTargetIntensity } from '@openathlete/shared';
import type {
  TrainingZone,
  TrainingZoneValue,
  WorkoutDto,
  WorkoutStepDto,
  WorkoutStepTarget,
} from '@openathlete/shared';
import {
  METRIC_TYPE,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  WORKOUT_TARGET_TYPE,
  kmhToSpeedMs,
} from '@openathlete/shared';

interface WorkoutGraphProps {
  workout: WorkoutDto;
  sport?: SPORT_TYPE;
  className?: string;
  maxHeight?: number;
  athleteId?: number;
}

interface StepSegment {
  step: WorkoutStepDto;
  duration: number; // in seconds
  startTime: number; // cumulative time in seconds
  color: string;
  intensity: number; // 0-5 (zone level)
  isWarmup: boolean;
  isCooldown: boolean;
}

interface ZoneInfo {
  id: number;
  name: string;
  color: string;
  min: number;
  max: number;
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

const MIN_BAR_HEIGHT = 8; // pixels

/**
 * Calculate intensity (0-5) and color based on target type
 */
function calculateIntensityFromTarget(
  target: WorkoutStepTarget,
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
        const match = zone.name.match(/\d+/);
        const zoneNum = match ? parseInt(match[0], 10) : 1;
        return { intensity: zoneNum, color: zone.color };
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
          const match = zone.name.match(/\d+/);
          const zoneNum = match ? parseInt(match[0], 10) : 1;
          return { intensity: zoneNum, color: zone.color };
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
            const match = zone.name.match(/\d+/);
            const zoneNum = match ? parseInt(match[0], 10) : 1;
            return { intensity: zoneNum, color: zone.color };
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
            const match = zone.name.match(/\d+/);
            const zoneNum = match ? parseInt(match[0], 10) : 1;
            return { intensity: zoneNum, color: zone.color };
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
  // Try to get intensity from targets
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

  // Fallback to step type color
  const defaultColor = STEP_TYPE_COLORS[step.stepType] || STEP_TYPE_COLORS.FREE;
  return { color: defaultColor, intensity: 0 };
}

function getPaceSpeedFromTargets(
  targets: WorkoutStepTarget[] | undefined,
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

function calculateStepDuration(
  step: WorkoutStepDto,
  metrics: Record<string, { value: number }> | undefined,
): number {
  if (step.durationType === 'TIME' && step.durationValue) {
    return step.durationValue;
  }

  if (
    step.durationType === 'DISTANCE' &&
    step.durationValue &&
    step.durationValue > 0
  ) {
    const estimatedSpeed = getPaceSpeedFromTargets(step.targets, metrics);
    if (estimatedSpeed) {
      return step.durationValue / estimatedSpeed;
    }
  }

  // For other duration types, we'll use a default or calculate from repeat blocks
  if (step.repeatBlock) {
    const childDuration = step.repeatBlock.childSteps.reduce(
      (acc: number, child: WorkoutStepDto) =>
        acc + calculateStepDuration(child, metrics),
      0,
    );
    return childDuration * step.repeatBlock.repetitions;
  }
  return 0;
}

function flattenSteps(
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
          const duration = calculateStepDuration(childStep, metrics);
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
      const duration = calculateStepDuration(step, metrics);
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

function WarmupCooldownShape({
  segment,
  maxHeight,
  className,
}: {
  segment: StepSegment;
  maxHeight: number;
  className?: string;
}) {
  // Calculate height based on intensity (zone level)
  // For warmup/cooldown, the triangle goes from 0 to this height
  const triangleHeight = Math.max(
    MIN_BAR_HEIGHT,
    (segment.intensity / 5) * maxHeight || MIN_BAR_HEIGHT,
  );
  const width = 100; // Base width for viewBox
  const isWarmup = segment.isWarmup;

  // SVG coordinates: (0,0) is top-left, y increases downward
  // For warmup: triangle going up from bottom (y=maxHeight) to top (y=maxHeight-triangleHeight)
  // Points: bottom-left (0, maxHeight), top-right (width, maxHeight - triangleHeight), bottom-right (width, maxHeight)
  // For cooldown: triangle going down from top (y=maxHeight-triangleHeight) to bottom (y=maxHeight)
  // Points: top-left (0, maxHeight - triangleHeight), bottom-right (width, maxHeight), bottom-left (0, maxHeight)
  const points = isWarmup
    ? `0,${maxHeight} ${width},${maxHeight - triangleHeight} ${width},${maxHeight}`
    : `0,${maxHeight - triangleHeight} ${width},${maxHeight} 0,${maxHeight}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${maxHeight}`}
      preserveAspectRatio="none"
      className={className}
      style={{ minWidth: '2px' }}
    >
      <polygon
        points={points}
        fill={segment.color}
        className="transition-opacity hover:opacity-80"
      />
    </svg>
  );
}

function StepBar({
  segment,
  maxHeight,
  metrics,
}: {
  segment: StepSegment;
  maxHeight: number;
  metrics?: Record<string, { value: number }>;
}) {
  const height = Math.max(
    MIN_BAR_HEIGHT,
    (segment.intensity / 5) * maxHeight || MIN_BAR_HEIGHT,
  );

  const content = (
    <div
      className="relative transition-opacity hover:opacity-80 cursor-pointer w-full h-full flex items-end"
      style={{ minWidth: '1px' }}
    >
      {segment.isWarmup || segment.isCooldown ? (
        <WarmupCooldownShape
          segment={segment}
          maxHeight={maxHeight}
          className="w-full h-full"
        />
      ) : (
        <div
          className="rounded-xs w-full"
          style={{
            height: `${height}px`,
            backgroundColor: segment.color,
            minHeight: '4px',
          }}
        />
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">
              {getStepTypeLabel(segment.step.stepType)}
              {segment.step.name && ` - ${segment.step.name}`}
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">{m.workout_duration()}:</span>{' '}
                {formatDuration(
                  segment.step.durationType,
                  segment.step.durationValue ?? segment.duration,
                )}
              </div>
              {segment.step.targets && segment.step.targets.length > 0 && (
                <div>
                  <span className="font-medium">
                    {m.workout_target_type()}:
                  </span>{' '}
                  {segment.step.targets.map(
                    (target: WorkoutStepTarget, idx: number) => (
                      <span key={idx}>
                        {idx > 0 && ', '}
                        {formatTarget(target, undefined, metrics)}
                      </span>
                    ),
                  )}
                </div>
              )}
              {segment.step.notes && (
                <div className="text-muted italic">{segment.step.notes}</div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function WorkoutGraph({
  workout,
  sport,
  className,
  maxHeight = 80,
  athleteId,
}: WorkoutGraphProps) {
  const { data: myAthlete } = useGetMyAthleteQuery();

  // Get athlete data (use provided athleteId or fallback to current user's athlete)
  const targetAthleteId = athleteId || myAthlete?.athleteId;
  const { data: athleteZones } = useGetTrainingZones(targetAthleteId || 0, {
    enabled: !!targetAthleteId,
  } as Parameters<typeof useGetTrainingZones>[1]);
  const { data: latestMetrics } = useGetLatestMetricsQuery(targetAthleteId, {
    enabled: !!targetAthleteId,
  } as Parameters<typeof useGetLatestMetricsQuery>[1]);

  // Organize zones by type
  const zonesByType = useMemo((): Record<TRAINING_ZONE_TYPE, ZoneInfo[]> => {
    const zones = athleteZones || myAthlete?.trainingZones || [];
    const result: Record<TRAINING_ZONE_TYPE, ZoneInfo[]> = {
      [TRAINING_ZONE_TYPE.HEARTRATE]: [],
      [TRAINING_ZONE_TYPE.POWER]: [],
      [TRAINING_ZONE_TYPE.PACE]: [],
    };

    for (const zoneType of [
      TRAINING_ZONE_TYPE.HEARTRATE,
      TRAINING_ZONE_TYPE.POWER,
      TRAINING_ZONE_TYPE.PACE,
    ]) {
      const filteredZones = zones
        .filter(
          (zone: TrainingZone & { values: TrainingZoneValue[] }) =>
            zone.type === zoneType,
        )
        .sort((a: TrainingZone, b: TrainingZone) => a.index - b.index)
        .map((zone: TrainingZone & { values: TrainingZoneValue[] }) => {
          const values = zone.values.filter((value: TrainingZoneValue) => {
            if (sport) {
              return value.sports.includes(sport);
            }
            return true;
          });

          if (values.length === 0) return null;

          return {
            id: zone.trainingZoneId,
            name: zone.name,
            color: zone.color,
            min: values[0].min,
            max: values[0].max,
          };
        })
        .filter((zone: ZoneInfo | null): zone is ZoneInfo => zone !== null);

      result[zoneType] = filteredZones;
    }

    return result;
  }, [athleteZones, myAthlete, sport]);

  // Format metrics for easy lookup
  const metrics = useMemo(() => {
    if (!latestMetrics) return undefined;
    const formatted: Record<string, { value: number }> = {};
    for (const [key, metric] of Object.entries(latestMetrics)) {
      if (metric && typeof metric === 'object' && 'value' in metric) {
        formatted[key] = { value: metric.value };
      }
    }
    return formatted;
  }, [latestMetrics]);

  const segments = useMemo(() => {
    if (workout.steps.length === 0) return [];
    return flattenSteps(workout.steps, zonesByType, metrics, sport);
  }, [workout.steps, zonesByType, metrics, sport]);

  const totalDuration = useMemo(() => {
    return (
      segments.reduce(
        (acc: number, seg: StepSegment) => acc + seg.duration,
        0,
      ) || 3600
    );
  }, [segments]);

  // Calculate widths for all segments and normalize to ensure they sum to 100%
  const segmentWidths = useMemo(() => {
    if (segments.length === 0) return [];

    const widths = segments.map((segment) => {
      const widthPercent = (segment.duration / totalDuration) * 100;
      return Math.max(0.1, widthPercent); // Minimum 0.1% for visibility
    });

    // Normalize to ensure total is 100%
    const total = widths.reduce((sum, w) => sum + w, 0);
    if (total > 0) {
      return widths.map((w) => (w / total) * 100);
    }
    return widths;
  }, [segments, totalDuration]);

  // Calculate the actual maximum height needed based on segment intensities
  const containerHeight = useMemo(() => {
    if (segments.length === 0) return maxHeight;

    const calculatedMaxHeight = segments.reduce((max, segment) => {
      const height = Math.max(
        MIN_BAR_HEIGHT,
        (segment.intensity / 5) * maxHeight || MIN_BAR_HEIGHT,
      );
      return Math.max(max, height);
    }, MIN_BAR_HEIGHT);

    // Add some padding (py-2 = 8px top + 8px bottom = 16px)
    return calculatedMaxHeight + 16;
  }, [segments, maxHeight]);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="w-full overflow-hidden">
        <div
          className="flex items-end gap-px py-2 w-full"
          style={{ height: `${containerHeight}px` }}
        >
          {segments.map((segment, index) => {
            const widthPercent = segmentWidths[index] || 0;

            return (
              <div
                key={`${segment.step.workoutStepId || index}-${segment.startTime}`}
                className="h-full"
                style={{
                  width: `${widthPercent}%`,
                  minWidth: '1px',
                }}
              >
                <StepBar
                  segment={segment}
                  maxHeight={maxHeight}
                  metrics={metrics}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
