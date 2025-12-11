import { useGetMetricsQuery } from '@/api/metric';
import { AthleteMetric } from '@/api/metric';
import { useTrainingLoadMetrics } from '@/api/training-load';
import { TrainingLoadCalculationType } from '@/api/training-load/training-load.api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useMemo } from 'react';

import {
  EVENT_TYPE,
  Event,
  METRIC_TYPE,
  metricUnitMap,
} from '@openathlete/shared';

interface AthleteDashboardHeaderProps {
  events?: Event[];
  athleteId?: number;
}

export function AthleteDashboardHeader({
  events,
  athleteId,
}: AthleteDashboardHeaderProps) {
  // Get upcoming competitions
  const upcomingCompetitions = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .filter(
        (event) =>
          event.type === EVENT_TYPE.COMPETITION &&
          new Date(event.startDate) >= now,
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 2);
  }, [events]);

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

  const getTSBColor = (tsb?: number) => {
    if (tsb === undefined) return 'text-muted-foreground';
    if (tsb > 5) return 'text-green-600 dark:text-green-400';
    if (tsb < -5) return 'text-red-600 dark:text-red-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getTSBStatus = (tsb?: number) => {
    if (tsb === undefined) return null;
    if (tsb > 5) return 'optimal';
    if (tsb < -5) return 'overreaching';
    return 'balanced';
  };

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Upcoming Competitions */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {m.dashboard_header_upcoming_competitions()}
            </h3>
            {upcomingCompetitions.length === 0 ? (
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
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-100 truncate">
                        {competition.name}
                      </p>
                      <p className="text-[10px] text-blue-700 dark:text-blue-300">
                        {getDaysUntil(competition.startDate)} •{' '}
                        {format(competition.startDate, 'MMM d')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fitness Status (CTL/ATL/TSB) */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {m.training_load()}
            </h3>
            {isLoadingTrainingLoad ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-md" />
                ))}
              </div>
            ) : trainingLoadMetrics ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-gradient-to-br from-purple-50 to-blue-50 p-2 dark:from-purple-950/30 dark:to-blue-950/30">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-muted-foreground mb-0.5">
                      CTL
                    </span>
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {Math.round(trainingLoadMetrics.ctl)}
                    </span>
                  </div>
                </div>
                <div className="rounded-md bg-gradient-to-br from-orange-50 to-red-50 p-2 dark:from-orange-950/30 dark:to-red-950/30">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-muted-foreground mb-0.5">
                      ATL
                    </span>
                    <span className="text-lg font-bold text-orange-700 dark:text-orange-300">
                      {Math.round(trainingLoadMetrics.atl)}
                    </span>
                  </div>
                </div>
                <div
                  className={`rounded-md bg-gradient-to-br p-2 ${
                    getTSBStatus(trainingLoadMetrics.tsb) === 'optimal'
                      ? 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
                      : getTSBStatus(trainingLoadMetrics.tsb) === 'overreaching'
                        ? 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30'
                        : 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-muted-foreground mb-0.5">
                      TSB
                    </span>
                    <span
                      className={`text-lg font-bold ${getTSBColor(trainingLoadMetrics.tsb)}`}
                    >
                      {trainingLoadMetrics.tsb > 0 ? '+' : ''}
                      {Math.round(trainingLoadMetrics.tsb)}
                    </span>
                    <span className="text-[9px] text-muted-foreground mt-0.5 truncate">
                      {getTSBStatus(trainingLoadMetrics.tsb) === 'optimal'
                        ? m.optimal_zone()
                        : getTSBStatus(trainingLoadMetrics.tsb) ===
                            'overreaching'
                          ? m.overtraining()
                          : m.detraining()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {m.no_data_for_metric()}
              </p>
            )}
          </div>

          {/* Recent Metrics */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {m.dashboard_header_recent_metrics()}
            </h3>
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
                {recentMetrics.map((metric, index) => {
                  const label =
                    metricTypeLabelMap[metric.type as METRIC_TYPE] ||
                    metric.type;
                  const unit = metricUnitMap[metric.type as METRIC_TYPE] || '';

                  // Different gradient colors for each metric
                  const gradientColors = [
                    'from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30',
                    'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
                    'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30',
                  ];
                  const textColors = [
                    'text-indigo-700 dark:text-indigo-300',
                    'text-pink-700 dark:text-pink-300',
                    'text-cyan-700 dark:text-cyan-300',
                  ];

                  return (
                    <div
                      key={metric.athleteMetricId}
                      className={`rounded-md bg-gradient-to-br p-2 ${gradientColors[index % gradientColors.length]}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-muted-foreground mb-0.5 truncate">
                          {label}
                        </span>
                        <div className="flex items-baseline gap-0.5">
                          <span
                            className={`text-lg font-bold ${textColors[index % textColors.length]}`}
                          >
                            {metric.value}
                          </span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
