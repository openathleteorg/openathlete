import { useTrainingZones } from '@/hooks/use-training-zones';
import { m } from '@/paraglide/messages';

import { SPORT_TYPE, TRAINING_ZONE_TYPE } from '@openathlete/shared';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface P {
  label: string;
  heartrate: number;
  sport?: SPORT_TYPE;
}

export function HeartrateStat({ label, heartrate, sport }: P) {
  const trainingZones = useTrainingZones(TRAINING_ZONE_TYPE.HEARTRATE, sport);

  const zone = trainingZones?.find((zone) => {
    return heartrate >= zone.min && heartrate <= zone.max;
  });
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
      <PopoverContent>{zone?.name}</PopoverContent>
    </Popover>
  );
}
