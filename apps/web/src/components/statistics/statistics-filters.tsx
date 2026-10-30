import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { getDateLocale } from '@/utils/locales';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { SPORT_TYPE } from '@openathlete/shared';

import { Button } from '../ui/button';
import { DatePicker } from '../ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  STATISTICS_COMPARISONS,
  STATISTICS_PERIODS,
  StatisticsComparison,
  StatisticsPeriodType,
} from './statistics-period';
import { StatisticsFiltersState } from './use-statistics-filters';

const ALL_SPORTS = 'ALL';

const PERIOD_LABELS: Record<StatisticsPeriodType, () => string> = {
  days7: m.last_7_days,
  weeks4: m.statistics_period_weeks4,
  weeks12: m.statistics_period_weeks12,
  months6: m.statistics_period_months6,
  year: m.statistics_period_year,
  months12: m.statistics_period_months12,
  all: m.statistics_period_all,
  custom: m.statistics_period_custom,
};

const COMPARISON_LABELS: Record<StatisticsComparison, () => string> = {
  none: m.statistics_compare_none,
  previous: m.statistics_compare_previous,
  lastYear: m.statistics_compare_last_year,
};

const SECTIONS = [
  { id: 'volume', label: m.statistics_section_volume },
  { id: 'regularity', label: m.statistics_section_regularity },
  { id: 'load', label: m.statistics_section_load },
  { id: 'intensity', label: m.statistics_section_intensity },
  { id: 'performance', label: m.statistics_section_performance },
  { id: 'trends', label: m.statistics_section_trends },
];

const TRIGGER = 'h-11 w-full md:h-9 md:w-auto md:min-w-40';

interface P {
  filters: StatisticsFiltersState;
  sports: SPORT_TYPE[];
}

/** Stays on screen on desktop: on a phone, it would take too much of it. */
export function StatisticsFilters({ filters, sports }: P) {
  const { period, periodType, offset, sport, comparison } = filters;
  const canStep = periodType !== 'all' && periodType !== 'custom';
  const dayAndMonth = (date: Date) =>
    date.toLocaleString(getDateLocale(getLocale()), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div
      data-statistics-filters
      className="z-20 -mx-4 space-y-2 border-b bg-background/95 px-4 py-2 backdrop-blur md:sticky md:top-0 md:-mx-8 md:px-8"
    >
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
        <Select
          value={periodType}
          onValueChange={(value) =>
            filters.setPeriodType(value as StatisticsPeriodType)
          }
        >
          <SelectTrigger
            className={TRIGGER}
            aria-label={m.statistics_period_label()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATISTICS_PERIODS.map((value) => (
              <SelectItem key={value} value={value}>
                {PERIOD_LABELS[value]()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sport ?? ALL_SPORTS}
          onValueChange={(value) =>
            filters.setSport(
              value === ALL_SPORTS ? null : (value as SPORT_TYPE),
            )
          }
        >
          <SelectTrigger className={TRIGGER} aria-label={m.sport()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SPORTS}>
              {m.statistics_all_sports()}
            </SelectItem>
            {sports.map((value) => (
              <SelectItem key={value} value={value}>
                {sportTypeLabelMap[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={comparison}
          onValueChange={(value) =>
            filters.setComparison(value as StatisticsComparison)
          }
        >
          <SelectTrigger
            className={`${TRIGGER} col-span-2 md:col-auto`}
            aria-label={m.statistics_compare_label()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATISTICS_COMPARISONS.map((value) => (
              <SelectItem key={value} value={value}>
                {COMPARISON_LABELS[value]()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="col-span-2 flex items-center justify-between gap-2 md:ml-auto">
          {canStep && (
            <Button
              variant="outline"
              size="icon"
              className="size-11 md:size-9"
              aria-label={m.statistics_previous_period()}
              onClick={() => filters.setOffset(offset - 1)}
            >
              <ChevronLeft />
            </Button>
          )}
          {period && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {dayAndMonth(period.start)} {m.to()} {dayAndMonth(period.end)}
            </span>
          )}
          {canStep && (
            <Button
              variant="outline"
              size="icon"
              className="size-11 md:size-9"
              aria-label={m.statistics_next_period()}
              disabled={offset >= 0}
              onClick={() => filters.setOffset(offset + 1)}
            >
              <ChevronRight />
            </Button>
          )}
        </div>
      </div>
      <nav
        aria-label={m.statistics_sections_label()}
        className="-mx-1 flex gap-1 overflow-x-auto text-sm"
      >
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="flex min-h-11 shrink-0 items-center rounded px-2 text-muted-foreground hover:text-foreground md:min-h-0 md:py-1"
          >
            {label()}
          </a>
        ))}
      </nav>
      {periodType === 'custom' && period && (
        <div className="grid grid-cols-2 gap-2 md:flex">
          <DatePicker
            date={period.start}
            max={period.end}
            className="md:w-56"
            onDateChange={(start) =>
              start && filters.setCustomPeriod({ ...period, start })
            }
          />
          <DatePicker
            date={period.end}
            min={period.start}
            max={new Date()}
            className="md:w-56"
            onDateChange={(end) =>
              end && filters.setCustomPeriod({ ...period, end })
            }
          />
        </div>
      )}
    </div>
  );
}
