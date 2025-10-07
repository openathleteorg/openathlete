import { useTrainingZones } from '@/hooks/use-training-zones';
import { m } from '@/paraglide/messages';
import { Fragment, useMemo } from 'react';
import { Line, LineChart, YAxis } from 'recharts';

import {
  ActivityStream,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
} from '@openathlete/shared';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  heartrateStream: Exclude<ActivityStream['heartrate'], undefined>;
  sport?: SPORT_TYPE;
  timeStream?: Exclude<ActivityStream['time'], undefined>;
  onHover?: (hover?: { index: number; time: number }) => void;
}

export function HeartrateChart({
  heartrateStream,
  sport,
  timeStream,
  onHover,
}: P) {
  const trainingZones = useTrainingZones(TRAINING_ZONE_TYPE.HEARTRATE, sport);

  const chartData = useMemo(() => {
    return heartrateStream.map((heartrate, i) => ({
      heartrate,
      time: timeStream ? timeStream[i] : i,
    }));
  }, [heartrateStream, timeStream]);

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
    >
      <LineChart
        data={chartData}
        syncId="event"
        onMouseMove={(s: any) => {
          const index = s?.activeTooltipIndex;
          if (
            typeof index === 'number' &&
            index >= 0 &&
            index < chartData.length
          ) {
            const t = chartData[index].time as number;
            onHover?.({ index, time: t });
          }
        }}
        onMouseLeave={() => onHover?.(undefined)}
      >
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
        />
        <ChartTooltip content={<ChartTooltipContent />} />
      </LineChart>
    </ChartContainer>
  );
}
