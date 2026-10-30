import { useStatisticsDaysQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import { addDays, format, parseISO } from 'date-fns';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  SPORT_TYPE,
  SportGroup,
  StatisticsDaysDto,
  formatDuration,
  getSportConfig,
} from '@openathlete/shared';

import { Card, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { Skeleton, SkeletonChart } from '../ui/skeleton';
import { calendarWeeks, cumulativeRows } from './regularity-data';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';

interface P {
  athleteId: number;
  period: Period | null;
  sport: SPORT_TYPE | null;
  group: SportGroup | null;
}

const LEVELS = [
  'bg-muted',
  'bg-chart-1/25',
  'bg-chart-1/50',
  'bg-chart-1/75',
  'bg-chart-1',
];

function Calendar({
  weeks,
}: {
  weeks: ReturnType<typeof calendarWeeks>['weeks'];
}) {
  const locale = getDateFnsLocale(getLocale());
  return (
    <div className="overflow-x-auto" data-activity-calendar>
      {/* Fills the card; on a phone the year scrolls instead of shrinking */}
      <div className="flex min-w-[720px] gap-[3px]">
        {weeks.map((week, index) => (
          <div key={index} className="flex flex-1 flex-col gap-[3px]">
            {week.map((cell, dayIndex) =>
              cell ? (
                <div
                  key={cell.date}
                  title={m.statistics_day_tooltip({
                    date: format(parseISO(cell.date), 'PP', { locale }),
                    time: formatDuration(cell.movingTime),
                  })}
                  className={`aspect-square w-full rounded-[2px] ${LEVELS[cell.level]}`}
                />
              ) : (
                <div key={dayIndex} className="aspect-square w-full" />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Regularity({
  days,
  year,
  sport,
}: {
  days: StatisticsDaysDto['days'];
  year: number;
  sport: SPORT_TYPE | null;
}) {
  const locale = getDateFnsLocale(getLocale());
  const useDistance = !sport || getSportConfig(sport).showDistance;
  const unit = useDistance ? m.kilometers() : 'h';
  const { weeks, activeWeeks } = calendarWeeks(days, year);
  const activeDays = days.filter(({ date }) =>
    date.startsWith(`${year}-`),
  ).length;
  const rows = cumulativeRows(
    days,
    year,
    (day) => (useDistance ? day.distance / 1000 : day.movingTime / 3600),
    format(new Date(), 'yyyy-MM-dd'),
  );
  const labels = {
    current: String(year),
    previous: String(year - 1),
    projection: m.statistics_cumulative_projection(),
  };
  const colors = {
    current: 'var(--chart-1)',
    previous: 'var(--muted-foreground)',
    projection: 'var(--chart-1)',
  };
  const dayLabel = (day: number) =>
    format(addDays(new Date(year, 0, 1), day), 'd MMM', { locale });

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            {m.statistics_active_days({ days: activeDays, year })} ·{' '}
            {m.statistics_active_weeks({
              weeks: activeWeeks,
              total: weeks.length,
            })}
          </p>
          <Calendar weeks={weeks} />
          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            {m.statistics_calendar_less()}
            {LEVELS.map((level) => (
              <span key={level} className={`size-3 rounded-[2px] ${level}`} />
            ))}
            {m.statistics_calendar_more()}
          </div>
        </CardContent>
      </Card>
      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            {m.statistics_cumulative_title({ unit })}
          </p>
          <ChartContainer
            config={{
              current: { label: labels.current, color: colors.current },
              previous: { label: labels.previous, color: colors.previous },
              projection: {
                label: labels.projection,
                color: colors.projection,
              },
            }}
            className="h-[240px] w-full"
          >
            <LineChart
              data={rows}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={dayLabel}
                tick={{ fontSize: 11 }}
                minTickGap={32}
              />
              <YAxis
                width={48}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => `${Math.round(value)}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const day = payload?.[0]?.payload?.day;
                      return typeof day === 'number' ? dayLabel(day) : '';
                    }}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                        {labels[name as keyof typeof labels]}
                        <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                          {Math.round(Number(value))} {unit}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Line
                dataKey="previous"
                type="linear"
                stroke={colors.previous}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="projection"
                type="linear"
                stroke={colors.projection}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="current"
                type="linear"
                stroke={colors.current}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
          <ul className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            {(['current', 'previous', 'projection'] as const).map((key) => (
              <li key={key} className="flex items-center gap-1.5">
                <span
                  className={`w-4 border-t-2 ${key === 'projection' ? 'border-dashed' : ''}`}
                  style={{ borderColor: colors[key] }}
                />
                {labels[key]}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/** The year as a whole: it does not follow the period, but the year it ends. */
export function RegularitySection({ athleteId, period, sport, group }: P) {
  const year = (period?.end ?? new Date()).getFullYear();
  return (
    <StatSection id="regularity" title={m.statistics_section_regularity()}>
      {(visible) => (
        <RegularityData
          athleteId={athleteId}
          year={year}
          sport={sport}
          group={group}
          visible={visible && !!period}
        />
      )}
    </StatSection>
  );
}

function RegularityData({
  athleteId,
  year,
  sport,
  group,
  visible,
}: {
  athleteId: number;
  year: number;
  sport: SPORT_TYPE | null;
  group: SportGroup | null;
  visible: boolean;
}) {
  const { data } = useStatisticsDaysQuery(
    {
      athleteId,
      from: new Date(year - 1, 0, 1),
      to: new Date(year, 11, 31, 23, 59, 59),
      sport: sport ?? undefined,
      group: group ?? undefined,
    },
    visible,
  );
  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Skeleton className="h-[148px] w-full rounded-xl" />
        <SkeletonChart className="h-[326px] rounded-xl" />
      </div>
    );
  }
  return <Regularity days={data.days} year={year} sport={sport} />;
}
