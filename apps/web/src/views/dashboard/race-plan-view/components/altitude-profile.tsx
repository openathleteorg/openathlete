import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ReferenceDot,
  ReferenceLine,
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

  const stopsWithY = useMemo(() => {
    if (!plan.stops?.length || !data.length)
      return [] as { km: number; ele: number; name: string }[];
    // distances are increasing; find nearest index for each stop
    const findNearestEle = (km: number) => {
      let lo = 0,
        hi = data.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (data[mid].d < km) lo = mid + 1;
        else hi = mid;
      }
      const i = Math.max(0, Math.min(lo, data.length - 1));
      // choose closer between i and i-1
      const j = Math.max(0, i - 1);
      const di = Math.abs(data[i].d - km);
      const dj = Math.abs(data[j].d - km);
      return di <= dj ? data[i].ele : data[j].ele;
    };
    return plan.stops.map((s) => ({
      km: s.cumulativeDistanceKm,
      name: s.name,
      ele: findNearestEle(s.cumulativeDistanceKm),
    }));
  }, [plan.stops, data]);

  const startTime = useMemo(() => {
    const snap = plan.meta?.configSnapshot as any;
    const iso = (snap?.startTime || snap?.startDate) as string | undefined;
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [plan.meta]);

  // Build a helper to map distance (km) -> arrival date using segments timing
  const distanceToDate = useMemo(() => {
    if (!startTime) return null as ((km: number) => Date | null) | null;
    const segs = plan.segments
      .slice()
      .sort((a, b) => a.startDistanceKm - b.startDistanceKm);
    const legs = (plan.legs || [])
      .slice()
      .sort((a, b) => a.startDistanceKm - b.startDistanceKm);
    const legEnds = legs.map((l) => l.endDistanceKm);
    const stopPrefix: number[] = [];
    let acc = 0;
    for (let i = 0; i < legs.length; i++) {
      // prefix sum of stop times up to this leg index
      acc += legs[i].stopTimeSec || 0;
      stopPrefix[i] = acc;
    }

    const stopsBeforeKm = (km: number) => {
      // total stop time for all legs that ended strictly before this km
      let lo = 0,
        hi = legEnds.length - 1,
        last = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (legEnds[mid] < km) {
          last = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return last >= 0 ? stopPrefix[last] : 0;
    };

    return (km: number) => {
      if (!segs.length) return null;
      // Binary search for the segment containing this km
      let lo = 0,
        hi = segs.length - 1,
        idx = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const s = segs[mid];
        if (km < s.startDistanceKm) hi = mid - 1;
        else if (km > s.endDistanceKm) lo = mid + 1;
        else {
          idx = mid;
          break;
        }
        idx = lo;
      }
      const s = segs[Math.min(Math.max(idx, 0), segs.length - 1)];
      // Interpolate moving time within the segment
      const segLenKm = Math.max(1e-6, s.endDistanceKm - s.startDistanceKm);
      const ratio = Math.min(
        1,
        Math.max(0, (km - s.startDistanceKm) / segLenKm),
      );
      const startSec = s.startTimeSec ?? 0; // moving-only base
      const endSec = s.endTimeSec ?? startSec + s.durationSec;
      const movingSecAtKm = startSec + ratio * Math.max(0, endSec - startSec);
      const totalSec = movingSecAtKm + stopsBeforeKm(km);
      return new Date(startTime.getTime() + totalSec * 1000);
    };
  }, [plan.segments, plan.legs, startTime]);
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
            type="number"
            domain={[0, 'dataMax']}
            allowDataOverflow
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
          {/* Aid stations markers */}
          {stopsWithY.map((s) => (
            <ReferenceLine
              key={`stop-line-${s.km}`}
              x={s.km}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
            />
          ))}
          {stopsWithY.map((s) => (
            <ReferenceDot
              key={`stop-dot-${s.km}`}
              x={s.km}
              y={s.ele}
              r={3}
              fill="var(--chart-2)"
              stroke="var(--background)"
              strokeWidth={1}
            />
          ))}
          <Tooltip
            formatter={(v: any) => `${v.toFixed?.(0)} m`}
            labelFormatter={(l) => {
              const km = Number(l);
              const when = distanceToDate ? distanceToDate(km) : null;
              const h = when
                ? when.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—';
              return `${km.toFixed(1)} km · ${h}`;
            }}
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
