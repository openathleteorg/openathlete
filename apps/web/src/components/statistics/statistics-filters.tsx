import { useIsMobile } from '@/hooks/use-mobile';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { getDateLocale } from '@/utils/locales';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { SPORT_GROUPS, SPORT_TYPE, SportGroup } from '@openathlete/shared';

import { Button } from '../ui/button';
import { DatePicker } from '../ui/date-picker';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
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
const GROUP_PREFIX = 'group:';

const GROUP_LABELS: Record<SportGroup, () => string> = {
  RUNNING: m.statistics_group_running,
  CYCLING: m.statistics_group_cycling,
  SKIING: m.statistics_group_skiing,
};

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

const TRIGGER = 'h-11 w-full md:h-9 md:w-auto md:min-w-40';

interface P {
  filters: StatisticsFiltersState;
  sports: SPORT_TYPE[];
}

/**
 * Stays on screen on desktop. On a phone a line sums the filters up and opens
 * them in a sheet: they would otherwise take half of the screen.
 */
export function StatisticsFilters({ filters, sports }: P) {
  const { period, periodType, offset, sport, group, comparison } = filters;
  // A group only says something for an athlete with several of its sports
  const groups = (Object.keys(SPORT_GROUPS) as SportGroup[]).filter(
    (key) =>
      SPORT_GROUPS[key].filter((value) => sports.includes(value)).length > 1,
  );
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const canStep = periodType !== 'all' && periodType !== 'custom';
  const dayAndMonth = (date: Date) =>
    date.toLocaleString(getDateLocale(getLocale()), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const sportLabel = sport
    ? sportTypeLabelMap[sport]
    : group
      ? GROUP_LABELS[group]()
      : m.statistics_all_sports();
  const summary = [
    PERIOD_LABELS[periodType](),
    sportLabel,
    ...(comparison === 'none' ? [] : [COMPARISON_LABELS[comparison]()]),
  ].join(' · ');

  const fields = (
    <>
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
          value={sport ?? (group ? `${GROUP_PREFIX}${group}` : ALL_SPORTS)}
          onValueChange={(value) => {
            if (value === ALL_SPORTS) filters.setSport(null);
            else if (value.startsWith(GROUP_PREFIX)) {
              filters.setSport(
                null,
                value.slice(GROUP_PREFIX.length) as SportGroup,
              );
            } else filters.setSport(value as SPORT_TYPE);
          }}
        >
          <SelectTrigger className={TRIGGER} aria-label={m.sport()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SPORTS}>
              {m.statistics_all_sports()}
            </SelectItem>
            {groups.map((value) => (
              <SelectItem key={value} value={`${GROUP_PREFIX}${value}`}>
                {GROUP_LABELS[value]()}
              </SelectItem>
            ))}
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
    </>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          className="h-11 w-full justify-between font-normal"
          data-statistics-filters
          onClick={() => setOpen(true)}
        >
          <span className="truncate">{summary}</span>
          <SlidersHorizontal className="size-4 shrink-0" />
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogTitle>{m.statistics_filters()}</DialogTitle>
            <div className="space-y-2">{fields}</div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div
      data-statistics-filters
      className="z-20 -mx-8 space-y-2 border-b bg-background/95 px-8 py-2 backdrop-blur sticky top-0"
    >
      {fields}
    </div>
  );
}
