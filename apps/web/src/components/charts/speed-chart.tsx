import { m } from '@/paraglide/messages';
import { despikeAndEma } from '@/utils/despike';
import { useMemo, useState } from 'react';
import { Line, LineChart, ReferenceArea, XAxis, YAxis } from 'recharts';
import { CategoricalChartFunc } from 'recharts/types/chart/generateCategoricalChart';

import {
  ActivityStream,
  SPORT_TYPE,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

import { useActivityDetailsSelection } from '../event-details/activity-details-selection-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  latLngStream: Exclude<ActivityStream['latlng'], undefined>;
  timeStream?: Exclude<ActivityStream['time'], undefined>;
  distanceStream?: Exclude<ActivityStream['distance'], undefined>;
  sport: SPORT_TYPE;
  onHover?: (hover?: { index: number; time: number }) => void;
}

export function SpeedChart({
  latLngStream,
  timeStream,
  distanceStream,
  sport,
  onHover,
}: P) {
  const config = getSportConfig(sport);
  const { domain, setDomain, reset, fullDomain } =
    useActivityDetailsSelection();
  const [refAreaStart, setRefAreaStart] = useState<number | undefined>();
  const [refAreaEnd, setRefAreaEnd] = useState<number | undefined>();
  const chartData = useMemo(() => {
    const rawData = latLngStream.map(([lat, lng], i) => {
      const prevPoint = latLngStream[i - 1];
      const prevLat = prevPoint ? prevPoint[0] : lat;
      const prevLng = prevPoint ? prevPoint[1] : lng;
      const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
      const earthRadius = 6371000; // Earth's radius in meters

      const dLat = toRadians(lat - prevLat);
      const dLng = toRadians(lng - prevLng);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(prevLat)) *
          Math.cos(toRadians(lat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = earthRadius * c;
      const time = timeStream ? timeStream[i] : i;
      const x = distanceStream ? distanceStream[i] : time;
      const timeDiff = timeStream ? timeStream[i] - timeStream[i - 1] : 1;
      const speed = distance / (timeDiff || 1);
      return {
        speed,
        time,
        x,
      };
    });

    const smoothed = despikeAndEma(rawData.map((d) => d.speed));
    return rawData.map((d, i) => ({ ...d, speed: smoothed[i] ?? d.speed }));
  }, [latLngStream, timeStream, distanceStream]);

  const minSpeed = useMemo(
    () => Math.min(...chartData.map((data) => data.speed)),
    [chartData],
  );
  const maxSpeed = useMemo(
    () => Math.max(...chartData.map((data) => data.speed)),
    [chartData],
  );

  const xDomain: [number, number] = useMemo(() => {
    return (domain as [number, number]) ?? fullDomain;
  }, [domain, fullDomain]);

  const displayData = useMemo(() => {
    const [from, to] = xDomain;
    if (from === undefined || to === undefined) return chartData;
    const filtered = chartData.filter((d) => d.x >= from && d.x <= to);
    return filtered.length > 1 ? filtered : chartData;
  }, [chartData, xDomain]);

  return (
    <ChartContainer
      config={{
        speed: {
          label: config.speedLabel === 'pace' ? m.pace() : m.speed(),
        },
      }}
      className="h-[100px] w-full"
      onDoubleClick={() => reset()}
    >
      <LineChart
        data={chartData}
        syncId="event"
        syncMethod="value"
        onMouseDown={(e: Parameters<CategoricalChartFunc>['0']) => {
          if (e && typeof e.activeLabel === 'number') {
            setRefAreaStart(e.activeLabel);
            setRefAreaEnd(undefined);
          }
        }}
        onMouseMove={(e: Parameters<CategoricalChartFunc>['0']) => {
          if (
            refAreaStart !== undefined &&
            e &&
            typeof e.activeLabel === 'number'
          ) {
            setRefAreaEnd(e.activeLabel);
          }
          const index = e?.activeTooltipIndex;
          if (
            typeof index === 'number' &&
            index >= 0 &&
            index < chartData.length
          ) {
            const t = chartData[index].time as number;
            onHover?.({ index, time: t });
          }
        }}
        onMouseUp={() => {
          if (refAreaStart !== undefined && refAreaEnd !== undefined) {
            const [from, to] =
              refAreaStart < refAreaEnd
                ? [refAreaStart, refAreaEnd]
                : [refAreaEnd, refAreaStart];
            if (to - from > 0) {
              setDomain([from, to]);
            }
          }
          setRefAreaStart(undefined);
          setRefAreaEnd(undefined);
        }}
        onMouseLeave={() => onHover?.(undefined)}
      >
        <XAxis
          type="number"
          dataKey="x"
          domain={xDomain}
          allowDataOverflow
          hide
        />
        <YAxis
          type="number"
          domain={[
            Math.min(...displayData.map((d) => d.speed), minSpeed),
            Math.max(...displayData.map((d) => d.speed), maxSpeed),
          ]}
          hide
        />
        <Line
          type="monotone"
          dataKey="speed"
          stroke="var(--chart-1)"
          dot={false}
          strokeWidth={1}
          isAnimationActive={false}
        />
        {refAreaStart !== undefined && refAreaEnd !== undefined && (
          <ReferenceArea
            x1={refAreaStart}
            x2={refAreaEnd}
            strokeOpacity={0.3}
          />
        )}
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex min-w-[130px] items-center text-xs text-muted-foreground gap-2">
                  {name}
                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {formatSpeed(Number(value), config.speedUnit)}
                    <span className="font-normal text-muted-foreground">
                      {formatSpeedUnit(config.speedUnit)}
                    </span>
                  </div>
                </div>
              )}
            />
          }
        />
      </LineChart>
    </ChartContainer>
  );
}
