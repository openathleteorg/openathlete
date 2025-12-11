import {
  useGetFirstActivityDateQuery,
  useGetProgressionDataQuery,
} from '@/api/progression';
import { ProgressionPeriodSelect } from '@/components/progression-period-select/progression-period-select';
import { ProgressionChart } from '@/components/progression/progression-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton, SkeletonChart } from '@/components/ui/skeleton';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import { useState } from 'react';

import {
  SPORT_TYPE,
  formatDistance,
  formatDuration,
  formatSpeedUnit,
  getYearPeriod,
  speedToPace,
} from '@openathlete/shared';

interface P {
  athleteId: number;
}

export function ProgressionView({ athleteId }: P) {
  const [period, setPeriod] = useState<{ start: Date; end: Date }>(
    getYearPeriod(new Date()),
  );
  const [sport, setSport] = useState<SPORT_TYPE | null>(null);
  const { data: progressionData, isPending: isLoadingProgression } =
    useGetProgressionDataQuery(
      athleteId,
      period.start,
      period.end,
      sport || undefined,
    );
  const { data: firstActivityDate } = useGetFirstActivityDateQuery(
    athleteId,
    sport || undefined,
  );
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });

  const pageTitle = isCurrentUser
    ? m.my_progression()
    : m.progression_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  return (
    <div className="w-full p-4 md:p-8 space-y-4">
      <h1 className="text-xl md:text-2xl font-semibold">{pageTitle}</h1>
      <ProgressionPeriodSelect
        onChange={(start, end) => setPeriod({ start, end })}
        period={period}
        firstActivityDate={firstActivityDate || null}
        sport={sport}
        onSportChange={setSport}
        className="p-0"
      />
      {isLoadingProgression ? (
        <div className="space-y-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <SkeletonChart className="h-[300px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : progressionData && progressionData.data.length > 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{m.total_distance()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProgressionChart
                data={progressionData.data}
                aggregationType={progressionData.aggregationType}
                title={m.total_distance()}
                dataKey="totalDistance"
                formatter={(value) => formatDistance(value)}
                yAxisLabel="km"
                yAxisFormatter={(value) => `${formatDistance(value)}`}
                color="var(--chart-1)"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{m.average_distance_per_activity()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProgressionChart
                data={progressionData.data}
                aggregationType={progressionData.aggregationType}
                title={m.average_distance_per_activity()}
                dataKey="averageDistancePerActivity"
                formatter={(value) => formatDistance(value)}
                yAxisLabel="km"
                yAxisFormatter={(value) => `${formatDistance(value)}`}
                color="var(--chart-1)"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{m.average_speed()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProgressionChart
                data={progressionData.data.map((d) => ({
                  ...d,
                  averageSpeed:
                    d.averageSpeed > 0 ? speedToPace(d.averageSpeed) : 0,
                }))}
                aggregationType={progressionData.aggregationType}
                title={m.average_speed()}
                dataKey="averageSpeed"
                formatter={(value) => {
                  if (value === 0) return `0 ${formatSpeedUnit('min/km')}`;
                  const secondsPerKm = value * 60;
                  return `${formatDuration(secondsPerKm)} ${formatSpeedUnit('min/km')}`;
                }}
                yAxisLabel={formatSpeedUnit('min/km')}
                yAxisFormatter={(value) => {
                  if (value === 0) return '0';
                  const secondsPerKm = value * 60;
                  return formatDuration(secondsPerKm);
                }}
                color="var(--chart-2)"
              />
            </CardContent>
          </Card>

          {/* GAP */}
          <Card>
            <CardHeader>
              <CardTitle>{m.gap()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProgressionChart
                data={progressionData.data
                  .filter((d) => d.averageGapSpeed !== null)
                  .map((d) => ({
                    ...d,
                    averageGapSpeed:
                      d.averageGapSpeed && d.averageGapSpeed > 0
                        ? speedToPace(d.averageGapSpeed)
                        : null,
                  }))}
                aggregationType={progressionData.aggregationType}
                title={m.gap()}
                dataKey="averageGapSpeed"
                formatter={(value) => {
                  if (value === null) return '-';
                  if (value === 0) return `0 ${formatSpeedUnit('min/km')}`;
                  const secondsPerKm = value * 60;
                  return `${formatDuration(secondsPerKm)} ${formatSpeedUnit('min/km')}`;
                }}
                yAxisLabel={formatSpeedUnit('min/km')}
                yAxisFormatter={(value) => {
                  if (value === 0) return '0';
                  const secondsPerKm = value * 60;
                  return formatDuration(secondsPerKm);
                }}
                color="var(--chart-3)"
              />
            </CardContent>
          </Card>

          {/* Efficiency */}
          <Card>
            <CardHeader>
              <CardTitle>{m.efficiency()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProgressionChart
                data={progressionData.data.filter((d) => d.efficiency !== null)}
                aggregationType={progressionData.aggregationType}
                title={m.efficiency()}
                dataKey="efficiency"
                formatter={(value) => (value !== null ? value.toFixed(2) : '-')}
                yAxisLabel="GAP/HR"
                yAxisFormatter={(value) => value.toFixed(2)}
                color="var(--chart-4)"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{m.total_elevation_gain()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProgressionChart
                data={progressionData.data}
                aggregationType={progressionData.aggregationType}
                title={m.total_elevation_gain()}
                dataKey="totalElevationGain"
                formatter={(value) => `${Math.round(value)} m`}
                yAxisLabel="m"
                yAxisFormatter={(value) => `${Math.round(value)}`}
                color="var(--chart-5)"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{m.average_elevation_gain_per_activity()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProgressionChart
                data={progressionData.data}
                aggregationType={progressionData.aggregationType}
                title={m.average_elevation_gain_per_activity()}
                dataKey="averageElevationGainPerActivity"
                formatter={(value) => `${Math.round(value)} m`}
                yAxisLabel="m"
                yAxisFormatter={(value) => `${Math.round(value)}`}
                color="var(--chart-5)"
              />
            </CardContent>
          </Card>

          {/* Average Heart Rate */}
          <Card>
            <CardHeader>
              <CardTitle>{m.average_heart_rate()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProgressionChart
                data={progressionData.data.filter(
                  (d) => d.averageHeartrate !== null,
                )}
                aggregationType={progressionData.aggregationType}
                title={m.average_heart_rate()}
                dataKey="averageHeartrate"
                formatter={(value) =>
                  value !== null ? `${Math.round(value)} bpm` : '-'
                }
                yAxisLabel="bpm"
                yAxisFormatter={(value) => `${Math.round(value)}`}
                color="var(--chart-6)"
              />
            </CardContent>
          </Card>

          {/* Average Cadence */}
          <Card>
            <CardHeader>
              <CardTitle>{m.average_cadence()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProgressionChart
                data={progressionData.data.filter(
                  (d) => d.averageCadence !== null,
                )}
                aggregationType={progressionData.aggregationType}
                title={m.average_cadence()}
                dataKey="averageCadence"
                formatter={(value) =>
                  value !== null ? `${Math.round(value)} rpm` : '-'
                }
                yAxisLabel="rpm"
                yAxisFormatter={(value) => `${Math.round(value)}`}
                color="var(--chart-7)"
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No data available
          </CardContent>
        </Card>
      )}
    </div>
  );
}
