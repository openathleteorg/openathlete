import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { SPORT_TYPE } from '@openathlete/shared';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';
import {
  CurveSeries,
  RecordMetric,
  curveData,
  formatRecordPosition,
} from './record-metrics';

export type LabelledSeries = CurveSeries & { label: string; color: string };

interface P {
  metric: RecordMetric;
  sport: SPORT_TYPE;
  series: LabelledSeries[];
  className?: string;
  /** Called with the distance or duration chosen on the chart */
  onSelect?: (position: number) => void;
}

/**
 * Padded range of the plotted values. Steady efforts give nearly equal
 * values: without a minimum span, every tick shows the same pace.
 */
function valueDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.1, Math.abs(max) * 0.05);
  return [Math.max(0, min - padding), max + padding];
}

/** One record type along distance or duration, one line per series. */
export function RecordsCurveChart({
  metric,
  sport,
  series,
  className,
  onSelect,
}: P) {
  // A period without any record of this kind has nothing to draw
  const drawn = series.filter((s) =>
    s.records.some((record) => record.type === metric.type),
  );
  const data = curveData(metric, drawn, sport);
  if (data.length === 0) return null;
  const positions = data.map((point) => point.position);
  const values = data.flatMap((point) =>
    drawn.map((s) => point[s.key]).filter((v): v is number => v !== null),
  );
  const unit = metric.unit(sport);

  return (
    <ChartContainer
      config={Object.fromEntries(
        drawn.map((s) => [s.key, { label: s.label, color: s.color }]),
      )}
      className={className ?? 'h-[260px] w-full'}
    >
      <LineChart
        data={data}
        margin={{ left: 8, right: 16, top: 8 }}
        onClick={(chart) => {
          const position = Number(chart?.activeLabel);
          if (onSelect && Number.isFinite(position)) onSelect(position);
        }}
        className={onSelect ? 'cursor-pointer' : undefined}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="position"
          type="number"
          scale="log"
          domain={[Math.min(...positions), Math.max(...positions)]}
          ticks={positions}
          interval="preserveStartEnd"
          minTickGap={8}
          tick={{ fontSize: 11 }}
          tickFormatter={(position: number) =>
            formatRecordPosition(metric, position)
          }
        />
        <YAxis
          width={56}
          tick={{ fontSize: 11 }}
          domain={valueDomain(values)}
          tickFormatter={(value: number) => metric.format(value, sport)}
          label={{
            value: unit,
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: 11, textAnchor: 'middle' },
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const position = payload?.[0]?.payload?.position;
                return typeof position === 'number'
                  ? formatRecordPosition(metric, position)
                  : '';
              }}
              formatter={(value, name) => (
                <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                  {drawn.find((s) => s.key === name)?.label}
                  <span className="ml-auto font-medium tabular-nums text-foreground">
                    {metric.format(Number(value), sport)} {unit}
                  </span>
                </div>
              )}
            />
          }
        />
        {drawn.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {drawn.map((s, index) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={s.color}
            strokeWidth={index === 0 ? 2.5 : 1.5}
            strokeDasharray={index === 0 ? undefined : '4 3'}
            dot={{ r: index === 0 ? 3 : 2 }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
