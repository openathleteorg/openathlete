import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
import { useGetTrainingZones } from '@/api/training-zone/training-zone.hooks';
import { cn } from '@/utils/shadcn';
import { useMemo } from 'react';

import { SPORT_TYPE, WorkoutStepDto } from '@openathlete/shared';

import {
  buildZonesByType,
  flattenSteps,
  metricValues,
} from '../workout/workout-profile';

type Props = {
  steps: WorkoutStepDto[];
  sport?: SPORT_TYPE;
  athleteId?: number | null;
  className?: string;
};

const WIDTH = 100;
const HEIGHT = 10;
/** The lightest step still shows as a sliver */
const MIN_RATIO = 0.25;

/**
 * The shape of a structured workout at a glance: one bar per step, as wide
 * as it lasts, as tall as it is hard, in its zone's colour. Decorative: the
 * card's text says what the session is.
 */
export function WorkoutMiniProfile({
  steps,
  sport,
  athleteId,
  className,
}: Props) {
  // Shared with every card of the athlete: one request each
  const { data: zones } = useGetTrainingZones(athleteId ?? 0, {
    enabled: !!athleteId,
  } as Parameters<typeof useGetTrainingZones>[1]);
  const { data: latestMetrics } = useGetLatestMetricsQuery(
    athleteId ?? undefined,
    { enabled: !!athleteId } as Parameters<typeof useGetLatestMetricsQuery>[1],
  );

  const shapes = useMemo(() => {
    const zonesByType = buildZonesByType(zones ?? [], sport);
    const segments = flattenSteps(
      steps,
      zonesByType,
      metricValues(latestMetrics),
      sport,
    );
    // Against the athlete's top zone, so its hardest efforts fill the bar
    const topZone = Math.max(
      ...Object.values(zonesByType).flatMap((list) =>
        list.map((zone) => zone.index),
      ),
      0,
    );
    const scale = topZone || 5;
    const total = segments.reduce((sum, segment) => sum + segment.duration, 0);
    if (!total) return [];
    let x = 0;
    return segments.map((segment, index) => {
      const width = (segment.duration / total) * WIDTH;
      const height =
        HEIGHT *
        (MIN_RATIO +
          ((1 - MIN_RATIO) * Math.min(segment.intensity, scale)) / scale);
      const top = HEIGHT - height;
      // Warm-ups ramp up, cool-downs ramp down
      const points = segment.isWarmup
        ? `${x},${HEIGHT} ${x + width},${top} ${x + width},${HEIGHT}`
        : segment.isCooldown
          ? `${x},${top} ${x + width},${HEIGHT} ${x},${HEIGHT}`
          : `${x},${top} ${x + width},${top} ${x + width},${HEIGHT} ${x},${HEIGHT}`;
      x += width;
      return { key: index, points, color: segment.color };
    });
  }, [steps, zones, latestMetrics, sport]);

  if (!shapes.length) return null;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn('block h-2.5 w-full', className)}
      aria-hidden
      data-workout-profile
    >
      {shapes.map((shape) => (
        <polygon
          key={shape.key}
          points={shape.points}
          fill={shape.color}
          // A hairline between steps of the same colour
          stroke="var(--background)"
          strokeWidth={0.4}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
