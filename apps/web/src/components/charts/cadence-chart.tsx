import { m } from '@/paraglide/messages';
import { useMemo, useState } from 'react';
import { Line, LineChart, ReferenceArea, XAxis, YAxis } from 'recharts';
import { CategoricalChartFunc } from 'recharts/types/chart/generateCategoricalChart';

import { ActivityStream, SPORT_TYPE } from '@openathlete/shared';

import { useActivityDetailsSelection } from '../event-details/activity-details-selection-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  cadenceStream: Exclude<ActivityStream['cadence'], undefined>;
  sport?: SPORT_TYPE;
  timeStream?: Exclude<ActivityStream['time'], undefined>;
  distanceStream?: Exclude<ActivityStream['distance'], undefined>;
  onHover?: (hover?: { index: number; time: number }) => void;
}

export function CadenceChart({
  cadenceStream,
  sport,
  timeStream,
  distanceStream,
  onHover,
}: P) {
  const { domain, setDomain, reset, fullDomain } =
    useActivityDetailsSelection();
  const [refAreaStart, setRefAreaStart] = useState<number | undefined>();
  const [refAreaEnd, setRefAreaEnd] = useState<number | undefined>();

  // For running and trail running, convert rpm to ppm (steps per minute) by multiplying by 2
  const isRunningSport =
    sport === SPORT_TYPE.RUNNING || sport === SPORT_TYPE.TRAIL_RUNNING;
  const conversionFactor = isRunningSport ? 2 : 1;
  const unit = isRunningSport ? m.ppm() : m.rpm();

  const chartData = useMemo(() => {
    return cadenceStream.map((cadence, i) => {
      const time = timeStream ? timeStream[i] : i;
      const x = distanceStream ? distanceStream[i] : time;
      // Convert cadence: multiply by 2 for running/trail to get steps per minute
      const convertedCadence = cadence * conversionFactor;
      return {
        cadence: convertedCadence,
        time,
        x,
      };
    });
  }, [cadenceStream, timeStream, distanceStream, conversionFactor]);

  const minCadence = useMemo(
    () => Math.min(...chartData.map((data) => data.cadence)),
    [chartData],
  );
  const maxCadence = useMemo(
    () => Math.max(...chartData.map((data) => data.cadence)),
    [chartData],
  );

  const xDomain: [number, number] = useMemo(() => {
    return (domain as [number, number]) ?? fullDomain;
  }, [domain, fullDomain]);

  return (
    <ChartContainer
      config={{
        cadence: {
          label: m.cadence(),
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
        <YAxis type="number" domain={[minCadence, maxCadence]} hide />
        <Line
          type="monotone"
          dataKey="cadence"
          stroke="var(--chart-2)"
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
                    {Math.round(Number(value))}{' '}
                    <span className="font-normal text-muted-foreground">
                      {unit}
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
