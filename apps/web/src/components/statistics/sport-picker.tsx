import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';

import { SPORT_TYPE } from '@openathlete/shared';

import { SegmentTabs } from './statistics-tabs';

interface P {
  sports: SPORT_TYPE[];
  value: SPORT_TYPE;
  onChange: (sport: SPORT_TYPE) => void;
}

/** For views that only mean something for one sport */
export function SportPicker({ sports, value, onChange }: P) {
  if (sports.length < 2) return null;
  return (
    <SegmentTabs
      secondary
      label={m.sport()}
      value={value}
      onChange={onChange}
      items={sports.map((sport) => ({
        id: sport,
        label: () => sportTypeLabelMap[sport],
      }))}
    />
  );
}
