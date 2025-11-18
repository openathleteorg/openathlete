import { useTrainingZones } from '@/hooks/use-training-zones';
import { m } from '@/paraglide/messages';
import { Fragment, useMemo, useState } from 'react';
import { Line, LineChart, ReferenceArea, XAxis, YAxis } from 'recharts';
import { CategoricalChartFunc } from 'recharts/types/chart/generateCategoricalChart';

import {
  ActivityStream,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
} from '@openathlete/shared';

import { useActivityDetailsSelection } from '../event-details/activity-details-selection-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  heartrateStream: Exclude<ActivityStream['heartrate'], undefined>;
  sport?: SPORT_TYPE;
  timeStream?: Exclude<ActivityStream['time'], undefined>;
  distanceStream?: Exclude<ActivityStream['distance'], undefined>;
  onHover?: (hover?: { index: number; time: number }) => void;
}

export function HeartrateChart({
  heartrateStream,
  sport,
  timeStream,
  distanceStream,
  onHover,
}: P) {
  const { domain, setDomain, reset, fullDomain } =
    useActivityDetailsSelection();
  const [refAreaStart, setRefAreaStart] = useState<number | undefined>();
  const [refAreaEnd, setRefAreaEnd] = useState<number | undefined>();
  const trainingZones = useTrainingZones(TRAINING_ZONE_TYPE.HEARTRATE, sport);

  const chartData = useMemo(() => {
    return heartrateStream.map((heartrate, i) => ({
      heartrate,
      time: timeStream ? timeStream[i] : i,
      x: distanceStream ? distanceStream[i] : timeStream ? timeStream[i] : i,
    }));
  }, [heartrateStream, timeStream, distanceStream]);

  const minHeartrate = useMemo(
    () => Math.min(...heartrateStream),
    [heartrateStream],
  );
  const maxHeartrate = useMemo(
    () => Math.max(...heartrateStream),
    [heartrateStream],
  );
  const heartrateRange = maxHeartrate - minHeartrate;
  const percentagesHeartrate = trainingZones
    ?.map((zone) => ({
      min: (zone.min - minHeartrate) / heartrateRange,
      max: (zone.max - minHeartrate) / heartrateRange,
      color: zone.color,
    }))
    .filter((zone) => zone.min < 1 && zone.max > 0)
    .map((zone) => ({
      ...zone,
      min: 1 - (zone.min < 0 ? 0 : zone.min),
      max: 1 - (zone.max > 1 ? 1 : zone.max),
    }))
    .reverse();

  return (
    <ChartContainer
      config={{
        heartrate: {
          label: m.heart_rate(),
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
          domain={(domain as [number, number]) ?? fullDomain}
          allowDataOverflow
          hide
        />
        <YAxis type="number" domain={[minHeartrate, maxHeartrate]} hide />
        <defs>
          <linearGradient id="colorUv" y1="0%" x1="0" y2="100%" x2="0">
            {percentagesHeartrate.map((zone, i) => (
              <Fragment key={i}>
                <stop offset={zone.max} stopColor={zone.color} />
                <stop offset={zone.min} stopColor={zone.color} />
              </Fragment>
            ))}
          </linearGradient>
        </defs>
        <Line
          type="monotone"
          dataKey="heartrate"
          stroke="url(#colorUv)"
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
