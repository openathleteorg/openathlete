import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ReactNode } from 'react';

import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface P {
  label: string;
  value: string;
  unit?: string;
  /** Beside the label: where the figure comes from */
  info?: ReactNode;
  current: number;
  /** The same figure on the compared period, null without a comparison */
  compared: number | null;
  /** The figure bucket by bucket */
  sparkline?: number[];
  className?: string;
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  if (values.length < 2 || max <= 0) return <div className="h-6" />;
  const points = values
    .map(
      (value, index) =>
        `${(index / (values.length - 1)) * 100},${24 - (value / max) * 22}`,
    )
    .join(' ');
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      className="h-6 w-full text-foreground/70"
      aria-hidden
    >
      <polygon
        points={`0,24 ${points} 100,24`}
        fill="currentColor"
        opacity={0.08}
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Going up is neither good nor bad on its own: no green or red here */
function Delta({ current, compared }: { current: number; compared: number }) {
  if (compared <= 0) return null;
  const delta = Math.round(((current - compared) / compared) * 100);
  const Icon = delta >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs text-muted-foreground tabular-nums"
      title={m.statistics_delta_hint()}
    >
      <Icon className="size-3" />
      {delta > 0 ? '+' : ''}
      {delta}
      {m.percent_symbol()}
    </span>
  );
}

export function StatTile({
  label,
  value,
  unit,
  info,
  current,
  compared,
  sparkline,
  className,
}: P) {
  return (
    <Card data-stat-tile className={cn('gap-0 py-0', className)}>
      <CardContent className="space-y-1 p-4">
        <div className="flex min-h-6 items-center justify-between gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          {info}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-semibold tracking-tight md:text-2xl">
            {value}
            {unit && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {unit}
              </span>
            )}
          </span>
          {compared !== null && <Delta current={current} compared={compared} />}
        </div>
        {sparkline ? <Sparkline values={sparkline} /> : <div className="h-6" />}
      </CardContent>
    </Card>
  );
}

/** Same size as a tile, so the page does not jump when figures arrive */
export function StatTileSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-1 p-4">
        <Skeleton className="my-1 h-4 w-20" />
        <Skeleton className="h-7 w-28 md:h-8" />
        <Skeleton className="h-6 w-full" />
      </CardContent>
    </Card>
  );
}
