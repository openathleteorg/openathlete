import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  SPORT_GROUPS,
  SPORT_TYPE,
  SportGroup,
  endOfDay,
  startOfDay,
} from '@openathlete/shared';

import {
  Period,
  STATISTICS_COMPARISONS,
  STATISTICS_PERIODS,
  StatisticsComparison,
  StatisticsPeriodType,
  comparedPeriod,
  statisticsPeriod,
} from './statistics-period';

const DEFAULT_PERIOD = 'weeks12' satisfies StatisticsPeriodType;

const dateKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

const oneOf = <T extends string>(
  options: readonly T[],
  value: string | null,
  fallback: T,
): T => (options.includes(value as T) ? (value as T) : fallback);

export interface StatisticsFiltersState {
  periodType: StatisticsPeriodType;
  offset: number;
  sport: SPORT_TYPE | null;
  group: SportGroup | null;
  comparison: StatisticsComparison;
  /** Null until the first activity is known, for the whole history */
  period: Period | null;
  compared: Period | null;
  setPeriodType: (type: StatisticsPeriodType) => void;
  setOffset: (offset: number) => void;
  setSport: (sport: SPORT_TYPE | null, group?: SportGroup | null) => void;
  setComparison: (comparison: StatisticsComparison) => void;
  setCustomPeriod: (period: Period) => void;
}

/**
 * Filters live in the URL: a view can be shared with a coach, and survives
 * going to an activity and coming back.
 */
export function useStatisticsFilters(
  firstActivityDate: Date | null | undefined,
): StatisticsFiltersState {
  const [params, setParams] = useSearchParams();
  const periodType = oneOf(
    STATISTICS_PERIODS,
    params.get('period'),
    DEFAULT_PERIOD,
  );
  const offset = Math.min(Number(params.get('offset')) || 0, 0);
  const sportParam = params.get('sport');
  const sport = Object.values(SPORT_TYPE).includes(sportParam as SPORT_TYPE)
    ? (sportParam as SPORT_TYPE)
    : null;
  const groupParam = params.get('group');
  const group =
    !sport && groupParam && groupParam in SPORT_GROUPS
      ? (groupParam as SportGroup)
      : null;
  const comparison = oneOf(
    STATISTICS_COMPARISONS,
    params.get('compare'),
    'none',
  );
  const from = params.get('from');
  const to = params.get('to');
  // A day is enough: the period must not change at each render
  const today = dateKey(new Date());

  const period = useMemo((): Period | null => {
    if (periodType === 'all') {
      if (firstActivityDate === undefined) return null;
      const end = endOfDay(new Date(`${today}T12:00:00`));
      return {
        start: startOfDay(firstActivityDate ?? new Date(`${today}T00:00:00`)),
        end,
      };
    }
    if (periodType === 'custom') {
      const start = from ? new Date(`${from}T00:00:00`) : null;
      const end = to ? new Date(`${to}T12:00:00`) : null;
      if (start && end && !isNaN(+start) && !isNaN(+end) && start < end) {
        return { start, end: endOfDay(end) };
      }
      return statisticsPeriod(DEFAULT_PERIOD);
    }
    return statisticsPeriod(periodType, offset, new Date(`${today}T12:00:00`));
  }, [periodType, offset, from, to, firstActivityDate, today]);

  const update = useCallback(
    (changes: Record<string, string | null>) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  return {
    periodType,
    offset,
    sport,
    group,
    comparison,
    period,
    compared: period && comparedPeriod(period, comparison),
    setPeriodType: (type) =>
      update({
        period: type === DEFAULT_PERIOD ? null : type,
        offset: null,
        ...(type === 'custom' && period
          ? { from: dateKey(period.start), to: dateKey(period.end) }
          : { from: null, to: null }),
      }),
    setOffset: (next) => update({ offset: next === 0 ? null : String(next) }),
    setSport: (next, nextGroup = null) =>
      update({ sport: next, group: nextGroup }),
    setComparison: (next) => update({ compare: next === 'none' ? null : next }),
    setCustomPeriod: ({ start, end }) =>
      update({ period: 'custom', from: dateKey(start), to: dateKey(end) }),
  };
}
