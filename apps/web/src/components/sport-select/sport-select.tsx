import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';

import { SPORT_TYPE } from '@openathlete/shared';

import { SportIcon } from '../sport-icon/sport-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface P {
  selected: SPORT_TYPE | null;
  onChange: (sport: SPORT_TYPE | null) => void;
}

export function SportSelect({ selected, onChange }: P) {
  return (
    <Select
      value={(selected || '') as string}
      onValueChange={(sport) => onChange(sport as SPORT_TYPE)}
    >
      <SelectTrigger>
        <SelectValue placeholder={m.all_sports()} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null!}>{m.all_sports()}</SelectItem>
        {Object.values(SPORT_TYPE).map((sportType) => (
          <SelectItem key={sportType} value={sportType}>
            <SportIcon sport={sportType} /> {sportTypeLabelMap[sportType]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
