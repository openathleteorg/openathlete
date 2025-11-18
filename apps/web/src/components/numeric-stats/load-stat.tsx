import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface P {
  totalLoad?: number;
  actualLoad?: number;
  plannedLoad?: number;
  recommendedMin?: number;
  recommendedMax?: number;
  isLoading?: boolean;
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

function formatLoadValue(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return '--';
  }
  return numberFormatter.format(Math.round(value));
}

const statusClassMap = {
  low: 'bg-blue-600',
  sweet: 'bg-green-600',
  high: 'bg-red-600',
};

function getZoneStatus(actual?: number, min?: number, max?: number) {
  if (
    actual === undefined ||
    min === undefined ||
    max === undefined ||
    Number.isNaN(actual) ||
    Number.isNaN(min) ||
    Number.isNaN(max)
  ) {
    return null;
  }

  if (actual < min) {
    return 'low';
  }

  if (actual > max) {
    return 'high';
  }

  return 'sweet';
}

function getCursorPercent(actual?: number, min?: number, max?: number) {
  if (
    actual === undefined ||
    min === undefined ||
    max === undefined ||
    Number.isNaN(actual) ||
    Number.isNaN(min) ||
    Number.isNaN(max)
  ) {
    return null;
  }

  const zoneWidth = Math.max(1, max - min);
  const displayMin = Math.max(0, min - zoneWidth * 0.5);
  const displayMax = max + zoneWidth * 0.5;

  if (displayMax <= displayMin) {
    return 50;
  }

  const percent = ((actual - displayMin) / (displayMax - displayMin)) * 100;

  return Math.max(0, Math.min(100, percent));
}

export function LoadStat({
  totalLoad,
  actualLoad,
  plannedLoad,
  recommendedMin,
  recommendedMax,
  isLoading,
}: P) {
  const zoneStatus = getZoneStatus(totalLoad, recommendedMin, recommendedMax);
  const cursorPercent = getCursorPercent(
    totalLoad,
    recommendedMin,
    recommendedMax,
  );

  return (
    <div className="mt-auto pt-2">
      {isLoading ? (
        <div className="h-6 w-20 bg-muted animate-pulse rounded" />
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              {formatLoadValue(totalLoad)}{' '}
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {m.load_points_unit()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              {m.weekly_load_breakdown({
                actual: formatLoadValue(actualLoad),
                planned: formatLoadValue(plannedLoad),
              })}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
      {!isLoading &&
        recommendedMin !== undefined &&
        recommendedMax !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-2 space-y-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="h-1 flex-1 rounded-full bg-muted" />
                    <span className="h-1 w-1 rounded-full bg-muted" />
                    <div className="h-1 flex-1 rounded-full bg-muted" />
                    <span className="h-1 w-1 rounded-full bg-muted" />
                    <div className="h-1 flex-1 rounded-full bg-muted" />
                  </div>
                  <div className="relative h-1">
                    {cursorPercent !== null && (
                      <span
                        className={cn(
                          'absolute -top-3 h-3 w-3 rounded-full border border-background bg-foreground shadow',
                          statusClassMap[zoneStatus ?? 'sweet'],
                        )}
                        style={{ left: `calc(${cursorPercent}% - 6px)` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                <span className="font-medium">
                  {formatLoadValue(recommendedMin)} -{' '}
                  {formatLoadValue(recommendedMax)}
                </span>
              </p>
            </TooltipContent>
          </Tooltip>
        )}
    </div>
  );
}
