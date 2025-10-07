import { despikeAndEma } from '@/utils/despike';
import { useMemo, useState } from 'react';
import { Line, LineChart, ReferenceArea, XAxis, YAxis } from 'recharts';

import { formatSpeed } from '@openathlete/shared';

import { useActivityDetailsSelection } from '../event-details/activity-details-selection-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  gapStream: number[];
  timeStream?: number[];
  distanceStream?: number[];
  onHover?: (hover?: { index: number; time: number }) => void;
}

export function GapChart({
  gapStream,
  timeStream,
  distanceStream,
  onHover,
}: P) {
  const { domain, setDomain, reset, fullDomain } =
    useActivityDetailsSelection();
  const [refAreaStart, setRefAreaStart] = useState<number | undefined>();
  const [refAreaEnd, setRefAreaEnd] = useState<number | undefined>();

  const chartData = useMemo(() => {
    const base = gapStream.map((gap, i) => {
      const time = timeStream ? timeStream[i] : i;
      const x = distanceStream ? distanceStream[i] : time;
      return { gap, time, x };
    });
    const smoothed = despikeAndEma(base.map((d) => d.gap));
    return base.map((d, i) => ({ ...d, gap: smoothed[i] ?? d.gap }));
  }, [gapStream, timeStream, distanceStream]);

  const minVal = useMemo(
    () => Math.min(...chartData.map((d) => d.gap)),
    [chartData],
  );
  const maxVal = useMemo(
    () => Math.max(...chartData.map((d) => d.gap)),
    [chartData],
  );

  const xDomain: [number, number] = useMemo(() => {
    return (domain as [number, number]) ?? fullDomain;
  }, [domain, fullDomain]);

  const displayData = useMemo(() => {
    const [from, to] = xDomain;
    if (from === undefined || to === undefined) return chartData;
    const filtered = chartData.filter(
      (d) => (d as any).x >= from && (d as any).x <= to,
    );
    return filtered.length > 1 ? filtered : chartData;
  }, [chartData, xDomain]);

  return (
    <ChartContainer
      config={{
        gap: {
          label: 'GAP',
        },
      }}
      className="h-[100px] w-full"
      onDoubleClick={() => reset()}
    >
      <LineChart
        data={chartData}
        syncId="event"
        syncMethod="value"
        onMouseDown={(e: any) => {
          if (e && typeof e.activeLabel === 'number') {
            setRefAreaStart(e.activeLabel);
            setRefAreaEnd(undefined);
          }
        }}
        onMouseMove={(e: any) => {
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
            Math.min(...displayData.map((d) => d.gap), minVal),
            Math.max(...displayData.map((d) => d.gap), maxVal),
          ]}
          hide
        />
        <Line
          type="monotone"
          dataKey="gap"
          stroke="var(--chart-4)"
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
                    {formatSpeed(Number(value), 'min/km')}
                    <span className="font-normal text-muted-foreground">
                      / km
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
