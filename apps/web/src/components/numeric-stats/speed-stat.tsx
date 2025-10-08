import { m } from '@/paraglide/messages';

import { SpeedUnit, formatSpeed, formatSpeedUnit } from '@openathlete/shared';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface P {
  label: string;
  speed: number;
  unit?: SpeedUnit;
}

export function SpeedStat({ label, speed, unit }: P) {
  return (
    <Popover>
      <PopoverTrigger className="text-left">
        <div className="text-sm font-semibold">{label}</div>
        <div>
          {formatSpeed(speed, unit)}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {unit ? formatSpeedUnit(unit) : '/ km'}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <div>
          {formatSpeed(speed, 'm/s')}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">{m.meters_per_second()}</span>
        </div>
        <div>
          {formatSpeed(speed, 'km/h')}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {m.kilometers_per_hour()}
          </span>
        </div>
        <div>
          {formatSpeed(speed, 'mph')}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">{m.miles_per_hour()}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
