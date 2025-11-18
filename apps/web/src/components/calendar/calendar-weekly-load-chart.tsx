import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

import { CalendarWeekLoadSummary } from '@openathlete/shared';

import { getWeekEnd, getWeekKey, getWeekStart } from './utils/week';

interface CalendarWeeklyLoadChartProps {
  weeks: Date[][];
  displayedMonth: Date;
  weeklyLoadSummary: Record<string, CalendarWeekLoadSummary>;
  isLoading: boolean;
}

interface ChartWeekRow {
  weekKey: string;
  weekLabel: string;
  recommendedMin: number;
  recommendedMax: number;
  zoneSpan: number;
  totalLoad: number;
}

export function CalendarWeeklyLoadChart({
  weeks,
  displayedMonth,
  weeklyLoadSummary,
  isLoading,
}: CalendarWeeklyLoadChartProps) {
  const targetMonth = displayedMonth.getMonth();
  const targetYear = displayedMonth.getFullYear();

  const chartData = useMemo<ChartWeekRow[]>(() => {
    if (!weeks?.length) {
      return [];
    }

    const seen = new Set<string>();

    return weeks
      .filter((week) =>
        week.some(
          (day) =>
            day.getMonth() === targetMonth && day.getFullYear() === targetYear,
        ),
      )
      .map((week) => {
        const weekStart = getWeekStart(week[0]);
        const key = getWeekKey(weekStart);

        if (seen.has(key)) {
          return null;
        }
        seen.add(key);

        const summary = weeklyLoadSummary[key];
        const recommendedMin = summary?.recommendedMin ?? 0;
        const recommendedMax = Math.max(
          recommendedMin,
          summary?.recommendedMax ?? recommendedMin,
        );
        const totalLoad =
          summary?.totalLoad ??
          summary?.actualLoad ??
          summary?.estimatedLoad ??
          0;

        const weekEnd = getWeekEnd(weekStart);
        const label = `${format(weekStart, 'dd MMM', { locale: fr })} → ${format(
          weekEnd,
          'dd MMM',
          { locale: fr },
        )}`;

        return {
          weekKey: key,
          weekLabel: label,
          recommendedMin,
          recommendedMax,
          zoneSpan: Math.max(0, recommendedMax - recommendedMin),
          totalLoad,
        };
      })
      .filter((week): week is ChartWeekRow => Boolean(week));
  }, [weeks, weeklyLoadSummary, targetMonth, targetYear]);

  if (!weeks?.length) {
    return null;
  }

  const showSkeleton = isLoading && chartData.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.weekly_zone_chart_title()}</CardTitle>
        <CardDescription>{m.weekly_zone_chart_description()}</CardDescription>
      </CardHeader>
      <CardContent>
        {showSkeleton ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.weekly_zone_chart_empty()}
          </p>
        ) : (
          <ChartContainer
            className="h-[280px] w-full"
            config={{
              totalLoad: {
                label: m.weekly_load(),
                color: 'hsl(var(--primary))',
              },
              zoneSpan: {
                label: m.recommended_zone_range(),
                color: 'hsl(var(--muted-foreground))',
              },
            }}
          >
            <ComposedChart data={chartData} margin={{ left: 4, right: 16 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 12 }}
                interval={0}
                height={50}
              />
              <YAxis tick={{ fontSize: 12 }} width={50} allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      if (!payload?.length) {
                        return '';
                      }
                      const datum = payload[0]?.payload as
                        | ChartWeekRow
                        | undefined;
                      if (!datum) {
                        return '';
                      }
                      const min = Math.round(datum.recommendedMin);
                      const max = Math.round(datum.recommendedMax);
                      return `${datum.weekLabel} · ${m.recommended_zone_range()} ${min} - ${max}`;
                    }}
                    formatter={(value, name) => {
                      if (name === 'zoneSpan') {
                        return null;
                      }
                      if (name === 'totalLoad') {
                        return [
                          `${(value as number).toFixed(0)}`,
                          <span className="text-primary">
                            {m.weekly_load()}
                          </span>,
                        ];
                      }
                      return null;
                    }}
                  />
                }
              />
              <Area
                type="linear"
                dataKey="recommendedMin"
                stackId="zone"
                stroke="none"
                fill="transparent"
                isAnimationActive={false}
              />
              <Area
                type="linear"
                dataKey="zoneSpan"
                stackId="zone"
                stroke="none"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.1}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="totalLoad"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="totalLoad"
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
