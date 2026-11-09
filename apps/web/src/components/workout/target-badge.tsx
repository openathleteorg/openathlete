import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAthleteTrainingZones } from '@/hooks/use-training-zones';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { cn } from '@/utils/shadcn';
import { getTargetTypeLabel } from '@/utils/workout';
import { useMemo } from 'react';

import type { WorkoutStepTargetDto } from '@openathlete/shared';
import { SPORT_TYPE, formatTarget } from '@openathlete/shared';

import { useWorkoutAthleteId } from './workout-athlete-context';

interface TargetBadgeProps {
  target: WorkoutStepTargetDto;
  className?: string;
  showTooltip?: boolean;
  sport?: SPORT_TYPE;
  showAbsoluteValues?: boolean;
  /** The athlete the workout belongs to; default: the workout's athlete */
  athleteId?: number | null;
}

export function TargetBadge({
  target,
  className,
  showTooltip = true,
  showAbsoluteValues = false,
  athleteId,
}: TargetBadgeProps) {
  const workoutAthleteId = useWorkoutAthleteId();
  const ownerId = athleteId === undefined ? workoutAthleteId : athleteId;
  const { data: me } = useGetMyAthleteQuery();
  // Zone ids and metrics are the session athlete's, not the viewer's
  const { zones: trainingZones } = useAthleteTrainingZones(ownerId);
  const { data: latestMetrics = {} } = useGetLatestMetricsQuery(
    showAbsoluteValues ? (ownerId ?? me?.athleteId) : undefined,
  );

  // Convert metrics format from Record<string, AthleteMetric> to Record<string, { value: number }>
  const metricsForFormat = useMemo(() => {
    const converted: Record<string, { value: number }> = {};
    Object.entries(latestMetrics).forEach(([key, metric]) => {
      if (metric && typeof metric === 'object' && 'value' in metric) {
        converted[key] = { value: metric.value };
      }
    });
    return converted;
  }, [latestMetrics]);

  const formatted = useMemo(
    () =>
      formatTarget(
        target,
        (metricType) => {
          return (
            metricTypeLabelMap[metricType as keyof typeof metricTypeLabelMap] ||
            metricType
          );
        },
        showAbsoluteValues ? metricsForFormat : undefined,
        trainingZones ?? [],
        // Until the zones load, no verdict on the zone
        trainingZones ? m.workout_target_unknown_zone() : '…',
      ),
    [target, metricsForFormat, showAbsoluteValues, trainingZones],
  );

  const label = getTargetTypeLabel(target.targetType);

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        className,
      )}
    >
      {formatted}
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            <span className="font-medium">{label}:</span> {formatted}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
