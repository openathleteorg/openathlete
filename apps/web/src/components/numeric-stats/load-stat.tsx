import { m } from '@/paraglide/messages';

interface P {
  totalLoad?: number;
  actualLoad?: number;
  plannedLoad?: number;
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

export function LoadStat({ totalLoad, actualLoad, plannedLoad, isLoading }: P) {
  return (
    <div className="mt-auto">
      {isLoading ? (
        <div className="h-6 w-20 bg-muted animate-pulse rounded" />
      ) : (
        <div>
          {formatLoadValue(totalLoad)}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {m.trimp_points_unit()}
          </span>
        </div>
      )}
      {!isLoading && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {m.weekly_trimp_breakdown({
            actual: formatLoadValue(actualLoad),
            planned: formatLoadValue(plannedLoad),
          })}
        </div>
      )}
    </div>
  );
}
