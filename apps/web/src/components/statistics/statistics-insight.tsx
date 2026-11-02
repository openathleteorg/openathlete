import { useStatisticsOverviewQuery } from '@/api/statistics';
import { InsightBanner } from '@/components/ui/insight-banner';
import { m } from '@/paraglide/messages';
import { getDominantSport } from '@/utils/insights';
import { sportTypeLabelMap } from '@/utils/label-map/core';

import { SPORT_TYPE } from '@openathlete/shared';

import { QuickRead } from './quick-read';
import { Period, comparedPeriod } from './statistics-period';

interface P {
  athleteId: number;
  period: { start: Date; end: Date } | null | undefined;
  sport?: SPORT_TYPE | null;
}

/** What moved since the period before, in words anyone can check */
function WhatChanged({
  athleteId,
  period,
  sport,
}: Omit<P, 'period'> & { period: Period }) {
  const before = comparedPeriod(period, 'previous')!;
  const { data } = useStatisticsOverviewQuery(
    {
      athleteId,
      from: period.start,
      to: period.end,
      sport: sport ?? undefined,
      compareFrom: before.start,
      compareTo: before.end,
    },
    true,
  );
  if (!data?.compared || data.compared.movingTime === 0) return null;
  const percent = (key: 'movingTime' | 'load') => {
    const delta = data.totals[key] / data.compared![key] - 1;
    return `${delta > 0 ? '+' : ''}${Math.round(delta * 100)}`;
  };
  return (
    <QuickRead
      lines={[
        {
          kind: 'observation',
          text: m.statistics_changed_time({ percent: percent('movingTime') }),
        },
        ...(data.compared.load > 0
          ? [
              {
                kind: 'observation' as const,
                text: m.statistics_changed_load({ percent: percent('load') }),
              },
            ]
          : []),
      ]}
    />
  );
}

/** The dominant sport says nothing on one sport: it compares them */
export function StatisticsInsight({ athleteId, period, sport }: P) {
  const { data: overview } = useStatisticsOverviewQuery(
    {
      athleteId,
      from: period?.start ?? new Date(0),
      to: period?.end ?? new Date(0),
    },
    !!period && !sport,
  );
  const dominant = !sport && overview && getDominantSport(overview.sports);

  return (
    <>
      {dominant && (
        <InsightBanner
          text={m.insight_dominant_sport({
            sport: sportTypeLabelMap[dominant.sport.sport],
            share: Math.round(dominant.share * 100),
          })}
        />
      )}
      {period && (
        <WhatChanged athleteId={athleteId} period={period} sport={sport} />
      )}
    </>
  );
}
