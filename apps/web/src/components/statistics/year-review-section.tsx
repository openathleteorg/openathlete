import { useGetRecordsQuery } from '@/api/record';
import {
  useStatisticsDaysQuery,
  useStatisticsOverviewQuery,
} from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { getDateFnsLocale } from '@/utils/locales';
import { format, parseISO } from 'date-fns';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

import { formatDistance, formatDuration } from '@openathlete/shared';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { MetricTile } from '../ui/metric-tile';
import { Skeleton } from '../ui/skeleton';
import { StatSection } from './stat-section';
import { SegmentTabs } from './statistics-tabs';
import { shareYearCard } from './year-card';
import { yearReview } from './year-review-data';

interface P {
  athleteId: number;
  firstActivityDate: Date | null | undefined;
}

function Review({
  athleteId,
  year,
  visible,
}: {
  athleteId: number;
  year: number;
  visible: boolean;
}) {
  const locale = getDateFnsLocale(getLocale());
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31, 23, 59, 59);
  const params = { athleteId, from, to };
  const { data: days } = useStatisticsDaysQuery(params, visible);
  const { data: overview } = useStatisticsOverviewQuery(params, visible);
  const { data: records } = useGetRecordsQuery(
    { athleteId, from, to },
    { enabled: visible },
  );
  if (!days || !overview) {
    return (
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }
  if (days.days.length === 0) {
    return (
      <Card className="gap-0 py-0">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {m.no_data_for_period()}
        </CardContent>
      </Card>
    );
  }
  const review = yearReview(days.days, year);
  const mainSport = overview.sports[0];
  const figures = [
    {
      label: m.statistics_time_in_motion(),
      value: `${Math.round(review.movingTime / 3600)}`,
      unit: 'h',
    },
    {
      label: m.distance(),
      value: Math.round(review.distance / 1000).toLocaleString(),
      unit: m.kilometers(),
    },
    {
      label: m.elevation_gain(),
      value: Math.round(review.elevationGain).toLocaleString(),
      unit: m.meters(),
    },
    { label: m.statistics_activities(), value: `${review.activities}` },
    { label: m.statistics_review_active_days(), value: `${review.activeDays}` },
    {
      label: m.statistics_review_streak(),
      value: `${review.longestStreak}`,
      unit: m.statistics_review_days(),
    },
    ...(review.biggestDay
      ? [
          {
            label: m.statistics_review_biggest_day(),
            value: formatDuration(review.biggestDay.movingTime),
            caption: format(parseISO(review.biggestDay.date), 'PP', { locale }),
          },
        ]
      : []),
    ...(review.biggestWeek
      ? [
          {
            label: m.statistics_review_biggest_week(),
            value: formatDuration(review.biggestWeek.movingTime),
            caption: format(parseISO(review.biggestWeek.start), 'PP', {
              locale,
            }),
          },
        ]
      : []),
  ];
  return (
    <div className="space-y-4" data-year-review>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {figures.map((figure) => (
          <MetricTile key={figure.label} {...figure} />
        ))}
      </div>
      {mainSport && (
        <p className="text-sm text-muted-foreground">
          {m.statistics_review_main_sport({
            sport: sportTypeLabelMap[mainSport.sport],
            distance: formatDistance(mainSport.distance),
            count: records?.length ?? 0,
          })}
        </p>
      )}
      <Button
        variant="outline"
        className="h-11 md:h-9"
        data-year-share
        onClick={() =>
          shareYearCard({
            title: m.statistics_review_title({ year }),
            lines: figures
              .slice(0, 6)
              .map(({ label, value, unit }) => [
                label,
                unit ? `${value} ${unit}` : value,
              ]),
          })
        }
      >
        <Share2 className="size-4" />
        {m.statistics_review_share()}
      </Button>
    </div>
  );
}

/** A year at a glance: free, and shared only when the athlete says so. */
export function YearReviewSection({ athleteId, firstActivityDate }: P) {
  const current = new Date().getFullYear();
  const first = firstActivityDate?.getFullYear() ?? current;
  const years = Array.from(
    { length: current - first + 1 },
    (_, index) => current - index,
  );
  const [year, setYear] = useState(current);
  return (
    <StatSection plain id="review" title={m.statistics_view_review()}>
      {(visible) => (
        <div className="space-y-4">
          <SegmentTabs
            secondary
            label={m.statistics_view_review()}
            value={String(year)}
            onChange={(value) => setYear(Number(value))}
            items={years.map((value) => ({
              id: String(value),
              label: () => String(value),
            }))}
          />
          <Review athleteId={athleteId} year={year} visible={visible} />
        </div>
      )}
    </StatSection>
  );
}
