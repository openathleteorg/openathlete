import { SportDistributionChart } from '@/components/charts/sport-distribution-chart';
import { StatisticsGlobals } from '@/components/statistics-globals/statistics-globals';
import { StatisticsPeriodSelect } from '@/components/statistics-period-select/statistics-period-select';
import { TrainingLoadChart } from '@/components/training-load';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { m } from '@/paraglide/messages';
import { useGetStatisticsForPeriodQuery } from '@/services/statistics';
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
  const { data: statistics } = useGetStatisticsForPeriodQuery(
    athleteId,
    period.start,
    period.end,
  );

  return (
    <div className="p-8 grid grid-cols-2 gap-4">
      <StatisticsPeriodSelect
        onChange={(start, end) => setPeriod({ start, end })}
        period={period}
        className="col-span-2"
      />
      {statistics && (
        <>
          <StatisticsGlobals
            duration={statistics?.duration || 0}
            distance={statistics?.distance || 0}
            elevationGain={statistics?.elevationGain || 0}
            count={statistics?.count || 0}
            className="col-span-2"
          />
          {statistics.sports.length !== 0 && (
            <>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>{m.duration_for_each_sport()}</CardTitle>
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
                <CardHeader>
                  <CardTitle>{m.distance_for_each_sport()}</CardTitle>
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
                <CardHeader>
                  <CardTitle>{m.elevation_for_each_sport()}</CardTitle>
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
                <CardHeader>
                  <CardTitle>{m.activities_for_each_sport()}</CardTitle>
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
          <div className="col-span-2">
            <TrainingLoadChart startDate={period.start} endDate={period.end} />
          </div>
          {/* <div className="col-span-2">
            <TrainingLoadMetricsCard />
          </div> */}
        </>
      )}
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
