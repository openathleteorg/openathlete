import { AthleteMetric } from '@/api/metric';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { SectionLabel } from '@/components/ui/section-label';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { getMetricUnit } from '@/utils/metric-unit';
import { cn } from '@/utils/shadcn';
import { ArrowDown, ArrowUp, ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { METRIC_TYPE, metricsByCategory } from '@openathlete/shared';

import {
  MetricAnalysis,
  analyzeMetric,
  formatMetricValue,
  hasOwnUnit,
  toMetricDay,
} from './metric-stats';
import {
  isMetricOutdated,
  metricCategories,
  useMetricDateLabel,
} from './metric-utils';

const SPARK_WIDTH = 72;
const SPARK_HEIGHT = 26;
const SPARK_VALUES = 30;

function Sparkline({ analysis }: { analysis: MetricAnalysis }) {
  const source = analysis.baseline ? analysis.trend : analysis.points;
  const points = source.slice(-SPARK_VALUES);
  if (points.length < 2) return <span aria-hidden className="w-[72px]" />;

  const values = points.map((point) => point.value);
  const low = Math.min(...values);
  const span = Math.max(...values) - low || 1;
  const coordinates = points.map((point, index) => ({
    x: 3 + (index / (points.length - 1)) * (SPARK_WIDTH - 6),
    y: 3 + (1 - (point.value - low) / span) * (SPARK_HEIGHT - 6),
  }));
  const end = coordinates[coordinates.length - 1];

  return (
    <svg
      width={SPARK_WIDTH}
      height={SPARK_HEIGHT}
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      aria-hidden
      className="shrink-0"
    >
      <path
        d={coordinates
          .map(({ x, y }, index) => `${index ? 'L' : 'M'}${x} ${y}`)
          .join('')}
        fill="none"
        stroke="var(--chart-2)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={end.x} cy={end.y} r="2.5" fill="var(--chart-2)" />
    </svg>
  );
}

interface RowProps {
  type: METRIC_TYPE;
  history: AthleteMetric[];
  selected: boolean;
  onSelect: (type: METRIC_TYPE) => void;
}

function MetricRow({ type, history, selected, onSelect }: RowProps) {
  const dateLabel = useMetricDateLabel();
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
  const { last, deltaPercent } = analysis;
  const delta = deltaPercent === null ? null : Math.round(deltaPercent);

  return (
    <button
      type="button"
      data-metric-row={type}
      aria-current={selected || undefined}
      onClick={() => onSelect(type)}
      className={cn(
        'grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto_5.5rem] items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-muted',
        selected && 'bg-muted',
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          {metricTypeLabelMap[type]}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {last ? dateLabel(last.day) : m.metrics_no_value_yet()}
          {last && isMetricOutdated(last.day)
            ? ` · ${m.metrics_outdated_badge()}`
            : ''}
        </span>
      </span>
      <Sparkline analysis={analysis} />
      <span className="flex flex-col items-end tabular-nums">
        {last ? (
          <span className="whitespace-nowrap text-[15px] font-semibold">
            {formatMetricValue(type, last.value)}
            {!hasOwnUnit(type) && (
              <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                {getMetricUnit(type)}
              </span>
            )}
          </span>
        ) : null}
        {delta !== null && (
          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
            {delta > 0 && <ArrowUp className="size-3" aria-hidden />}
            {delta < 0 && <ArrowDown className="size-3" aria-hidden />}
            {delta > 0 ? '+' : ''}
            {delta} %
          </span>
        )}
      </span>
    </button>
  );
}

interface P {
  metrics: AthleteMetric[];
  latest: Record<string, AthleteMetric>;
  pinned: METRIC_TYPE[];
  selected: METRIC_TYPE | null;
  onSelect: (type: METRIC_TYPE) => void;
}

export function MetricList({ metrics, latest, pinned, selected, onSelect }: P) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLocaleLowerCase();

  const historyByType = useMemo(() => {
    const byType = new Map<METRIC_TYPE, AthleteMetric[]>();
    // The API sends the most recent first
    for (const metric of [...metrics].reverse()) {
      const type = metric.type;
      byType.set(type, [...(byType.get(type) ?? []), metric]);
    }
    return byType;
  }, [metrics]);

  // An old value stays in `latest` even when out of the recent window
  const historyOf = (type: METRIC_TYPE) =>
    historyByType.get(type) ?? (latest[type] ? [latest[type]] : []);

  const hasData = (type: METRIC_TYPE) => Boolean(latest[type]);
  const matches = (type: METRIC_TYPE) =>
    !query || metricTypeLabelMap[type].toLocaleLowerCase().includes(query);

  const row = (type: METRIC_TYPE) => (
    <MetricRow
      key={type}
      type={type}
      history={historyOf(type)}
      selected={selected === type}
      onSelect={onSelect}
    />
  );

  const pinnedRows = pinned.filter(matches);
  const groups = metricCategories()
    .map((category) => ({
      ...category,
      types: category.types.filter(
        (type) => hasData(type) && !pinned.includes(type) && matches(type),
      ),
    }))
    .filter((category) => category.types.length > 0);
  const empty = Object.values(metricsByCategory)
    .flat()
    .filter(
      (type) => !hasData(type) && !pinned.includes(type) && matches(type),
    );

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="metric-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={m.metrics_search_placeholder()}
          aria-label={m.metrics_search_placeholder()}
          className="pl-9"
        />
      </div>

      {pinnedRows.length > 0 && (
        <section className="flex flex-col gap-0.5">
          <SectionLabel className="px-3 py-1 text-xs">
            {m.metrics_pinned()}
          </SectionLabel>
          {pinnedRows.map(row)}
        </section>
      )}

      {groups.map((group) => (
        <section key={group.key} className="mt-2 flex flex-col gap-0.5">
          <SectionLabel className="px-3 py-1 text-xs">
            {group.label}
          </SectionLabel>
          {group.types.map(row)}
        </section>
      ))}

      {empty.length > 0 && (
        <Collapsible open={query ? true : undefined} className="mt-2">
          <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted">
            {m.metrics_without_data({ count: empty.length })}
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-0.5">
            {empty.map(row)}
          </CollapsibleContent>
        </Collapsible>
      )}

      {pinnedRows.length === 0 && groups.length === 0 && empty.length === 0 && (
        <p className="px-3 py-6 text-sm text-muted-foreground">
          {m.metrics_no_result()}
        </p>
      )}
    </div>
  );
}
