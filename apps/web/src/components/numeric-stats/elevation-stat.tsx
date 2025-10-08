import { m } from '@/paraglide/messages';

import { ActivityStream } from '@openathlete/shared';

import { SimpleElevationChart } from '../charts/simple-elevation-chart';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface P {
  label?: string;
  elevation: number;
  altitudeStream?: ActivityStream['altitude'];
  distanceStream?: ActivityStream['distance'];
}

export function ElevationStat({
  label,
  elevation,
  altitudeStream,
  distanceStream,
}: P) {
  return (
    <Popover>
      <PopoverTrigger className="text-left">
        {label && <div className="text-sm font-semibold">{label}</div>}
        <div>
          {elevation.toFixed(0)}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">{m.meters()}</span>
        </div>
      </PopoverTrigger>
      {altitudeStream && distanceStream && (
        <PopoverContent>
          <SimpleElevationChart
            altitudeStream={altitudeStream}
            distanceStream={distanceStream}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}
