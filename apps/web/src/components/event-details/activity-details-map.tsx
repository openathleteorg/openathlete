import { m } from '@/paraglide/messages';
import { useMemo } from 'react';

import { formatDistance } from '@openathlete/shared';
import { Climb } from '@openathlete/shared';

import { indexRange, xSeries } from '../activity-analysis/stream-range';
import { Map, MapHighlight } from '../map/map';
import { useActivityDetailsSelection } from './activity-details-selection-context';

type P = {
  className?: string;
  polyline: number[][];
  pins?: number[][];
  distance?: number[];
  time?: number[];
  timerPaused?: number[];
  /** Drawn over the track; picking one selects it on the charts */
  climbs?: Climb[];
};

export function ActivityDetailsMap({
  className,
  polyline,
  pins,
  distance,
  time,
  timerPaused,
  climbs,
}: P) {
  const { domain, setDomain, xAxis } = useActivityDetailsSelection();
  const series = xSeries({ distance, time }, xAxis);
  const highlights: MapHighlight[] = (climbs ?? []).map((climb, i) => ({
    key: `climb-${i}`,
    range: [climb.start, climb.end],
    label: m.activity_climb_label({
      n: i + 1,
      distance: `${formatDistance(climb.lengthM)} ${m.kilometers()}`,
      grade: `${(climb.grade * 100).toFixed(1)}${m.percent_symbol()}`,
    }),
    onClick: series
      ? () => setDomain([series[climb.start], series[climb.end]])
      : undefined,
  }));
  const focusRange = useMemo(
    () => (domain && series ? indexRange(series, domain) : null) ?? undefined,
    [domain, series],
  );

  return (
    <Map
      className={className}
      polyline={polyline}
      time={time}
      timerPaused={timerPaused}
      focusRange={focusRange}
      pins={pins}
      highlights={highlights}
    />
  );
}
