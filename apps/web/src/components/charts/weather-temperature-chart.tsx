import { m } from '@/paraglide/messages';
import { despikeAndEma } from '@/utils/despike';
import { useMemo } from 'react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';

import type { GetEventWeatherResponseDto } from '@openathlete/shared';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  samples: GetEventWeatherResponseDto['samples'];
  deviceDistance?: number[];
  deviceTemp?: number[];
}

export function WeatherTemperatureChart({
  samples,
  deviceDistance,
  deviceTemp,
}: P) {
  // Build interpolation function to align device temp on provider distances
  const interpDevice = useMemo(() => {
    if (!deviceDistance?.length || !deviceTemp?.length)
      return undefined as ((x: number) => number | undefined) | undefined;
    const xs = deviceDistance;
    const ys = deviceTemp;
    return (x: number) => {
      if (!Number.isFinite(x)) return undefined;
      let lo = 0;
      let hi = xs.length - 1;
      if (x <= xs[0]) return ys[0];
      if (x >= xs[hi]) return ys[hi];
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (xs[mid] <= x) lo = mid;
        else hi = mid;
      }
      const x0 = xs[lo],
        x1 = xs[hi];
      const y0 = ys[lo],
        y1 = ys[hi];
      if (x1 === x0) return y1;
      const r = (x - x0) / (x1 - x0);
      return y0 + r * (y1 - y0);
    };
  }, [deviceDistance, deviceTemp]);

  const chartData = useMemo(() => {
    const base = samples.map((s) => ({
      x: s.distM,
      provider: s.temperatureC ?? null,
    }));
    const withDevice = base.map((row) => ({
      ...row,
      device: interpDevice ? (interpDevice(row.x) ?? null) : null,
    }));
    // Smooth device values to reduce noise
    const devVals = withDevice.map((d) => d.device ?? NaN);
    const smoothed = despikeAndEma(devVals, { alpha: 0.2 });
    return withDevice.map((d, i) => ({
      ...d,
      device: Number.isFinite(smoothed[i]) ? smoothed[i] : d.device,
    }));
  }, [samples, interpDevice]);

  const xDomain: [number, number] = useMemo(() => {
    const min = chartData.length ? chartData[0].x : 0;
    const max = chartData.length ? chartData[chartData.length - 1].x : 0;
    return [min, max];
  }, [chartData]);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-muted-foreground">
        {m.temperature()}
      </div>
      <ChartContainer
        config={{
          provider: { label: 'Open‑Meteo' },
          device: { label: m.device() },
        }}
        className="h-[160px] w-full"
      >
        <LineChart data={chartData} syncId="weather">
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
            dataKey="provider"
            stroke="var(--chart-1)"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="device"
            stroke="var(--chart-5)"
            dot={false}
            isAnimationActive={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="text-foreground font-mono tabular-nums">
                    {Number(value).toFixed(1)} °C
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
