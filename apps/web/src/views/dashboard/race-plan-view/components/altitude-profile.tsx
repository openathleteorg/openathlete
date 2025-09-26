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

export function AltitudeProfile({ plan }: P) {
  const data = useMemo(() => {
    return plan.points.map((p) => ({
      d: p.distanceFromStartM / 1000,
      ele: p.ele || 0,
    }));
  }, [plan.points]);
  return (
    <div className="w-full h-48 rounded-xl shadow-sm border p-4 bg-background">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, left: 0, right: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="eleFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
              <stop
                offset="95%"
                stopColor="var(--chart-1)"
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
            dataKey="ele"
            width={40}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            unit="m"
          />
          <Tooltip
            formatter={(v: any) => `${v.toFixed?.(0)} m`}
            labelFormatter={(l) => `${l.toFixed(1)} km`}
          />
          <Area
            type="monotone"
            dataKey="ele"
            stroke="var(--chart-1)"
            fill="url(#eleFill)"
            strokeWidth={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
