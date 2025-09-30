import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RacePlanVisualizationExport } from '@openathlete/shared';

interface P {
  plan: RacePlanVisualizationExport;
}

// Shows when it's day vs night across the race time. X axis is elapsed time (hours).
export function DayNightTimeline({ plan }: P) {
  const weather = plan.weather?.perKm ?? [];
  const series = useMemo(() => {
    if (!weather.length)
      return { data: [], ranges: [] as Array<{ x0: number; x1: number }> };
    const data = weather
      .map((w) => ({
        t: (w.timeSec || 0) / 3600,
        d: w.km,
        isDay: w.isDay === true ? 1 : 0,
      }))
      .sort((a, b) => a.t - b.t);
    // Build contiguous night ranges (isDay===0)
    const ranges: Array<{ x0: number; x1: number }> = [];
    let cur: { x0: number; x1: number } | null = null;
    for (const p of data) {
      const night = p.isDay === 0;
      if (night && !cur) cur = { x0: p.t, x1: p.t };
      if (night && cur) cur.x1 = p.t;
      if (!night && cur) {
        // close
        ranges.push({ x0: cur.x0, x1: cur.x1 });
        cur = null;
      }
    }
    if (cur) ranges.push(cur);
    return { data, ranges };
  }, [weather]);

  if (!series.data.length) return null;

  const totalHours = Math.max(...series.data.map((d) => d.t));

  return (
    <div className="w-full h-32 rounded-xl shadow-sm border p-4 bg-background">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={series.data}
          margin={{ top: 4, left: 0, right: 0, bottom: 0 }}
        >
          {series.ranges.map((r, i) => (
            <ReferenceArea
              key={i}
              x1={r.x0}
              x2={r.x1}
              fill="currentColor"
              fillOpacity={0.1}
            />
          ))}
          <XAxis
            dataKey="t"
            domain={[0, Math.ceil(totalHours)]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            unit="h"
            type="number"
          />
          <YAxis
            domain={[0, 1]}
            width={30}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => (v >= 0.5 ? 'Jour' : 'Nuit')}
          />
          <Tooltip
            labelFormatter={(l) => `${Number(l).toFixed(1)} h`}
            formatter={(v: any) => (v >= 0.5 ? 'Jour' : 'Nuit')}
          />
          <Area
            type="stepAfter"
            dataKey="isDay"
            stroke="transparent"
            fill="transparent"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
