import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { getMetricUnit } from '@/utils/metric-unit';
import { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  XAxis,
  YAxis,
} from 'recharts';

import { METRIC_TYPE } from '@openathlete/shared';

import {
  MetricAnalysis,
  formatMetricValue,
  hasOwnUnit,
  metricDayNumber,
} from './metric-stats';
import { useMetricDateLabel } from './metric-utils';

/** Round axis steps. An axis from 0 would flatten every change that matters. */
function roundTicks(low: number, high: number) {
  const span = high - low || Math.abs(high) * 0.1 || 1;
  const magnitude = 10 ** Math.floor(Math.log10(span / 4));
  const step =
    [1, 2, 5, 10]
      .map((factor) => factor * magnitude)
      .find((candidate) => candidate >= span / 4) ?? magnitude;
  const first = Math.floor(low / step);
  const last = Math.max(Math.ceil(high / step), first + 1);
  return Array.from({ length: last - first + 1 }, (_, index) =>
    Number(((first + index) * step).toFixed(2)),
  );
}

interface ChartRow {
  dayNumber: number;
  day: string;
  value: number;
  trend: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: ChartRow }[];
  type: METRIC_TYPE;
  dateLabel: (day: string) => string;
}

function MetricTooltip({ active, payload, type, dateLabel }: TooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs tabular-nums shadow-sm">
      <span className="font-semibold">
        {formatMetricValue(type, row.value)}
        {!hasOwnUnit(type) && ` ${getMetricUnit(type)}`}
      </span>
      <span className="text-muted-foreground"> · {dateLabel(row.day)}</span>
    </div>
  );
}

interface P {
  type: METRIC_TYPE;
  analysis: MetricAnalysis;
  /** Days shown, counted back from the last value */
  days: number;
}

export function MetricChart({ type, analysis, days }: P) {
  const dateLabel = useMetricDateLabel();
  const { points, trend, baseline, last } = analysis;

  const { rows, first, end } = useMemo(() => {
    const end = last ? metricDayNumber(last.day) : 0;
    const first = end - days + 1;
    const rows: ChartRow[] = points
      .map((point, index) => ({
        day: point.day,
        dayNumber: metricDayNumber(point.day),
        value: point.value,
        trend: trend[index].value,
      }))
      .filter((row) => row.dayNumber >= first);
    return { rows, first, end };
  }, [points, trend, last, days]);

  const ticks = useMemo(() => {
    const values = rows.map((row) => row.value);
    if (baseline) values.push(baseline.low, baseline.high);
    return roundTicks(Math.min(...values), Math.max(...values));
  }, [rows, baseline]);

  return (
    <ChartContainer
      config={{ value: { label: metricTypeLabelMap[type] } }}
      className="h-[260px] w-full"
      role="img"
      aria-label={m.metrics_chart_label({
        metric: metricTypeLabelMap[type],
      })}
    >
      <ComposedChart
        data={rows}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="dayNumber"
          type="number"
          domain={[first, end]}
          tickFormatter={(dayNumber: number) =>
            dateLabel(
              new Date(dayNumber * 86_400_000).toISOString().slice(0, 10),
            )
          }
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={48}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
        />
        <YAxis
          type="number"
          domain={[ticks[0], ticks[ticks.length - 1]]}
          ticks={ticks}
          tickFormatter={(value: number) => String(value)}
          tickLine={false}
          axisLine={false}
          width={40}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
        />
        {baseline && (
          <ReferenceArea
            y1={baseline.low}
            y2={baseline.high}
            fill="var(--chart-2)"
            fillOpacity={0.12}
            stroke="none"
            ifOverflow="extendDomain"
          />
        )}
        <ChartTooltip
          cursor={{ stroke: 'var(--border)' }}
          content={<MetricTooltip type={type} dateLabel={dateLabel} />}
        />
        <Line
          dataKey="value"
          stroke={baseline ? 'none' : 'var(--chart-2)'}
          strokeWidth={2}
          dot={{
            r: baseline ? 2 : 3.5,
            fill: 'var(--chart-2)',
            fillOpacity: baseline ? 0.4 : 1,
            stroke: 'none',
          }}
          activeDot={{ r: 5, fill: 'var(--chart-2)', stroke: 'none' }}
          isAnimationActive={false}
        />
        {baseline && (
          <Line
            dataKey="trend"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
