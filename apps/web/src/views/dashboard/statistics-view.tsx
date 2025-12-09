import { useGetStatisticsForPeriodQuery } from '@/api/statistics';
import { SportDistributionChart } from '@/components/charts/sport-distribution-chart';
import { StatisticsGlobals } from '@/components/statistics-globals/statistics-globals';
import { StatisticsPeriodSelect } from '@/components/statistics-period-select/statistics-period-select';
import { TrainingLoadChart } from '@/components/training-load';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton, SkeletonChart } from '@/components/ui/skeleton';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import { useState } from 'react';

import {
  formatDistance,
  formatDuration,
  getWeekPeriod,
} from '@openathlete/shared';

interface P {
  athleteId: number;
}

export function StatisticsView({ athleteId }: P) {
  const [period, setPeriod] = useState<{ start: Date; end: Date }>(
    getWeekPeriod(new Date()),
  );
  const { data: statistics, isPending: isLoadingStatistics } =
    useGetStatisticsForPeriodQuery(athleteId, period.start, period.end);
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });

  const pageTitle = isCurrentUser
    ? m.my_statistics()
    : m.statistics_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  return (
    <div className="w-full p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <h1 className="text-xl md:text-2xl font-semibold col-span-1 md:block hidden">
        {pageTitle}
      </h1>
      <StatisticsPeriodSelect
        onChange={(start, end) => setPeriod({ start, end })}
        period={period}
        className="col-span-1 md:col-span-2 p-0"
      />
      {isLoadingStatistics ? (
        <>
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 md:p-6">
                  <Skeleton className="h-3 md:h-4 w-16 md:w-20 mb-2" />
                  <Skeleton className="h-6 md:h-8 w-24 md:w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Skeletons for charts */}
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="col-span-1">
              <CardHeader className="p-4 md:p-6">
                <Skeleton className="h-5 md:h-6 w-32 md:w-40" />
              </CardHeader>
              <CardContent className="p-0">
                <SkeletonChart className="h-[250px] md:h-[300px]" />
              </CardContent>
            </Card>
          ))}
          {/* Skeleton for TrainingLoadChart */}
          <div className="col-span-1 md:col-span-2">
            <SkeletonChart className="h-[350px] md:h-[450px]" />
          </div>
        </>
      ) : statistics ? (
        <>
          <StatisticsGlobals
            duration={statistics?.duration || 0}
            distance={statistics?.distance || 0}
            elevationGain={statistics?.elevationGain || 0}
            count={statistics?.count || 0}
            className="col-span-1 md:col-span-2"
          />
          {statistics.sports.length !== 0 && (
            <>
              <Card className="col-span-1">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">
                    {m.duration_for_each_sport()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SportDistributionChart
                    sports={statistics.sports}
                    keyToUse="duration"
                    formatter={(value: number) => `${formatDuration(value)}`}
                  />
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">
                    {m.distance_for_each_sport()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SportDistributionChart
                    sports={statistics.sports}
                    keyToUse="distance"
                    formatter={(value: number) => `${formatDistance(value)} km`}
                  />
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">
                    {m.elevation_for_each_sport()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SportDistributionChart
                    sports={statistics.sports}
                    keyToUse="elevationGain"
                    formatter={(value: number) => `${value} d+`}
                  />
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">
                    {m.activities_for_each_sport()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SportDistributionChart
                    sports={statistics.sports}
                    keyToUse="count"
                    formatter={(value: number) =>
                      `${value} ${value > 1 ? m.activities() : m.activity()}`
                    }
                  />
                </CardContent>
              </Card>
            </>
          )}
          <div className="col-span-1 md:col-span-2">
            <TrainingLoadChart
              startDate={period.start}
              endDate={period.end}
              athleteId={athleteId}
            />
          </div>
          {/* <div className="col-span-2">
            <TrainingLoadMetricsCard athleteId={athleteId} />
          </div> */}
        </>
      ) : null}
      {/* {statistics && (
        <>
          <div>Duration: {formatDuration(statistics.duration)}</div>
          <div>Distance: {formatDistance(statistics.distance)}km</div>
          <div>Elevation: {statistics.elevationGain}m</div>
          <div>Count: {statistics.count}</div>
          {statistics.sports.map((sport) => (
            <div key={sport.sport}>
              <div>Sport: {sport.sport}</div>
              <div>Duration: {formatDuration(sport.duration)}</div>
              <div>Distance: {formatDistance(sport.distance)}km</div>
              <div>Elevation: {sport.elevationGain}m</div>
              <div>Count: {sport.count}</div>
            </div>
          ))}
        </>
      )} */}
    </div>
  );
}
