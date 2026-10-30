import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { StatisticsGranularity } from '@openathlete/shared';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { bucketLabel, bucketTick } from './stat-chart-format';

/** Fits the values: a flat line stays in the middle, not on the axis */
function paddedDomain([min, max]: readonly [number, number]): [number, number] {
  // A minimum span: near equal values would all print the same tick
  const padding = Math.max((max - min) * 0.15, max * 0.1) || 1;
  return [Math.max(0, min - padding), max + padding];
}

export interface StatPoint {
  period: string;
  value: number | null;
  /** The same bucket of the compared period */
  compared?: number | null;
  partial: boolean;
}

interface P {
  data: StatPoint[];
  granularity: StatisticsGranularity;
  label: string;
  /** Name of the dashed line, when there is one */
  comparedLabel?: string;
  formatValue: (value: number) => string;
  /** With its unit, for the tooltip */
  formatTooltip?: (value: number) => string;
  color?: string;
}

/**
 * One figure over time. Points are joined by straight lines: a curve would
 * invent values between them. Partial buckets are hollow, as they compare
 * badly with full ones. Charts of a page follow the same cursor.
 */
export function StatChart({
  data,
  granularity,
  label,
  comparedLabel,
  formatValue,
  formatTooltip = formatValue,
  color = 'var(--chart-1)',
}: P) {
  const locale = getDateFnsLocale(getLocale());
  return (
    <ChartContainer
      config={{ value: { label, color } }}
      className="h-[200px] w-full"
    >
      <LineChart
        data={data}
        syncId="statistics"
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="period"
          tickFormatter={(period: string) =>
            bucketTick(period, granularity, locale)
          }
          tick={{ fontSize: 11 }}
          minTickGap={24}
        />
        <YAxis
          width={48}
          tick={{ fontSize: 11 }}
          tickFormatter={formatValue}
          domain={paddedDomain}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as StatPoint | undefined;
                if (!point) return '';
                const text = bucketLabel(point.period, granularity, locale);
                return point.partial
                  ? `${text} (${m.statistics_partial_period()})`
                  : text;
              }}
              formatter={(value, name) => (
                <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                  {name === 'compared' ? comparedLabel : label}
                  <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                    {formatTooltip(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        {comparedLabel && (
          <Line
            type="linear"
            dataKey="compared"
            stroke="var(--muted-foreground)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            connectNulls
            dot={false}
            isAnimationActive={false}
          />
        )}
        <Line
          type="linear"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          connectNulls
          isAnimationActive={false}
          dot={(props: {
            cx?: number;
            cy?: number;
            index?: number;
            payload?: StatPoint;
          }) => (
            <circle
              key={props.index}
              cx={props.cx}
              cy={props.cy}
              r={props.payload?.value === null ? 0 : 3}
              stroke={color}
              strokeWidth={1.5}
              fill={props.payload?.partial ? 'var(--background)' : color}
            />
          )}
        />
      </LineChart>
    </ChartContainer>
  );
}
