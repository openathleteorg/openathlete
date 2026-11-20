import { getLocale } from '@/paraglide/runtime';

/** "20 Dec": the day an early access ends, in the app's language */
export function formatFeatureDay(day: string): string {
  return new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`));
}
