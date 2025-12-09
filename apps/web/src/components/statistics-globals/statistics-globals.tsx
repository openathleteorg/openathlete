import { m } from '@/paraglide/messages';

import { formatDistance, formatDuration } from '@openathlete/shared';

import { Card, CardContent } from '../ui/card';

interface P {
  duration: number;
  distance: number;
  elevationGain: number;
  count: number;
  className?: string;
}

export function StatisticsGlobals({
  duration,
  distance,
  elevationGain,
  count,
  className,
}: P) {
  return (
    <Card className={className}>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6">
        <div className="text-xl md:text-2xl font-bold">
          {formatDuration(duration)}
        </div>
        <div className="text-xl md:text-2xl font-bold">
          {formatDistance(distance)}{' '}
          <span className="text-base md:text-xl text-gray-500 dark:text-gray-400">
            {m.kilometers()}
          </span>
        </div>
        <div className="text-xl md:text-2xl font-bold">
          {elevationGain}{' '}
          <span className="text-base md:text-xl text-gray-500 dark:text-gray-400">
            {m.short_elevation_gain()}
          </span>
        </div>
        <div className="text-xl md:text-2xl font-bold">
          {count}{' '}
          <span className="text-base md:text-xl text-gray-500 dark:text-gray-400">
            {count > 1 ? m.activities() : m.activity()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
