import { m } from '@/paraglide/messages';
import { useMemo } from 'react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';

import type { GetEventWeatherResponseDto } from '@openathlete/shared';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  samples: GetEventWeatherResponseDto['samples'];
}

export function WeatherPrecipitationChart({ samples }: P) {
  const data = useMemo(
    () =>
      samples.map((s) => ({
        x: s.distM,
        precipitationMm: s.precipitationMm ?? s.rainMm ?? 0,
      })),
    [samples],
  );

  const xDomain: [number, number] = useMemo(() => {
    const min = data.length ? data[0].x : 0;
    const max = data.length ? data[data.length - 1].x : 0;
    return [min, max];
  }, [data]);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-muted-foreground">
        {m.precipitation() ?? 'Precipitation'}
      </div>
      <ChartContainer config={{}} className="h-[140px] w-full">
        <LineChart data={data} syncId="weather">
          <XAxis
            type="number"
            dataKey="x"
            domain={xDomain}
            allowDataOverflow
            tickFormatter={(v) => `${(v / 1000).toFixed(1)} km`}
          />
          <YAxis hide />
          <Line
            type="monotone"
            dataKey="precipitationMm"
            stroke="var(--chart-4)"
            dot={false}
            isAnimationActive={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="text-foreground font-mono tabular-nums">
                    {Number(value).toFixed(1)} mm
                  </span>
                )}
              />
            }
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
