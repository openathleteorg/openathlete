import {
  useStatisticsOverviewQuery,
  useStatisticsVolumeQuery,
} from '@/api/statistics';
import { m } from '@/paraglide/messages';

import {
  SPORT_TYPE,
  SportGroup,
  StatisticsTotalsDto,
  formatDistance,
  formatDuration,
  getSportConfig,
} from '@openathlete/shared';

import { MetricInfo } from './metric-info';
import { StatTile, StatTileSkeleton } from './stat-tile';
import { Period } from './statistics-period';
import { bucketTotals } from './volume-data';

interface P {
  athleteId: number;
  period: Period | null;
  compared: Period | null;
  sport: SPORT_TYPE | null;
  group: SportGroup | null;
}

const TILES = 5;

/** The answer to "how did it go?", before any chart. */
export function SummarySection({
  athleteId,
  period,
  compared,
  sport,
  group,
}: P) {
  const params = {
    athleteId,
    from: period?.start ?? new Date(0),
    to: period?.end ?? new Date(0),
    sport: sport ?? undefined,
    group: group ?? undefined,
  };
  const { data: overview, isFetching } = useStatisticsOverviewQuery(
    {
      ...params,
      compareFrom: compared?.start,
      compareTo: compared?.end,
    },
    !!period,
  );
  const { data: volume } = useStatisticsVolumeQuery(params, !!period);

  if (!overview) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: TILES }, (_, index) => (
          <StatTileSkeleton key={index} />
        ))}
      </div>
    );
  }

  const config = sport ? getSportConfig(sport) : null;
  const tile = (key: keyof StatisticsTotalsDto) => ({
    current: overview.totals[key],
    compared: overview.compared?.[key] ?? null,
  });
  const sparkline = (
    key: 'movingTime' | 'distance' | 'elevationGain' | 'count',
  ) => volume && bucketTotals(volume.buckets, key);

  return (
    <div
      className={`grid grid-cols-2 gap-3 transition-opacity md:grid-cols-5 ${isFetching ? 'opacity-70' : ''}`}
    >
      <StatTile
        label={m.statistics_time_in_motion()}
        value={formatDuration(overview.totals.movingTime)}
        sparkline={sparkline('movingTime')}
        {...tile('movingTime')}
      />
      {(config?.showDistance ?? true) && (
        <StatTile
          label={m.distance()}
          value={formatDistance(overview.totals.distance)}
          unit={m.kilometers()}
          sparkline={sparkline('distance')}
          {...tile('distance')}
        />
      )}
      {(config?.showElevation ?? true) && (
        <StatTile
          label={m.elevation_gain()}
          value={Math.round(overview.totals.elevationGain).toLocaleString()}
          unit={m.short_elevation_gain()}
          sparkline={sparkline('elevationGain')}
          {...tile('elevationGain')}
        />
      )}
      <StatTile
        label={m.statistics_activities()}
        value={String(overview.totals.count)}
        sparkline={sparkline('count')}
        {...tile('count')}
      />
      <StatTile
        label={m.statistics_load()}
        value={Math.round(overview.totals.load).toLocaleString()}
        info={<MetricInfo metric="trimp" />}
        {...tile('load')}
      />
    </div>
  );
}
