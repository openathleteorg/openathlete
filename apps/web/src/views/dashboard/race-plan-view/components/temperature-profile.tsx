import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RacePlanVisualizationExport } from '@openathlete/shared';

interface P {
  plan: RacePlanVisualizationExport;
}

// Displays temperature (°C) along the course distance.
// Prefer per‑km weather samples if present; otherwise fallback to segment-level temperatures.
export function TemperatureProfile({ plan }: P) {
  const { data, min, max, step } = useMemo(() => {
    // Try per‑km weather first
    const w = plan.weather?.perKm ?? [];
    if (w.length) {
      const pts = w
        .filter((s) => typeof s.temperatureC === 'number')
        .map((s) => ({ d: s.km, t: s.temperatureC as number }))
        .sort((a, b) => a.d - b.d);
      if (pts.length) {
        const tMin = Math.min(...pts.map((p) => p.t));
        const tMax = Math.max(...pts.map((p) => p.t));
        return {
          data: pts,
          min: Math.floor(tMin),
          max: Math.ceil(tMax),
          step: 'monotone' as const,
        };
      }
    }
    // Fallback to segment-level temps as steps
    const points: { d: number; t: number }[] = [];
    let tMin = Number.POSITIVE_INFINITY;
    let tMax = Number.NEGATIVE_INFINITY;
    const segments = [...plan.segments]
      .filter((s) => s.temperatureC != null)
      .sort((a, b) => a.startDistanceKm - b.startDistanceKm);
    for (const s of segments) {
      const t = s.temperatureC as number;
      points.push({ d: s.startDistanceKm, t });
      points.push({ d: s.endDistanceKm, t });
      if (t < tMin) tMin = t;
      if (t > tMax) tMax = t;
    }
    if (!points.length)
      return { data: [], min: 0, max: 0, step: 'monotone' as const };
    return {
      data: points,
      min: Math.floor(tMin),
      max: Math.ceil(tMax),
      step: 'stepAfter' as const,
    };
  }, [plan.segments, plan.weather?.perKm]);

  if (!data.length) return null;

  return (
    <div className="w-full h-40 rounded-xl shadow-sm border p-4 bg-background">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, left: 0, right: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
              <stop
                offset="95%"
                stopColor="var(--chart-2)"
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="d"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            unit="km"
          />
          <YAxis
            domain={[min, max]}
            width={40}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            unit="°C"
          />
          <Tooltip
            formatter={(v: any) => `${v.toFixed?.(1)} °C`}
            labelFormatter={(l) => `${l.toFixed(1)} km`}
          />
          <Area
            type={step}
            dataKey="t"
            stroke="var(--chart-2)"
            fill="url(#tempFill)"
            strokeWidth={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
