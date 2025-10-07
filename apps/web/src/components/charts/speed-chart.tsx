import { m } from '@/paraglide/messages';
import { useMemo } from 'react';
import { Line, LineChart, YAxis } from 'recharts';

import { ActivityStream, formatSpeed } from '@openathlete/shared';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  latLngStream: Exclude<ActivityStream['latlng'], undefined>;
  timeStream?: Exclude<ActivityStream['time'], undefined>;
  onHover?: (hover?: { index: number; time: number }) => void;
}

export function SpeedChart({ latLngStream, timeStream, onHover }: P) {
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
      const timeDiff = timeStream ? timeStream[i] - timeStream[i - 1] : 1;
      const speed = distance / (timeDiff || 1);
      return {
        speed,
        time: time,
      };
    });

    const deSpiked = rawData.map((data, i) => {
      if (
        i > 0 &&
        i < rawData.length - 1 &&
        ((data.speed > rawData[i - 1].speed * 2 &&
          data.speed > rawData[i + 1].speed * 2) ||
          (data.speed < rawData[i - 1].speed / 2 &&
            data.speed < rawData[i + 1].speed / 2))
      ) {
        return {
          ...data,
          speed: (rawData[i - 1].speed + rawData[i + 1].speed) / 2,
        };
      }
      return data;
    });

    const ALPHA = 0.2;
    if (deSpiked.length === 0) return deSpiked;

    let prev = deSpiked[0].speed;
    const ema = deSpiked.map((d, i) => {
      const current = i === 0 ? d.speed : ALPHA * d.speed + (1 - ALPHA) * prev;
      prev = current;
      return { ...d, speed: current };
    });

    return ema;
  }, [latLngStream, timeStream]);

  const minSpeed = useMemo(
    () => Math.min(...chartData.map((data) => data.speed)),
    [chartData],
  );
  const maxSpeed = useMemo(
    () => Math.max(...chartData.map((data) => data.speed)),
    [chartData],
  );

  return (
    <ChartContainer
      config={{
        speed: {
          label: m.pace(),
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
        <YAxis type="number" domain={[minSpeed, maxSpeed]} hide />
        <Line
          type="monotone"
          dataKey="speed"
          stroke="var(--chart-1)"
          dot={false}
          strokeWidth={1}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex min-w-[130px] items-center text-xs text-muted-foreground gap-2">
                  {name}
                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {formatSpeed(Number(value), 'min/km')}
                    <span className="font-normal text-muted-foreground">
                      {m.per_km()}
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
