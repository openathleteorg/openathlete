import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export interface QuantilePoint {
  x: number;
  low: number;
  median: number;
  high: number;
  /** Activities behind the point, when they are counted */
  count?: number;
  /** A second reading of the same point, drawn on top */
  other?: number | null;
}

interface P {
  points: QuantilePoint[];
  label: string;
  otherLabel?: string;
  /** Dots rather than a dashed line: single facts, not a period */
  otherAsDots?: boolean;
  /** For distances: short ones would otherwise be crushed */
  logX?: boolean;
  formatX: (x: number) => string;
  formatY: (y: number) => string;
  color?: string;
  height?: string;
}

/**
 * A median and the middle half around it. The line joins real points, without
 * smoothing: a curve would invent bumps between the bands.
 */
export function QuantileChart({
  points,
  label,
  otherLabel,
  otherAsDots,
  logX,
  formatX,
  formatY,
  color = 'var(--chart-1)',
  height = 'h-[280px]',
}: P) {
  const data = points.map((point) => ({
    ...point,
    band: [point.low, point.high],
  }));
  return (
    <ChartContainer
      config={{ median: { label, color } }}
      className={`${height} w-full`}
    >
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="x"
          type="number"
          scale={logX ? 'log' : 'linear'}
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatX}
          tick={{ fontSize: 11 }}
          ticks={logX ? points.map(({ x }) => x) : undefined}
          minTickGap={24}
        />
        <YAxis
          width={48}
          domain={['auto', 'auto']}
          tick={{ fontSize: 11 }}
          tickFormatter={formatY}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) => {
                const x = payload?.[0]?.payload?.x;
                return typeof x === 'number' ? formatX(x) : '';
              }}
              formatter={(value, name) =>
                name === 'band' ? null : (
                  <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                    {name === 'other' ? otherLabel : label}
                    <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                      {formatY(Number(value))}
                    </span>
                  </div>
                )
              }
            />
          }
        />
        <Area
          dataKey="band"
          type="linear"
          stroke="none"
          fill={color}
          fillOpacity={0.15}
          isAnimationActive={false}
        />
        <Line
          dataKey="median"
          type="linear"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 2.5 }}
          isAnimationActive={false}
        />
        {otherLabel && (
          <Line
            dataKey="other"
            type="linear"
            stroke={otherAsDots ? 'none' : 'var(--muted-foreground)'}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            connectNulls
            dot={otherAsDots ? { r: 4, fill: 'var(--foreground)' } : false}
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
