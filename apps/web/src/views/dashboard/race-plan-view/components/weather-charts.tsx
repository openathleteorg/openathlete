import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RacePlanVisualizationExport } from '@openathlete/shared';

interface P {
  plan: RacePlanVisualizationExport;
}

function ChartShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-44 rounded-xl shadow-sm border p-4 bg-background">
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      {children}
    </div>
  );
}

export function WeatherCharts({ plan }: P) {
  const data = useMemo(() => {
    const perKm = plan.weather?.perKm ?? [];
    return perKm
      .map((w) => ({
        t: (w.timeSec || 0) / 3600,
        km: w.km,
        precip: w.precipitationMm ?? 0,
        rain: w.rainMm ?? 0,
        snow: (w.snowfallCm ?? 0) * 10, // cm -> mm for comparable scale
        humidity: w.humidityPct ?? null,
        cloud: w.cloudCoverPct ?? null,
        wind: w.windSpeed10mKmh ?? null,
        gust: w.windGusts10mKmh ?? null,
        app: w.apparentTemperatureC ?? null,
      }))
      .sort((a, b) => a.t - b.t);
  }, [plan.weather?.perKm]);

  if (!data.length) return null;

  const commonXAxis = (
    <XAxis
      dataKey="t"
      tickLine={false}
      axisLine={false}
      tick={{ fontSize: 10 }}
      unit="h"
      type="number"
    />
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartShell title="Précipitations (mm/h) & Neige (mm/h)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, left: 0, right: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {commonXAxis}
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              unit="mm"
            />
            <Tooltip labelFormatter={(l) => `${Number(l).toFixed(1)} h`} />
            <Area
              type="monotone"
              dataKey="precip"
              name="Précip."
              stroke="#3b82f6"
              fill="#93c5fd55"
            />
            <Area
              type="monotone"
              dataKey="snow"
              name="Neige"
              stroke="#64748b"
              fill="#cbd5e155"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Humidité (%) & Couverture nuageuse (%)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, left: 0, right: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {commonXAxis}
            <YAxis
              width={40}
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              unit="%"
            />
            <Tooltip labelFormatter={(l) => `${Number(l).toFixed(1)} h`} />
            <Area
              type="monotone"
              dataKey="humidity"
              name="Humidité"
              stroke="#10b981"
              fill="#34d39955"
            />
            <Area
              type="monotone"
              dataKey="cloud"
              name="Nuages"
              stroke="#6b7280"
              fill="#9ca3af55"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Vent (km/h) & Rafales (km/h)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, left: 0, right: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {commonXAxis}
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              unit="km/h"
            />
            <Tooltip labelFormatter={(l) => `${Number(l).toFixed(1)} h`} />
            <Area
              type="monotone"
              dataKey="wind"
              name="Vent"
              stroke="#0ea5e9"
              fill="#38bdf855"
            />
            <Area
              type="monotone"
              dataKey="gust"
              name="Rafales"
              stroke="#f97316"
              fill="#fdba7455"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Température ressentie (°C)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, left: 0, right: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {commonXAxis}
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              unit="°C"
            />
            <Tooltip labelFormatter={(l) => `${Number(l).toFixed(1)} h`} />
            <Area
              type="monotone"
              dataKey="app"
              name="Ressentie"
              stroke="#ef4444"
              fill="#fca5a555"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}
