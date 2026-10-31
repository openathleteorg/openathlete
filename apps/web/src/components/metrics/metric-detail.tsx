import {
  AthleteMetric,
  useCreateMetricMutation,
  useDeleteMetricMutation,
  useGetMetricHistoryQuery,
  useUpdateMetricMutation,
} from '@/api/metric';
import { Button } from '@/components/ui/button';
import { SkeletonChart } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { getMetricUnit } from '@/utils/metric-unit';
import { cn } from '@/utils/shadcn';
import {
  AlertTriangle,
  Check,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CreateMetricDto, METRIC_TYPE } from '@openathlete/shared';

import { MetricChart } from './metric-chart';
import { MetricForm } from './metric-form';
import {
  MetricAnalysis,
  analyzeMetric,
  formatMetricValue,
  hasOwnUnit,
  toMetricDay,
} from './metric-stats';
import { isMetricOutdated, useMetricDateLabel } from './metric-utils';

const RANGES = [7, 30, 90, 365];
const DEFAULT_RANGE = 30;
const HISTORY_PREVIEW = 5;

function StatusChip({ analysis }: { analysis: MetricAnalysis }) {
  const outdated = analysis.last && isMetricOutdated(analysis.last.day);
  const status = outdated ? 'outdated' : analysis.status;
  if (!status) return null;

  const warns = status === 'worse' || status === 'outdated';
  const Icon = warns ? AlertTriangle : Check;
  const label = {
    better: m.metrics_status_better(),
    worse: m.metrics_status_worse(),
    usual: m.metrics_status_usual(),
    off_range: m.metrics_status_off_range(),
    outdated: m.metrics_status_outdated(),
  }[status];

  return (
    <span
      data-metric-status={status}
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium',
        warns && 'bg-(--event-note)',
        status === 'better' && 'bg-(--event-activity)',
        !warns && status !== 'better' && 'bg-muted text-muted-foreground',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background px-3.5 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

interface EntryProps {
  metric: AthleteMetric;
  hidden: boolean;
  onEdit: () => void;
  athleteId?: number;
}

function HistoryEntry({ metric, hidden, onEdit, athleteId }: EntryProps) {
  const dateLabel = useMetricDateLabel();
  const [confirming, setConfirming] = useState(false);
  const deleteMetric = useDeleteMetricMutation();
  const label = dateLabel(toMetricDay(metric.date));

  const handleDelete = async () => {
    try {
      await deleteMetric.mutateAsync({ id: metric.athleteMetricId, athleteId });
      toast.success(m.metrics_value_deleted());
    } catch {
      toast.error(m.metrics_save_failed());
      setConfirming(false);
    }
  };

  return (
    <li className="flex min-h-11 items-center gap-2 border-t text-sm tabular-nums">
      <span className="flex min-w-0 flex-1 flex-col py-1">
        <span className="text-muted-foreground">{label}</span>
        {metric.notes && (
          <span className="truncate text-xs text-muted-foreground">
            {metric.notes}
          </span>
        )}
      </span>
      {hidden && (
        <span className="text-xs text-muted-foreground">
          {m.metrics_hidden_badge()}
        </span>
      )}
      <span className="font-medium">
        {formatMetricValue(metric.type, metric.value)}
        {!hasOwnUnit(metric.type) && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {getMetricUnit(metric.type)}
          </span>
        )}
      </span>
      {confirming ? (
        <>
          <Button
            variant="destructive"
            size="sm"
            isLoading={deleteMetric.isPending}
            onClick={handleDelete}
          >
            {m.metrics_delete_confirm()}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
          >
            {m.cancel()}
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label={m.metrics_edit_value_label({ date: label })}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={m.metrics_delete_value_label({ date: label })}
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      )}
    </li>
  );
}

interface P {
  type: METRIC_TYPE;
  pinned: boolean;
  onTogglePinned: () => void;
  athleteId?: number;
}

export function MetricDetail({ type, pinned, onTogglePinned, athleteId }: P) {
  const dateLabel = useMetricDateLabel();
  const [days, setDays] = useState(DEFAULT_RANGE);
  const [editing, setEditing] = useState<AthleteMetric | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: history = [], isPending } = useGetMetricHistoryQuery(
    type,
    athleteId,
  );
  const createMetric = useCreateMetricMutation();
  const updateMetric = useUpdateMetricMutation();

  const analysis = useMemo(
    () =>
      analyzeMetric(
        type,
        history.map((metric) => ({
          day: toMetricDay(metric.date),
          value: metric.value,
        })),
      ),
    [type, history],
  );
  const { last, baseline, average7, min, max, hiddenDays } = analysis;
  const label = metricTypeLabelMap[type];
  const unit = hasOwnUnit(type) ? '' : getMetricUnit(type);
  const show = (value: number | null) =>
    value === null ? '—' : formatMetricValue(type, value);

  const newestFirst = useMemo(() => [...history].reverse(), [history]);
  const shown = showAll ? newestFirst : newestFirst.slice(0, HISTORY_PREVIEW);

  const handleSubmit = async ({ value, notes, ...entry }: CreateMetricDto) => {
    try {
      if (editing) {
        await updateMetric.mutateAsync({
          id: editing.athleteMetricId,
          body: { value, notes },
          athleteId,
        });
      } else {
        await createMetric.mutateAsync({
          body: { ...entry, value, notes },
          athleteId,
        });
      }
      toast.success(m.metrics_value_saved());
      setEditing(null);
    } catch {
      toast.error(m.metrics_save_failed());
    }
  };

  return (
    <section
      aria-label={label}
      data-metric-detail={type}
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {/* The full screen dialog already names the metric on a phone */}
          <h2 className="hidden text-sm text-muted-foreground md:block">
            {label}
          </h2>
          {last ? (
            <p className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-[40px] leading-tight font-semibold tracking-tight">
                {show(last.value)}
              </span>
              <span className="text-muted-foreground">{unit}</span>
              <span className="ml-1 text-sm text-muted-foreground">
                {dateLabel(last.day)}
              </span>
            </p>
          ) : (
            !isPending && (
              <p className="text-sm text-muted-foreground">
                {m.metrics_no_value_yet()}
              </p>
            )
          )}
          <StatusChip analysis={analysis} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onTogglePinned}>
            {pinned ? (
              <PinOff className="size-3.5" />
            ) : (
              <Pin className="size-3.5" />
            )}
            {pinned ? m.metrics_unpin() : m.metrics_pin()}
          </Button>
          <div
            role="group"
            aria-label={m.metrics_range_label()}
            className="inline-flex rounded-lg bg-muted p-[3px]"
          >
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={days === range}
                onClick={() => setDays(range)}
                className={cn(
                  'min-h-8 rounded-md px-3 text-[13px] font-medium text-muted-foreground',
                  days === range &&
                    'bg-background font-semibold text-foreground shadow-sm',
                )}
              >
                {range === 365
                  ? m.metrics_range_year()
                  : m.metrics_range_days({ days: range })}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isPending ? (
        <SkeletonChart />
      ) : (
        last && <MetricChart type={type} analysis={analysis} days={days} />
      )}

      {last && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {baseline && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-3.5 rounded-xs bg-chart-2/15" />
                {m.metrics_legend_usual()}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 bg-chart-2" />
                {m.metrics_legend_trend()}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-chart-2/40" />
                {m.metrics_legend_values()}
              </span>
            </>
          )}
          {hiddenDays.size > 0 && (
            <span data-metric-hidden>
              {m.metrics_hidden_values({ count: hiddenDays.size })}
            </span>
          )}
        </div>
      )}

      {last && (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
          <Stat label={m.metrics_average_7()} value={show(average7)} />
          <Stat
            label={m.metrics_usual_range()}
            value={
              baseline
                ? `${show(baseline.low)} – ${show(baseline.high)}`
                : m.metrics_needs_more_values({ count: 14 })
            }
          />
          <Stat label={m.metrics_min()} value={show(min)} />
          <Stat label={m.metrics_max()} value={show(max)} />
        </dl>
      )}

      <div className="flex flex-wrap items-start gap-6">
        {newestFirst.length > 0 && (
          <div className="min-w-0 flex-[3_1_18rem]">
            <h3 className="mb-1.5 text-sm font-semibold">
              {m.metrics_history()}
            </h3>
            <ul>
              {shown.map((metric) => (
                <HistoryEntry
                  key={metric.athleteMetricId}
                  metric={metric}
                  hidden={hiddenDays.has(toMetricDay(metric.date))}
                  onEdit={() => setEditing(metric)}
                  athleteId={athleteId}
                />
              ))}
            </ul>
            {newestFirst.length > HISTORY_PREVIEW && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={() => setShowAll((all) => !all)}
              >
                {showAll
                  ? m.metrics_show_less_history()
                  : m.metrics_show_all_history({ count: newestFirst.length })}
              </Button>
            )}
          </div>
        )}
        <div className="flex min-w-0 flex-[2_1_14rem] flex-col gap-3 rounded-xl bg-muted p-3.5">
          <h3 className="text-sm font-semibold">
            {editing
              ? m.metrics_edit_value({
                  date: dateLabel(toMetricDay(editing.date)),
                })
              : m.metrics_add_value()}
          </h3>
          <MetricForm
            // A new key resets the fields when the entry being edited changes
            key={`${type}-${editing?.athleteMetricId ?? 'new'}`}
            onSubmit={handleSubmit}
            defaultValues={editing ?? { type }}
            hideTypeSelector
            lockDate={Boolean(editing)}
            isLoading={createMetric.isPending || updateMetric.isPending}
          />
          {editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              {m.cancel()}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
