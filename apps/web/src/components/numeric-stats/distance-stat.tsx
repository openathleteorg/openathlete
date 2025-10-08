import { m } from '@/paraglide/messages';

import { formatDistance } from '@openathlete/shared';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface P {
  label?: string;
  distance: number;
}

export function DistanceStat({ label, distance }: P) {
  return (
    <Popover>
      <PopoverTrigger className="text-left">
        {label && <div className="text-sm font-semibold">{label}</div>}
        <div>
          {formatDistance(distance, 'km')}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {m.kilometers()}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <div>
          {formatDistance(distance, 'm')}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {m.meters()}
          </span>
        </div>
        <div>
          {formatDistance(distance, 'mi')}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {m.miles()}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
