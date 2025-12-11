import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { ProgressionDataPoint } from '@openathlete/shared';

interface ProgressionChartProps {
  data: ProgressionDataPoint[];
  aggregationType: 'week' | 'month';
  title: string;
  dataKey: keyof ProgressionDataPoint;
  formatter: (value: number) => string;
  yAxisLabel?: string;
  className?: string;
  color?: string;
  yAxisFormatter?: (value: number) => string;
}

export function ProgressionChart({
  data,
  aggregationType,
  title,
  dataKey,
  formatter,
  yAxisLabel,
  className,
  color = 'var(--chart-1)',
  yAxisFormatter,
}: ProgressionChartProps) {
  const chartData = useMemo(() => {
    return data
      .map((point) => {
        const date = new Date(point.period);
        const label =
          aggregationType === 'week'
            ? format(date, 'dd/MM')
            : format(date, 'MMM yyyy');
        const value = point[dataKey];
        return {
          ...point,
          label,
          value: typeof value === 'number' ? value : null,
        };
      })
      .filter((d) => d.value !== null);
  }, [data, aggregationType, dataKey]);

  const gradientId = useMemo(
    () => `gradient-${dataKey}-${String(dataKey)}`,
    [dataKey],
  );

  // Get computed color value from CSS variable for SVG
  const [computedColor, setComputedColor] = useState<string>(color);
  const colorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (colorRef.current && color.startsWith('var(--')) {
      const varName = color.replace('var(', '').replace(')', '');
      const computed = getComputedStyle(colorRef.current).getPropertyValue(
        varName,
      );
      if (computed) {
        setComputedColor(computed.trim());
      }
    } else {
      setComputedColor(color);
    }
  }, [color]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <>
      <div ref={colorRef} className="hidden" style={{ color }} />
      <ChartContainer
        config={{
          value: {
            label: title,
            color,
          },
        }}
        className={`h-[300px] w-full ${className || ''}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={computedColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={computedColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              angle={aggregationType === 'month' ? -45 : 0}
              textAnchor={aggregationType === 'month' ? 'end' : 'middle'}
              height={aggregationType === 'month' ? 60 : 30}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickMargin={10}
              tickFormatter={yAxisFormatter}
              label={
                yAxisLabel
                  ? {
                      value: yAxisLabel,
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 },
                    }
                  : undefined
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <>{typeof value === 'number' ? formatter(value) : value}</>
                  )}
                  labelFormatter={(label) => (
                    <div className="font-semibold">{label}</div>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={computedColor}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
              dot={{ r: 4, fill: computedColor }}
              activeDot={{ r: 6, fill: computedColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </>
  );
}
