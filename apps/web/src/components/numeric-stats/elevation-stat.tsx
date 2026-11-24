import { useUnits } from '@/hooks/use-units';

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
  const units = useUnits();

  return (
    <Popover>
      <PopoverTrigger className="text-left">
        {label && <div className="text-sm font-semibold">{label}</div>}
        <div>
          {units.elevation(elevation)}{' '}
          <span className="text-muted-foreground text-sm">
            {units.elevationLabel}
          </span>
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
