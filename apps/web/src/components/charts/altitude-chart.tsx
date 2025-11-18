import { m } from '@/paraglide/messages';
import { useMemo, useState } from 'react';
import { Line, LineChart, ReferenceArea, XAxis, YAxis } from 'recharts';
import { CategoricalChartFunc } from 'recharts/types/chart/generateCategoricalChart';

import { ActivityStream } from '@openathlete/shared';

import { useActivityDetailsSelection } from '../event-details/activity-details-selection-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  altitudeStream: Exclude<ActivityStream['altitude'], undefined>;
  timeStream?: Exclude<ActivityStream['time'], undefined>;
  distanceStream?: Exclude<ActivityStream['distance'], undefined>;
  onHover?: (hover?: { index: number; time: number }) => void;
}

export function AltitudeChart({
  altitudeStream,
  timeStream,
  distanceStream,
  onHover,
}: P) {
  const { domain, setDomain, reset, fullDomain } =
    useActivityDetailsSelection();
  const [refAreaStart, setRefAreaStart] = useState<number | undefined>();
  const [refAreaEnd, setRefAreaEnd] = useState<number | undefined>();

  const chartData = useMemo(() => {
    return altitudeStream.map((altitude, i) => ({
      altitude,
      time: timeStream ? timeStream[i] : i,
      x: distanceStream ? distanceStream[i] : timeStream ? timeStream[i] : i,
    }));
  }, [altitudeStream, timeStream, distanceStream]);

  const minAlt = useMemo(
    () => Math.min(...chartData.map((d) => d.altitude)),
    [chartData],
  );
  const maxAlt = useMemo(
    () => Math.max(...chartData.map((d) => d.altitude)),
    [chartData],
  );

  const xDomain: [number, number] = useMemo(() => {
    return (domain as [number, number]) ?? fullDomain;
  }, [domain, fullDomain]);

  return (
    <ChartContainer
      config={{
        altitude: {
          label: m.altitude(),
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
        <YAxis type="number" domain={[minAlt, maxAlt]} hide />
        <Line
          type="monotone"
          dataKey="altitude"
          stroke="var(--chart-3)"
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
        <ChartTooltip content={<ChartTooltipContent />} />
      </LineChart>
    </ChartContainer>
  );
}
