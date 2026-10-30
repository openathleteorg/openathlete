import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import { StatisticsCapacity, StatisticsView } from './use-statistics-filters';

const VIEWS: { id: StatisticsView; label: () => string }[] = [
  { id: 'overview', label: m.statistics_view_overview },
  { id: 'load', label: m.statistics_view_load },
  { id: 'capacities', label: m.statistics_view_capacities },
  { id: 'trends', label: m.statistics_view_trends },
];

interface P<T extends string> {
  items: { id: T; label: () => string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** The second level, inside a view: quieter than the first */
  secondary?: boolean;
}

/** One level of the statistics: it scrolls sideways rather than wrapping */
export function SegmentTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  secondary,
}: P<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'scrollbar-hide flex gap-1 overflow-x-auto',
        !secondary &&
          'sticky top-0 z-10 -mx-4 border-b bg-background px-4 md:static md:mx-0 md:px-0',
      )}
    >
      {items.map(({ id, label: itemLabel }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={id === value}
          onClick={() => onChange(id)}
          className={cn(
            'min-h-11 shrink-0 px-3 text-sm font-medium transition-colors md:min-h-9',
            secondary
              ? cn(
                  'rounded-full',
                  id === value
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              : cn(
                  '-mb-px border-b-2',
                  id === value
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                ),
          )}
        >
          {itemLabel()}
        </button>
      ))}
    </div>
  );
}

interface ViewTabs {
  value: StatisticsView;
  onChange: (view: StatisticsView) => void;
}

export function StatisticsTabs({ value, onChange }: ViewTabs) {
  return (
    <SegmentTabs
      items={VIEWS}
      value={value}
      onChange={onChange}
      label={m.statistics_sections_label()}
    />
  );
}

const CAPACITIES: { id: StatisticsCapacity; label: () => string }[] = [
  { id: 'profile', label: m.statistics_capacity_profile },
  { id: 'terrain', label: m.statistics_capacity_terrain },
  { id: 'endurance', label: m.statistics_capacity_endurance },
  { id: 'physiology', label: m.statistics_capacity_physiology },
  { id: 'performance', label: m.statistics_section_performance },
];

export function CapacityTabs({
  value,
  onChange,
}: {
  value: StatisticsCapacity;
  onChange: (capacity: StatisticsCapacity) => void;
}) {
  return (
    <SegmentTabs
      secondary
      items={CAPACITIES}
      value={value}
      onChange={onChange}
      label={m.statistics_view_capacities()}
    />
  );
}
