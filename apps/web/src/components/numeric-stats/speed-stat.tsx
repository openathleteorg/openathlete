import { useGetLatestMetricsQuery } from '@/api/metric';
import { m } from '@/paraglide/messages';

import {
  METRIC_TYPE,
  SpeedUnit,
  formatSpeed,
  formatSpeedUnit,
} from '@openathlete/shared';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface P {
  label: string;
  speed: number;
  unit?: SpeedUnit;
  athleteId?: number;
}

export function SpeedStat({ label, speed, unit, athleteId }: P) {
  const { data: latestMetrics = {} } = useGetLatestMetricsQuery(athleteId);

  // Convert speed to km/h for VMA comparison (VMA is stored in km/h)
  // speed is in m/s, so multiply by 3.6 to get km/h
  const speedKmh = speed * 3.6;
  const vma = latestMetrics[METRIC_TYPE.VMA]?.value;
  const percentOfVma =
    vma && vma > 0 ? Math.round((speedKmh / vma) * 100) : null;

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
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {m.meters_per_second()}
          </span>
        </div>
        <div>
          {formatSpeed(speed, 'km/h')}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {m.kilometers_per_hour()}
          </span>
        </div>
        <div>
          {formatSpeed(speed, 'mph')}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {m.miles_per_hour()}
          </span>
        </div>
        {percentOfVma !== null && (
          <div>
            {percentOfVma}
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {' '}
              {m.percent_of_vma()}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
