import { useGetUpcomingCompetitionsQuery } from '@/api/event';
import { AthleteMetric, useGetMetricsQuery } from '@/api/metric';
import { useTrainingLoadMetrics } from '@/api/training-load';
import { TrainingLoadCalculationType } from '@/api/training-load/training-load.api';
import { CompetitionPriorityBadge } from '@/components/calendar/competition-priority-badge';
import { Card, CardContent } from '@/components/ui/card';
import { InsightBanner } from '@/components/ui/insight-banner';
import { MetricTile } from '@/components/ui/metric-tile';
import { SectionLabel } from '@/components/ui/section-label';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { isCapacitor } from '@/utils/capacitor';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { getDateFnsLocale } from '@/utils/locales';
import { getMetricUnit } from '@/utils/metric-unit';
import {
  FormStatus,
  formStatusLabel,
  formStatusTextClass,
  formatForm,
  getFormStatus,
} from '@/utils/training-form';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useMemo } from 'react';

import { EVENT_TYPE, METRIC_TYPE } from '@openathlete/shared';

interface AthleteDashboardHeaderProps {
  athleteId?: number;
}

const formInsight: Record<FormStatus, typeof m.insight_form_balanced> = {
  overtraining: m.insight_form_fatigue,
  optimal: m.insight_form_balanced,
  detraining: m.insight_form_fresh,
};

export function AthleteDashboardHeader({
  athleteId,
}: AthleteDashboardHeaderProps) {
  const isMobile = isCapacitor();
  const {
    data: upcomingCompetitionsData = [],
    isLoading: isLoadingCompetitions,
  } = useGetUpcomingCompetitionsQuery(false, athleteId);

  const upcomingCompetitions = useMemo(() => {
    return upcomingCompetitionsData.slice(0, 2);
  }, [upcomingCompetitionsData]);

  const today = useMemo(() => {
    const now = new Date();
    return now;
  }, []);
  // Get training load metrics
  const { data: trainingLoadMetrics, isLoading: isLoadingTrainingLoad } =
    useTrainingLoadMetrics(TrainingLoadCalculationType.TRIMP, today, athleteId);

  // Get all metrics to find recent updates
  const { data: allMetrics = [], isLoading: isLoadingMetrics } =
    useGetMetricsQuery(undefined, athleteId);

  // Get 2-3 most recent metrics with different types
  const recentMetrics = useMemo(() => {
    if (!allMetrics || allMetrics.length === 0) return [];

    // Sort by updatedAt descending
    const sorted = [...allMetrics].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    // Take first 2-3 with different types
    const seenTypes = new Set<METRIC_TYPE>();
    const result: AthleteMetric[] = [];

    for (const metric of sorted) {
      if (!seenTypes.has(metric.type as METRIC_TYPE)) {
        seenTypes.add(metric.type as METRIC_TYPE);
        result.push(metric);
        if (result.length >= 3) break;
      }
    }

    return result;
  }, [allMetrics]);

  const getDaysUntil = (date: Date): string => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return m.dashboard_header_today();
    if (diffDays === 1) return m.dashboard_header_tomorrow();
    return m.dashboard_header_days_until({ days: diffDays });
  };

  if (isMobile) {
    return null;
  }
  const form =
    trainingLoadMetrics && trainingLoadMetrics.ctl > 0
      ? trainingLoadMetrics.tsb
      : null;

  return (
    <>
      {form !== null && (
        <InsightBanner
          className="mx-4 mb-4 md:mx-0"
          text={formInsight[getFormStatus(form)]({ form: formatForm(form) })}
        />
      )}
      <Card className="mx-4 mb-6 md:mx-0">
        <CardContent>
          {/* Two columns on laptops, with the races across the top: three
            would leave the tiles too narrow for their labels */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {/* Upcoming Competitions */}
            <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
              <SectionLabel>
                {m.dashboard_header_upcoming_competitions()}
              </SectionLabel>
              {isLoadingCompetitions ? (
                <div className="space-y-1.5">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-md" />
                  ))}
                </div>
              ) : upcomingCompetitions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {m.dashboard_header_no_upcoming_competitions()}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {upcomingCompetitions.map((competition) => (
                    <div
                      key={competition.eventId}
                      className="flex items-start gap-1.5 rounded-md bg-blue-50 p-2 dark:bg-blue-950/30"
                    >
                      <Calendar className="mt-0.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="flex items-center gap-1 text-xs font-medium text-blue-900 dark:text-blue-100">
                          <CompetitionPriorityBadge
                            priority={
                              competition.type === EVENT_TYPE.COMPETITION
                                ? competition.priority
                                : null
                            }
                          />
                          <span className="truncate">{competition.name}</span>
                        </p>
                        <p className="text-[10px] text-blue-700 dark:text-blue-300">
                          {getDaysUntil(competition.startDate)} •{' '}
                          {format(competition.startDate, 'MMM d', {
                            locale: getDateFnsLocale(getLocale()),
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fitness Status (CTL/ATL/TSB) */}
            <div className="space-y-1.5">
              <SectionLabel>{m.training_load()}</SectionLabel>
              {isLoadingTrainingLoad ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                  ))}
                </div>
              ) : trainingLoadMetrics ? (
                <div className="grid grid-cols-3 gap-2">
                  <MetricTile
                    label="CTL"
                    value={Math.round(trainingLoadMetrics.ctl)}
                  />
                  <MetricTile
                    label="ATL"
                    value={Math.round(trainingLoadMetrics.atl)}
                  />
                  <MetricTile
                    label="TSB"
                    value={formatForm(trainingLoadMetrics.tsb)}
                    valueClassName={
                      formStatusTextClass[
                        getFormStatus(trainingLoadMetrics.tsb)
                      ]
                    }
                    caption={formStatusLabel[
                      getFormStatus(trainingLoadMetrics.tsb)
                    ]()}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {m.no_data_for_metric()}
                </p>
              )}
            </div>

            {/* Recent Metrics */}
            <div className="space-y-1.5">
              <SectionLabel>{m.dashboard_header_recent_metrics()}</SectionLabel>
              {isLoadingMetrics ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                  ))}
                </div>
              ) : recentMetrics.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {m.dashboard_header_no_recent_metrics()}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {recentMetrics.map((metric) => (
                    <MetricTile
                      key={metric.athleteMetricId}
                      label={
                        metricTypeLabelMap[metric.type as METRIC_TYPE] ||
                        metric.type
                      }
                      value={metric.value}
                      unit={getMetricUnit(metric.type as METRIC_TYPE) || ''}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
