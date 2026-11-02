import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import { format } from 'date-fns';
import { useCallback } from 'react';

import { metricsByCategory } from '@openathlete/shared';

import { metricDayNumber, metricDayToDate, toMetricDay } from './metric-stats';

const OUTDATED_AFTER_DAYS = 180;

export const isMetricOutdated = (day: string) =>
  metricDayNumber(toMetricDay(new Date().toISOString())) -
    metricDayNumber(day) >
  OUTDATED_AFTER_DAYS;

/** Day and month, plus the year once it is not the current one */
export function useMetricDateLabel() {
  return useCallback((day: string) => {
    const date = metricDayToDate(day);
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return format(date, sameYear ? 'd MMM' : 'd MMM yyyy', {
      locale: getDateFnsLocale(getLocale()),
    });
  }, []);
}

export const metricCategories = () => [
  {
    key: 'body',
    label: m.metrics_category_body(),
    types: metricsByCategory.body,
  },
  {
    key: 'sleep',
    label: m.metrics_category_sleep(),
    types: metricsByCategory.sleep,
  },
  {
    key: 'recovery',
    label: m.metrics_category_recovery(),
    types: metricsByCategory.recovery,
  },
  {
    key: 'activity',
    label: m.metrics_category_activity(),
    types: metricsByCategory.activity,
  },
  {
    key: 'performance',
    label: m.performance_physiology(),
    types: metricsByCategory.performance,
  },
];
