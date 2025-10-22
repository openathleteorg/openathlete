import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { m } from '@/paraglide/messages';
import { AthleteMetric, useGetMetricHistoryQuery } from '@/api/metric';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { cn } from '@/utils/shadcn';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import {
  METRIC_TYPE,
  metricUnitMap,
  metricsByCategory,
} from '@openathlete/shared';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface MetricChartProps {
  className?: string;
  initialType?: METRIC_TYPE;
  athleteId?: number;
}

export function MetricChart({
  className,
  initialType,
  athleteId,
}: MetricChartProps) {
  const [selectedType, setSelectedType] = useState<METRIC_TYPE>(
    initialType || METRIC_TYPE.WEIGHT,
  );

  const { data: history = [] } = useGetMetricHistoryQuery(
    selectedType,
    athleteId,
  );

  const chartData = useMemo(() => {
    return history.map((metric: AthleteMetric) => ({
      date: format(new Date(metric.date), 'dd/MM/yyyy'),
      value: metric.value,
      fullDate: new Date(metric.date),
      notes: metric.notes,
    }));
  }, [history]);

  const categoriesWithLabels = {
    [m.health_composition()]: metricsByCategory.health_composition,
    [m.cardiac()]: metricsByCategory.cardiac,
    [m.performance_physiology()]: metricsByCategory.performance_physiology,
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Select
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as METRIC_TYPE)}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder={m.select_metric_to_view()} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoriesWithLabels).map(
              ([category, types], idx) => (
                <div key={category}>
                  {idx > 0 && <div className="h-px bg-border my-1" />}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {metricTypeLabelMap[type]}
                    </SelectItem>
                  ))}
                </div>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {chartData.length > 0 ? (
        <ChartContainer
          config={{
            value: {
              label: metricTypeLabelMap[selectedType],
              color: 'hsl(var(--primary))',
            },
          }}
          className="h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickMargin={10}
                label={{
                  value: metricUnitMap[selectedType],
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <>
                        {value} {metricUnitMap[selectedType]}
                      </>
                    )}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{
                  r: 6,
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 8,
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">{m.no_data_for_metric()}</p>
        </div>
      )}
    </div>
  );
}
