import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import {
  TSB_DETRAINING,
  TSB_OVERREACHING,
  formStatusLabel,
  formatForm,
  getFormStatus,
} from '@/utils/training-form';
import { format } from 'date-fns';
import { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

import { CalendarWeekLoadSummary } from '@openathlete/shared';

import { getWeekKey } from './utils/week';

interface CalendarWeeklyLoadChartProps {
  weeks: Date[][];
  displayedMonth: Date;
  weeklyLoadSummary: Record<string, CalendarWeekLoadSummary>;
  isLoading: boolean;
  hasScheduledActivities: boolean;
}

interface ChartWeekRow {
  weekKey: string;
  weekLabel: string;
  rangeLabel: string;
  actual: number;
  estimated: number;
  recommendedMin: number;
  recommendedMax: number;
  zoneSpan: number;
  tsb?: number;
  /** TSB of the weeks over, drawn solid */
  tsbPast?: number;
  /** TSB of the weeks to come, drawn dashed from the last week over */
  tsbProjected?: number;
  projected: boolean;
}

const COLORS = {
  load: 'var(--chart-1)',
  tsb: 'var(--chart-3)',
  zone: '#22c55e',
};

const TSB_ZONES = [
  { key: 'overtraining', color: '#ef4444' },
  { key: 'optimal', color: '#22c55e' },
  { key: 'detraining', color: '#3b82f6' },
] as const;

const loadFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});
const formatLoad = (value: number) => loadFormatter.format(Math.round(value));

function Legend({
  items,
}: {
  items: { key: string; label: string; swatch: React.ReactNode }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          {item.swatch}
          <span className="text-muted-foreground">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

const square = (color: string, opacity = 1) => (
  <span
    aria-hidden
    className="size-2.5 shrink-0 rounded-sm"
    style={{ backgroundColor: color, opacity }}
  />
);

const stroke = (color: string, dashed = false) => (
  <span
    aria-hidden
    className="w-4 shrink-0 border-t-2"
    style={{ borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }}
  />
);

/** One tooltip for both charts: the whole week at a glance */
function WeekTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  const week = payload?.[0]?.payload as ChartWeekRow | undefined;
  if (!active || !week) return null;
  return (
    <div className="grid min-w-48 gap-1 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{week.rangeLabel}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{m.done()}</span>
        <span className="font-mono tabular-nums">
          {formatLoad(week.actual)}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">
          {m.calendar_chart_still_planned()}
        </span>
        <span className="font-mono tabular-nums">
          {formatLoad(week.estimated)}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">
          {m.recommended_zone_range()}
        </span>
        <span className="font-mono tabular-nums">
          {formatLoad(week.recommendedMin)}–{formatLoad(week.recommendedMax)}
        </span>
      </div>
      {week.tsb !== undefined && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">
            {week.projected ? m.calendar_chart_tsb_projected() : 'TSB'}
          </span>
          <span className="font-mono tabular-nums">
            {formatForm(week.tsb)} ·{' '}
            {formStatusLabel[getFormStatus(week.tsb)]()}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Load done and still planned each week of the month, against the
 * recommended range, then the form (TSB) at the end of each week, projected
 * for the weeks to come. Two charts on one time axis rather than two scales
 * on one chart.
 */
export function CalendarWeeklyLoadChart({
  weeks,
  displayedMonth,
  weeklyLoadSummary,
  isLoading,
  hasScheduledActivities,
}: CalendarWeeklyLoadChartProps) {
  const targetMonth = displayedMonth.getMonth();
  const targetYear = displayedMonth.getFullYear();
  const dateFnsLocale = getDateFnsLocale(getLocale());

  const chartData = useMemo<ChartWeekRow[]>(() => {
    const seen = new Set<string>();
    const rows = weeks
      // `week` holds local calendar days, Monday to Sunday
      .filter((week) =>
        week.some(
          (day) =>
            day.getMonth() === targetMonth && day.getFullYear() === targetYear,
        ),
      )
      .flatMap((week): ChartWeekRow[] => {
        const key = getWeekKey(week[0]);
        if (seen.has(key)) return [];
        seen.add(key);

        const summary = weeklyLoadSummary[key];
        const recommendedMin = summary?.recommendedMin ?? 0;
        const recommendedMax = Math.max(
          recommendedMin,
          summary?.recommendedMax ?? recommendedMin,
        );
        const dayLabel = (day: Date) =>
          format(day, 'd MMM', { locale: dateFnsLocale });

        return [
          {
            weekKey: key,
            weekLabel: dayLabel(week[0]),
            rangeLabel: `${dayLabel(week[0])} – ${dayLabel(week[6])}`,
            actual: summary?.actualLoad ?? 0,
            estimated: summary?.estimatedLoad ?? 0,
            recommendedMin,
            recommendedMax,
            zoneSpan: recommendedMax - recommendedMin,
            tsb: summary?.tsb,
            projected: summary?.formProjected ?? false,
          },
        ];
      });

    // The dashed projection starts from the last week over, so both lines join
    const firstProjected = rows.findIndex((row) => row.projected);
    return rows.map((row, index) => ({
      ...row,
      tsbPast: row.projected ? undefined : row.tsb,
      tsbProjected:
        firstProjected !== -1 && index >= firstProjected - 1
          ? row.tsb
          : undefined,
    }));
  }, [weeks, weeklyLoadSummary, targetMonth, targetYear, dateFnsLocale]);

  const tsbDomain = useMemo(() => {
    const values = chartData.flatMap((row) =>
      row.tsb === undefined ? [] : [row.tsb],
    );
    return [
      Math.floor(Math.min(TSB_OVERREACHING - 10, ...values) / 10) * 10,
      Math.ceil(Math.max(TSB_DETRAINING + 10, ...values) / 10) * 10,
    ] as [number, number];
  }, [chartData]);

  if (!hasScheduledActivities || !weeks?.length) {
    return null;
  }

  const showSkeleton = isLoading && chartData.length === 0;
  const hasForm = chartData.some((row) => row.tsb !== undefined);
  const config = {
    actual: { label: m.done(), color: COLORS.load },
    estimated: { label: m.calendar_chart_still_planned(), color: COLORS.load },
    tsb: { label: 'TSB', color: COLORS.tsb },
  };
  const xAxis = (
    <XAxis
      dataKey="weekLabel"
      tick={{ fontSize: 11 }}
      interval={0}
      tickLine={false}
    />
  );
  const tooltip = (
    <ChartTooltip
      cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
      content={(props) => <WeekTooltip {...props} />}
    />
  );

  return (
    <Card data-weekly-load-chart>
      <CardHeader>
        <CardTitle>{m.weekly_zone_chart_title()}</CardTitle>
        <CardDescription>{m.weekly_zone_chart_description()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showSkeleton ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.weekly_zone_chart_empty()}
          </p>
        ) : (
          <>
            <div className="space-y-3">
              <Legend
                items={[
                  {
                    key: 'actual',
                    label: m.done(),
                    swatch: square(COLORS.load),
                  },
                  {
                    key: 'estimated',
                    label: m.calendar_chart_still_planned(),
                    swatch: square(COLORS.load, 0.35),
                  },
                  {
                    key: 'zone',
                    label: m.recommended_zone_range(),
                    swatch: square(COLORS.zone, 0.3),
                  },
                ]}
              />
              <ChartContainer config={config} className="h-55 w-full">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  {xAxis}
                  <YAxis
                    width={40}
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  {tooltip}
                  <Area
                    type="linear"
                    dataKey="recommendedMin"
                    stackId="zone"
                    stroke="none"
                    fill="transparent"
                    isAnimationActive={false}
                    activeDot={false}
                  />
                  <Area
                    type="linear"
                    dataKey="zoneSpan"
                    stackId="zone"
                    stroke="none"
                    fill={COLORS.zone}
                    fillOpacity={0.15}
                    isAnimationActive={false}
                    activeDot={false}
                  />
                  <Bar
                    dataKey="actual"
                    stackId="load"
                    fill={COLORS.load}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="estimated"
                    stackId="load"
                    fill={COLORS.load}
                    fillOpacity={0.35}
                    stroke="var(--background)"
                    strokeWidth={2}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>

            {hasForm && (
              <div className="space-y-3" data-weekly-form-chart>
                <Legend
                  items={[
                    { key: 'tsb', label: 'TSB', swatch: stroke(COLORS.tsb) },
                    {
                      key: 'projected',
                      label: m.calendar_chart_tsb_projected(),
                      swatch: stroke(COLORS.tsb, true),
                    },
                    ...TSB_ZONES.map((zone) => ({
                      key: zone.key,
                      label: formStatusLabel[zone.key](),
                      swatch: square(zone.color, 0.25),
                    })),
                  ]}
                />
                <ChartContainer config={config} className="h-40 w-full">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    {/* A flat bar gives this chart the band scale of the load
                        chart above, so each week sits at the same x */}
                    <Bar
                      dataKey={() => 0}
                      legendType="none"
                      isAnimationActive={false}
                    />
                    <ReferenceArea
                      y1={tsbDomain[0]}
                      y2={TSB_OVERREACHING}
                      fill={TSB_ZONES[0].color}
                      fillOpacity={0.08}
                      ifOverflow="hidden"
                    />
                    <ReferenceArea
                      y1={TSB_OVERREACHING}
                      y2={TSB_DETRAINING}
                      fill={TSB_ZONES[1].color}
                      fillOpacity={0.08}
                      ifOverflow="hidden"
                    />
                    <ReferenceArea
                      y1={TSB_DETRAINING}
                      y2={tsbDomain[1]}
                      fill={TSB_ZONES[2].color}
                      fillOpacity={0.08}
                      ifOverflow="hidden"
                    />
                    <ReferenceLine y={0} stroke="var(--border)" />
                    {xAxis}
                    <YAxis
                      width={40}
                      tick={{ fontSize: 11 }}
                      domain={tsbDomain}
                      ticks={[
                        tsbDomain[0],
                        TSB_OVERREACHING,
                        0,
                        TSB_DETRAINING,
                      ]}
                      axisLine={false}
                      tickLine={false}
                    />
                    {tooltip}
                    <Line
                      type="linear"
                      dataKey="tsbPast"
                      stroke={COLORS.tsb}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="linear"
                      dataKey="tsbProjected"
                      stroke={COLORS.tsb}
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ChartContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
