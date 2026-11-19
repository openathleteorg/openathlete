import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { cn } from '@/utils/shadcn';
import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { QUESTION_TYPE, type Question } from '@openathlete/shared';

import { formatAnswer, formatShortDay } from '../answer-format';
import {
  type AnswerPoint,
  SERIES_COLORS,
  dailyMeans,
  optionCounts,
} from './series';

export interface WidgetAthlete {
  athleteId: number;
  name: string;
}

interface P {
  question: Question;
  points: AnswerPoint[];
  /** Several athletes: a line each, or the group's mean past the palette */
  athletes?: WidgetAthlete[];
  /** The span shown, so charts of one page share their dates */
  from: Date;
  to: Date;
}

/** One question's answers over time, drawn as suits its type */
export function QuestionWidget({ question, points, athletes, from, to }: P) {
  return (
    <section className="space-y-3 rounded-lg border p-4" data-question-widget>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium">{question.label}</h3>
        <p className="text-xs text-muted-foreground">
          {m.questionnaire_answer_total({ count: points.length })}
          {question.archivedAt && ` · ${m.questionnaire_question_replaced()}`}
        </p>
      </div>
      {points.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {m.questionnaire_no_answer_yet()}
        </p>
      ) : (
        <WidgetBody
          question={question}
          points={points}
          athletes={athletes}
          from={from}
          to={to}
        />
      )}
    </section>
  );
}

function WidgetBody({ question, points, athletes, from, to }: P) {
  const nameOf = (athleteId: number) =>
    athletes?.find((athlete) => athlete.athleteId === athleteId)?.name;
  switch (question.type) {
    case QUESTION_TYPE.SCALE:
      return (
        <NumberChart
          label={question.label}
          points={points}
          athletes={athletes}
          domain={[question.config.min, question.config.max]}
          from={from}
          to={to}
        />
      );
    case QUESTION_TYPE.NUMBER:
      return (
        <NumberChart
          label={question.label}
          unit={question.config.unit}
          points={points}
          athletes={athletes}
          from={from}
          to={to}
        />
      );
    case QUESTION_TYPE.YES_NO: {
      const yes = points.filter((point) => point.answer.valueNumber === 1);
      return (
        <div className="space-y-2">
          <p className="text-sm">
            {m.questionnaire_yes_count({
              count: yes.length,
              total: points.length,
            })}
          </p>
          <ul className="flex flex-wrap gap-1" aria-label={question.label}>
            {points.map((point) => {
              const isYes = point.answer.valueNumber === 1;
              const who = nameOf(point.athleteId);
              const label = `${formatShortDay(point.date)}${who ? ` · ${who}` : ''} : ${isYes ? m.questionnaire_yes() : m.questionnaire_no()}`;
              return (
                <li
                  key={point.eventId}
                  title={label}
                  aria-label={label}
                  className={cn(
                    'flex size-6 items-center justify-center rounded-sm text-[10px] font-semibold',
                    isYes
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isYes
                    ? m.questionnaire_yes_short()
                    : m.questionnaire_no_short()}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.MULTIPLE_CHOICE: {
      const counts = optionCounts(question.config.options, points);
      return (
        <ul className="space-y-2">
          {counts.map((option) => (
            <li key={option.id} className="grid gap-1">
              <div className="flex justify-between gap-4 text-sm">
                <span>{option.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {option.count} ·{' '}
                  {Math.round((option.count / points.length) * 100)} %
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted" aria-hidden>
                <div
                  className="h-2 rounded-full bg-chart-2"
                  style={{ width: `${(option.count / points.length) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      );
    }
    case QUESTION_TYPE.SHORT_TEXT:
    case QUESTION_TYPE.LONG_TEXT:
      return (
        <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {[...points].reverse().map((point) => {
            const who = nameOf(point.athleteId);
            return (
              <li key={point.eventId} className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  {formatShortDay(point.date)}
                  {who && ` · ${who}`}
                </p>
                <p className="whitespace-pre-wrap text-sm">
                  {formatAnswer(question, point.answer)}
                </p>
              </li>
            );
          })}
        </ul>
      );
  }
}

type Row = { time: number } & Record<string, number | undefined>;

/** Five dates spread over the span, at noon so they read as days */
function timeTicks(from: Date, to: Date, count = 5): number[] {
  // The span ends at midnight after its last day: the ticks stop on that day
  const last = to.getTime() - 86_400_000;
  const step = Math.max(0, last - from.getTime()) / (count - 1);
  return Array.from({ length: count }, (_, index) => {
    const tick = new Date(from.getTime() + step * index);
    tick.setHours(12, 0, 0, 0);
    return tick.getTime();
  });
}

/**
 * A number over time: a line per athlete when the palette has a colour for
 * each, otherwise the group's daily mean.
 */
export function NumberChart({
  label,
  unit,
  points,
  athletes,
  domain,
  from,
  to,
}: {
  label: string;
  unit?: string;
  points: AnswerPoint[];
  athletes?: WidgetAthlete[];
  domain?: [number, number];
  from: Date;
  to: Date;
}) {
  const several = (athletes?.length ?? 0) > 1;
  const perAthlete = several && athletes!.length <= SERIES_COLORS.length;

  const { rows, series } = useMemo(() => {
    if (several && !perAthlete) {
      return {
        rows: dailyMeans(points).map(
          (day) => ({ time: day.date.getTime(), mean: day.value }) as Row,
        ),
        series: [
          {
            key: 'mean',
            name: m.questionnaire_group_mean(),
            color: SERIES_COLORS[0],
          },
        ],
      };
    }
    const keys = perAthlete
      ? athletes!.map((athlete, index) => ({
          key: `a${athlete.athleteId}`,
          athleteId: athlete.athleteId,
          name: athlete.name,
          color: SERIES_COLORS[index],
        }))
      : [
          {
            key: 'value',
            athleteId: undefined,
            name: label,
            color: SERIES_COLORS[0],
          },
        ];
    const rows = points
      .filter((point) => point.answer.valueNumber !== null)
      .map((point) => {
        const key = perAthlete ? `a${point.athleteId}` : 'value';
        return {
          time: point.date.getTime(),
          [key]: point.answer.valueNumber!,
        } as Row;
      });
    return { rows, series: keys };
  }, [points, athletes, several, perAthlete, label]);

  const format = (value: number) =>
    `${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(value)}${unit ? ` ${unit}` : ''}`;

  return (
    <div className="space-y-2">
      {series.length > 1 && (
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1 text-xs"
          aria-label={m.questionnaire_legend()}
        >
          {series.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-full"
                style={{ background: item.color }}
              />
              {item.name}
            </li>
          ))}
        </ul>
      )}
      {several && !perAthlete && (
        <p className="text-xs text-muted-foreground">
          {m.questionnaire_group_mean_hint()}
        </p>
      )}
      <ChartContainer
        config={Object.fromEntries(
          series.map((item) => [
            item.key,
            { label: item.name, color: item.color },
          ]),
        )}
        className="h-[220px] w-full"
        role="img"
        aria-label={m.questionnaire_chart_label({ question: label })}
      >
        <LineChart
          data={rows}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={[from.getTime(), to.getTime()]}
            // A few even dates: one per point would overlap
            ticks={timeTicks(from, to)}
            interval="preserveStartEnd"
            tickFormatter={(time: number) => formatShortDay(new Date(time))}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <YAxis
            type="number"
            domain={domain ?? ['auto', 'auto']}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--border)' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined;
              if (!active || !row) return null;
              return (
                <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-sm">
                  <p className="text-muted-foreground">
                    {formatShortDay(new Date(row.time))}
                  </p>
                  {series
                    .filter((item) => row[item.key] !== undefined)
                    .map((item) => (
                      <p key={item.key} className="tabular-nums">
                        {series.length > 1 && `${item.name} : `}
                        <span className="font-semibold">
                          {format(row[item.key]!)}
                        </span>
                      </p>
                    ))}
                </div>
              );
            }}
          />
          {series.map((item) => (
            <Line
              key={item.key}
              dataKey={item.key}
              name={item.name}
              stroke={item.color}
              strokeWidth={2}
              connectNulls
              dot={{
                r: 3.5,
                fill: item.color,
                stroke: 'var(--background)',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: item.color,
                stroke: 'var(--background)',
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
