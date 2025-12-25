import { useGetLatestMetricsQuery } from '@/api/metric';
import { useTrainingZones } from '@/hooks/use-training-zones';
import { m } from '@/paraglide/messages';

import {
  METRIC_TYPE,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
} from '@openathlete/shared';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface P {
  label: string;
  heartrate: number;
  sport?: SPORT_TYPE;
  athleteId?: number;
}

export function HeartrateStat({ label, heartrate, sport, athleteId }: P) {
  const trainingZones = useTrainingZones(TRAINING_ZONE_TYPE.HEARTRATE, sport);
  const { data: latestMetrics = {} } = useGetLatestMetricsQuery(athleteId);

  const zone = trainingZones?.find((zone) => {
    return heartrate >= zone.min && heartrate <= zone.max;
  });

  const hrMax = latestMetrics[METRIC_TYPE.HR_MAX]?.value;
  const percentOfMax =
    hrMax && hrMax > 0 ? Math.round((heartrate / hrMax) * 100) : null;

  return (
    <Popover>
      <PopoverTrigger className="text-left">
        <div className="text-sm font-semibold">{label}</div>
        <div>
          {heartrate}{' '}
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {m.bpm()}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent>
        {zone?.name && <div>{zone.name}</div>}
        {percentOfMax !== null && (
          <div>
            {percentOfMax}
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {' '}
              {m.percent_of_max_heart_rate()}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
