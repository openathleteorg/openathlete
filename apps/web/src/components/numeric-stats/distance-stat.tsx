import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';

import { formatDistance } from '@openathlete/shared';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface P {
  label?: string;
  distance: number;
}

export function DistanceStat({ label, distance }: P) {
  const units = useUnits();
  const imperial = units.unitSystem === 'IMPERIAL';

  return (
    <Popover>
      <PopoverTrigger className="text-left">
        {label && <div className="text-sm font-semibold">{label}</div>}
        <div>
          {units.formatDist(distance)}{' '}
          <span className="text-muted-foreground text-sm">
            {units.distanceLabel}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent>
        {imperial ? (
          <>
            <div>
              {formatDistance(distance, 'yd')}{' '}
              <span className="text-muted-foreground text-sm">{m.yards()}</span>
            </div>
            <div>
              {formatDistance(distance, 'km')}{' '}
              <span className="text-muted-foreground text-sm">
                {m.kilometers()}
              </span>
            </div>
          </>
        ) : (
          <>
            <div>
              {formatDistance(distance, 'm')}{' '}
              <span className="text-muted-foreground text-sm">
                {m.meters()}
              </span>
            </div>
            <div>
              {formatDistance(distance, 'mi')}{' '}
              <span className="text-muted-foreground text-sm">{m.miles()}</span>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
