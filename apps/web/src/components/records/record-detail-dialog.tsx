import { useGetRecordEffortsQuery } from '@/api/record';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
} from 'recharts';

import {
  CreateRecordExclusionDto,
  RecordEffortDto,
  SPORT_TYPE,
} from '@openathlete/shared';

import { recordProgress } from './record-history';
import {
  RecordMetric,
  formatRecordPosition,
  formatRecordValue,
} from './record-metrics';

const EFFORTS_SHOWN = 6;

interface P {
  metric: RecordMetric;
  sport: SPORT_TYPE;
  position: number;
  athleteId?: number;
  dateFormat: Intl.DateTimeFormat;
  onClose: () => void;
  onExclude: (exclusion: CreateRecordExclusionDto) => void;
  onRestore: (exclusionId: number) => void;
  onOpenActivity: (eventId: number) => void;
}

function ProgressChart({
  metric,
  sport,
  efforts,
}: Pick<P, 'metric' | 'sport'> & { efforts: RecordEffortDto[] }) {
  const data = recordProgress(metric, efforts, sport);
  if (data.length < 2) return null;
  const years = [
    ...new Set(data.map((point) => new Date(point.time).getUTCFullYear())),
  ];
  return (
    <ChartContainer
      config={{ best: { label: m.records_record(), color: 'var(--chart-1)' } }}
      className="h-[170px] w-full shrink-0"
    >
      <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          domain={['dataMin', 'dataMax']}
          ticks={years.map((year) => Date.UTC(year, 0, 1))}
          allowDataOverflow
          tick={{ fontSize: 11 }}
          tickFormatter={(time: number) => `${new Date(time).getUTCFullYear()}`}
        />
        <YAxis
          width={48}
          domain={['auto', 'auto']}
          tick={{ fontSize: 11 }}
          tickFormatter={(value: number) => metric.format(value, sport)}
        />
        <Scatter dataKey="value" fill="var(--muted-foreground)" r={2} />
        <Line
          dataKey="best"
          type="stepAfter"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

/** One record: how it progressed, the efforts behind it, what to set aside. */
export function RecordDetailDialog({
  metric,
  sport,
  position,
  athleteId,
  dateFormat,
  onClose,
  onExclude,
  onRestore,
  onOpenActivity,
}: P) {
  const axis =
    metric.axis === 'distance'
      ? { distance: position }
      : { duration: position };
  const { data: efforts } = useGetRecordEffortsQuery({
    sport,
    athleteId,
    type: metric.type,
    ...axis,
  });
  const [picked, setPicked] = useState<number | null>(null);
  const title = `${metric.title(sport)} · ${formatRecordPosition(metric, position)}`;

  const eligible = efforts?.filter((effort) => effort.exclusionId === null);
  const record = eligible?.[0];
  const shown = new Set(eligible?.slice(0, EFFORTS_SHOWN));
  // Excluded efforts stay listed: this is where they come back from
  const listed = efforts?.filter(
    (effort) => effort.exclusionId !== null || shown.has(effort),
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {record
            ? `${dateFormat.format(new Date(record.date))} · ${record.activityName ?? ''}`
            : m.records_help()}
        </DialogDescription>
        {!efforts ? (
          <Skeleton className="h-[170px] w-full" />
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            <ProgressChart metric={metric} sport={sport} efforts={efforts} />
            <h3 className="text-sm font-semibold">
              {m.records_best_efforts()}
            </h3>
            <ol className="flex flex-col">
              {listed?.map((effort) => {
                const excluded = effort.exclusionId !== null;
                const open = picked === effort.recordId;
                const { value, unit } = formatRecordValue(
                  metric,
                  effort,
                  sport,
                );
                return (
                  <li
                    key={effort.recordId}
                    data-record-effort
                    className="border-b py-2 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={cn(
                          'min-h-11 min-w-0 flex-1 text-left cursor-pointer group',
                          excluded && 'opacity-50',
                        )}
                        title={m.records_open_activity()}
                        onClick={() =>
                          effort.eventId && onOpenActivity(effort.eventId)
                        }
                      >
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums',
                            excluded && 'line-through',
                          )}
                        >
                          {value}
                        </span>{' '}
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {unit}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground group-hover:underline">
                          {dateFormat.format(new Date(effort.date))}
                          {effort.activityName && <> · {effort.activityName}</>}
                        </span>
                      </button>
                      {excluded ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRestore(effort.exclusionId!)}
                        >
                          {m.records_restore()}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-expanded={open}
                          onClick={() =>
                            setPicked(open ? null : effort.recordId)
                          }
                        >
                          {m.records_exclude()}
                        </Button>
                      )}
                    </div>
                    {open && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        {[
                          {
                            label: m.records_exclude_effort(),
                            help: title,
                            scope: { type: metric.type, ...axis },
                          },
                          {
                            label: m.records_exclude_metric({
                              metric: metric.title(sport),
                            }),
                            help: m.records_exclude_metric_help(),
                            scope: { type: metric.type },
                          },
                          {
                            label: m.records_exclude_activity(),
                            help: m.records_exclude_activity_help(),
                            scope: {},
                          },
                        ].map(({ label, help, scope }) => (
                          <button
                            key={label}
                            type="button"
                            className="min-h-11 rounded-md border px-3 py-1.5 text-left text-sm cursor-pointer hover:bg-accent"
                            onClick={() => {
                              setPicked(null);
                              onExclude({
                                eventActivityId: effort.eventActivityId,
                                ...scope,
                              });
                            }}
                          >
                            {label}
                            <span className="block text-xs text-muted-foreground">
                              {help}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
