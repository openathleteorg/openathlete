import { localizeDatePattern } from '@/utils/locales';
import { format, parseISO } from 'date-fns';
import type { Locale } from 'date-fns';

import { StatisticsGranularity } from '@openathlete/shared';

/** A bucket on an axis: short, as many of them share the width */
export function bucketTick(
  period: string,
  granularity: StatisticsGranularity,
  locale: Locale,
): string {
  // A local date: parseISO reads it at local midnight
  return format(
    parseISO(period),
    localizeDatePattern(
      granularity === 'month' ? 'MMM yy' : 'd MMM',
      locale.code ?? '',
    ),
    {
      locale,
    },
  );
}

/** A bucket in a tooltip, in full */
export function bucketLabel(
  period: string,
  granularity: StatisticsGranularity,
  locale: Locale,
): string {
  return format(
    parseISO(period),
    localizeDatePattern(
      granularity === 'month' ? 'MMMM yyyy' : 'd MMMM yyyy',
      locale.code ?? '',
    ),
    { locale },
  );
}
