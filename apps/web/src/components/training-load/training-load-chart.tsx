import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as m from '@/paraglide/messages.js';
import {
  TrainingLoadCalculationType,
  useTrainingLoadHistory,
} from '@/services/training-load';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';

const CALCULATION_TYPE_LABELS: Record<TrainingLoadCalculationType, string> = {
  [TrainingLoadCalculationType.FOSTER_RPE]: 'Foster (RPE)',
  [TrainingLoadCalculationType.TRIMP_EDWARDS]: 'TRIMP Edwards',
  [TrainingLoadCalculationType.TRIMP_BANISTER]: 'TRIMP Banister',
};

const STORAGE_KEY = 'trainingLoadCalculationType';

interface TrainingLoadChartProps {
  startDate?: Date;
  endDate?: Date;
  defaultCalculationType?: TrainingLoadCalculationType;
}

export function TrainingLoadChart({
  startDate,
  endDate,
  defaultCalculationType = TrainingLoadCalculationType.FOSTER_RPE,
}: TrainingLoadChartProps) {
  // Load from localStorage or use default
  const [calculationType, setCalculationType] = useState<TrainingLoadCalculationType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && Object.values(TrainingLoadCalculationType).includes(stored as TrainingLoadCalculationType)) {
        return stored as TrainingLoadCalculationType;
      }
    }
    return defaultCalculationType;
  });

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, calculationType);
    }
  }, [calculationType]);

  // Default to last 12 weeks
  const defaultStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 84); // 12 weeks
    return date;
  }, []);

  const finalStartDate = startDate || defaultStartDate;
  const finalEndDate = endDate || new Date();

  const { data: history, isLoading } = useTrainingLoadHistory(
    calculationType,
    finalStartDate,
    finalEndDate,
  );

  const chartData = useMemo(() => {
    if (!history) return [];
    return history
      .filter((item) => {
        // Validate date
        return item.date instanceof Date && !isNaN(item.date.getTime());
      })
      .map((item) => ({
        date: item.date.getTime(),
        dateLabel: format(item.date, 'dd MMM', { locale: fr }),
        load: item.load,
        atl: item.atl,
        ctl: item.ctl,
        tsb: item.tsb,
      }));
  }, [history]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Historique de charge - ATL/CTL/TSB
        </CardTitle>
        <Select
          value={calculationType}
          onValueChange={(value) =>
            setCalculationType(value as TrainingLoadCalculationType)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CALCULATION_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-5))' }} />
                <span className="text-muted-foreground">{m.weekly_load()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                <span className="text-muted-foreground">{m.fitness_ctl()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                <span className="text-muted-foreground">{m.fatigue_atl()}</span>
              </div>
            </div>

            {/* Chart */}
            <ChartContainer
              config={{
                load: {
                  label: 'Charge',
                  color: 'hsl(var(--chart-5))',
                },
                ctl: {
                  label: 'CTL',
                  color: 'hsl(var(--chart-1))',
                },
                atl: {
                  label: 'ATL',
                  color: 'hsl(var(--chart-2))',
                },
                tsb: {
                  label: 'TSB',
                  color: 'hsl(var(--chart-3))',
                },
              }}
              className="h-[450px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>

                  <XAxis
                    dataKey="date"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => {
                      try {
                        const timestamp = typeof value === 'number' ? value : Number(value);
                        if (isNaN(timestamp)) return '';
                        return format(new Date(timestamp), 'dd MMM', { locale: fr });
                      } catch (error) {
                        console.error('Error formatting tick:', value, error);
                        return '';
                      }
                    }}
                    scale="time"
                    stroke="hsl(var(--border))"
                  />
                  <YAxis stroke="hsl(var(--border))" />
                  <ReferenceArea
                    y1={-100}
                    y2={-10}
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.08}
                    label={{
                      value: m.overtraining(),
                      position: 'insideTopLeft',
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11,
                      opacity: 0.6,
                    }}
                  />
                  <ReferenceArea
                    y1={-10}
                    y2={5}
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.08}
                    label={{
                      value: m.optimal_zone(),
                      position: 'insideTopLeft',
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11,
                      opacity: 0.6,
                    }}
                  />

                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          try {
                            const timestamp = typeof value === 'number' ? value : Number(value);
                            if (isNaN(timestamp)) return String(value);
                            return format(new Date(timestamp), 'dd MMMM yyyy', { locale: fr });
                          } catch (error) {
                            console.error('Error formatting date:', value, error);
                            return String(value);
                          }
                        }}
                        formatter={(value, name) => {
                          const label =
                            name === 'load'
                              ? m.load()
                              : name === 'ctl'
                                ? m.fitness_ctl()
                                : name === 'atl'
                                  ? m.fatigue_atl()
                                  : name === 'tsb'
                                    ? m.tsb_balance()
                                    : name;
                          return [
                            `${(value as number).toFixed(1)}`,
                            label as string,
                          ];
                        }}
                      />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="load"
                    stroke="none"
                    fill="#a855f7"
                    fillOpacity={0.2}
                    name="load"
                  />

                  <Line
                    type="monotone"
                    dataKey="ctl"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                    name="ctl"
                  />

                  <Line
                    type="monotone"
                    dataKey="atl"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                    name="atl"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucune donnée disponible pour cette période
          </div>
        )}
      </CardContent>
    </Card>
  );
}