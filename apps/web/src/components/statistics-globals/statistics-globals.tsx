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
      <CardContent className="flex gap-6">
        <div className="text-2xl font-bold">{formatDuration(duration)}</div>
        <div className="text-2xl font-bold">
          {formatDistance(distance)}{' '}
          <span className="text-xl text-gray-500 dark:text-gray-400">{m.kilometers()}</span>
        </div>
        <div className="text-2xl font-bold">
          {elevationGain}{' '}
          <span className="text-xl text-gray-500 dark:text-gray-400">
            {m.short_elevation_gain()}
          </span>
        </div>
        <div className="text-2xl font-bold">
          {count}{' '}
          <span className="text-xl text-gray-500 dark:text-gray-400">
            {count > 1 ? m.activities() : m.activity()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
