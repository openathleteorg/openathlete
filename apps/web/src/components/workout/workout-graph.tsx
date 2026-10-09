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

import type { WorkoutDto, WorkoutStepTargetDto } from '@openathlete/shared';
import { SPORT_TYPE, formatTarget } from '@openathlete/shared';

import {
  StepSegment,
  buildZonesByType,
  flattenSteps,
  metricValues,
} from './workout-profile';

interface WorkoutGraphProps {
  workout: WorkoutDto;
  sport?: SPORT_TYPE;
  className?: string;
  maxHeight?: number;
  athleteId?: number;
}

const MIN_BAR_HEIGHT = 8; // pixels

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
  const { data: athlete } = useGetMyAthleteQuery();
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
                    (target: WorkoutStepTargetDto, idx: number) => (
                      <span key={idx}>
                        {idx > 0 && ', '}
                        {formatTarget(
                          target,
                          undefined,
                          metrics,
                          athlete?.trainingZones,
                        )}
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

  const zonesByType = useMemo(
    () =>
      buildZonesByType(athleteZones || myAthlete?.trainingZones || [], sport),
    [athleteZones, myAthlete, sport],
  );

  const metrics = useMemo(() => metricValues(latestMetrics), [latestMetrics]);

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
