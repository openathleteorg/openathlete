import {
  useTrainingCheckHistoryQuery,
  useTrainingCheckQuery,
} from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { ReactNode } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  XAxis,
  YAxis,
} from 'recharts';

import {
  CHECK_WINDOW_DAYS,
  TrainingCheckHistoryDto,
} from '@openathlete/shared';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { SkeletonChart } from '../ui/skeleton';
import { TrainingCheckCard } from './training-check-card';
import { formatRunPace } from './training-check-look';

const DAY_MS = 24 * 3600 * 1000;
const COLOR = 'var(--chart-2)';
const SECOND = 'var(--chart-4)';
/** Days named under each chart */
const TICKS = 7;

/** A calendar day as a moment on a time axis */
const at = (date: string) => new Date(`${date}T00:00:00Z`).getTime();

interface Series {
  key: string;
  label: string;
  kind: 'line' | 'dots' | 'bars';
  color?: string;
  /** On the right axis, when two units share a chart */
  right?: boolean;
  format: (value: number) => string;
}

/**
 * One figure of the check over half a year. The last six weeks are tinted,
 * the six before them shaded: the two windows the answer compares.
 */
function Course({
  title,
  empty,
  points,
  series,
  history,
  zero,
  children,
}: {
  title: string;
  empty: string;
  points: Record<string, number | null>[];
  series: Series[];
  history: TrainingCheckHistoryDto;
  /** A line at zero, for figures read against the usual */
  zero?: boolean;
  children?: ReactNode;
}) {
  const locale = getLocale();
  const day = new Intl.DateTimeFormat(getDateLocale(locale), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const from = history.from.getTime();
  const to = history.to.getTime();
  const ticks = Array.from(
    { length: TICKS },
    (_, index) => from + ((to - from) * index) / (TICKS - 1),
  );
  const split = to - CHECK_WINDOW_DAYS * DAY_MS;
  const before = split - CHECK_WINDOW_DAYS * DAY_MS;
  const filled = points.filter((point) =>
    series.some(({ key }) => point[key] !== null && point[key] !== undefined),
  );
  const labels = Object.fromEntries(series.map((item) => [item.key, item]));
  const right = series.some((item) => item.right);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {filled.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {empty}
          </p>
        ) : (
          <ChartContainer
            config={Object.fromEntries(
              series.map((item) => [
                item.key,
                { label: item.label, color: item.color ?? COLOR },
              ]),
            )}
            className="h-[200px] w-full"
          >
            <ComposedChart
              data={filled}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="x"
                type="number"
                scale="time"
                domain={[from, to]}
                // The same days under every chart, whatever its points
                ticks={ticks}
                tickFormatter={(x: number) => day.format(new Date(x))}
                tick={{ fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                yAxisId="left"
                width={48}
                domain={['auto', 'auto']}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => series[0].format(value)}
              />
              {right && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  width={40}
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                  tickFormatter={(value: number) =>
                    series.find((item) => item.right)!.format(value)
                  }
                />
              )}
              <ReferenceArea
                yAxisId="left"
                x1={before}
                x2={split}
                fill="var(--muted-foreground)"
                fillOpacity={0.06}
              />
              <ReferenceArea
                yAxisId="left"
                x1={split}
                x2={to}
                fill={COLOR}
                fillOpacity={0.1}
              />
              {zero && (
                <ReferenceLine
                  yAxisId="left"
                  y={0}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                />
              )}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload;
                      return point ? day.format(new Date(point.x)) : '';
                    }}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                        {labels[String(name)]?.label ?? String(name)}
                        <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                          {labels[String(name)]?.format(Number(value)) ??
                            String(value)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              {series.map((item) => {
                const shared = {
                  key: item.key,
                  dataKey: item.key,
                  yAxisId: item.right ? 'right' : 'left',
                  isAnimationActive: false,
                };
                const color = item.color ?? COLOR;
                if (item.kind === 'bars') {
                  return <Bar {...shared} fill={color} fillOpacity={0.5} />;
                }
                if (item.kind === 'dots') {
                  return <Scatter {...shared} fill={color} fillOpacity={0.6} />;
                }
                return (
                  <Line
                    {...shared}
                    type="linear"
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                );
              })}
            </ComposedChart>
          </ChartContainer>
        )}
        {series.length > 1 && filled.length > 0 && (
          // Two measures on one chart: which line is which, and its axis
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {series.map((item) => (
              <li key={item.key} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ background: item.color ?? COLOR }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        )}
        {children && (
          <p className="text-xs text-muted-foreground">{children}</p>
        )}
      </CardContent>
    </Card>
  );
}

const number = (value: number, digits = 0) =>
  new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: digits,
  }).format(value);

/**
 * The training check with the course of its figures over half a year, for
 * those who want to see what an answer rests on.
 */
export function TrainingCheckSection({ athleteId }: { athleteId: number }) {
  const { data: check } = useTrainingCheckQuery(athleteId);
  const { data: history } = useTrainingCheckHistoryQuery(athleteId);
  if (!history) return <SkeletonChart className="h-[400px] rounded-xl" />;

  // Critical speed where the model holds, as the check reads it; else power
  const onSpeed =
    check?.speed.kind === 'speed' ||
    (check?.speed.kind !== 'power' &&
      history.speed.some((point) => point.speed !== null));
  const load =
    history.fitness.reference === null
      ? ''
      : history.fitness.basis === 'POWER'
        ? `${number(history.fitness.reference)} W`
        : formatRunPace(history.fitness.reference);
  const beats = (value: number) => number(value, 1);
  const percent = (value: number) => `${number(value, 1)} %`;

  return (
    <div className="space-y-4" data-training-check-history>
      <TrainingCheckCard athleteId={athleteId} link={false} />
      <p className="text-xs text-muted-foreground">
        {m.check_history_windows()}
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Course
          title={m.check_fitness_question()}
          empty={m.check_history_empty()}
          history={history}
          zero
          points={history.fitness.runs.map(({ date, value }) => ({
            x: at(date),
            fitness: value,
          }))}
          series={[
            {
              key: 'fitness',
              label: m.check_history_fitness(),
              kind: 'dots',
              format: beats,
            },
          ]}
        >
          {m.check_history_fitness_note({ load })}
        </Course>
        <Course
          title={m.check_speed_question()}
          empty={m.check_history_empty()}
          history={history}
          points={history.speed.map((point) => ({
            x: at(point.date),
            speed: onSpeed ? point.speed : point.power,
          }))}
          series={[
            {
              key: 'speed',
              label: onSpeed
                ? m.statistics_critical_speed()
                : m.statistics_critical_power(),
              kind: 'line',
              format: onSpeed
                ? (value) => formatRunPace(value)
                : (value) => `${number(value)} W`,
            },
          ]}
        >
          {m.check_history_speed_note()}
        </Course>
        <Course
          title={m.check_durability_question()}
          empty={m.check_history_empty()}
          history={history}
          points={history.durability.map(({ date, value }) => ({
            x: at(date),
            durability: value,
          }))}
          series={[
            {
              key: 'durability',
              label: m.statistics_decoupling(),
              kind: 'dots',
              format: percent,
            },
          ]}
        >
          {m.check_history_durability_note()}
        </Course>
        <Course
          title={m.check_recovery_question()}
          empty={m.check_history_empty()}
          history={history}
          points={history.recovery.map((week) => ({
            x: at(week.date),
            variability: week.variability,
            restingHeartrate: week.restingHeartrate,
          }))}
          series={[
            {
              key: 'variability',
              label: m.check_history_hrv(),
              kind: 'line',
              format: (value) => `${number(value)} ms`,
            },
            {
              key: 'restingHeartrate',
              label: m.check_history_rhr(),
              kind: 'line',
              color: SECOND,
              right: true,
              format: (value) => number(value),
            },
          ]}
        >
          {m.check_history_recovery_note()}
        </Course>
        <Course
          title={m.check_design_question()}
          empty={m.check_history_empty()}
          history={history}
          points={history.design.map((week) => ({
            x: at(week.date),
            hours: week.hours,
          }))}
          series={[
            {
              key: 'hours',
              label: m.check_history_hours(),
              kind: 'bars',
              format: (value) => `${number(value, 1)} h`,
            },
          ]}
        >
          {m.check_history_design_note()}
        </Course>
      </div>
    </div>
  );
}
