import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import { CalendarDayForm } from '@openathlete/shared';

import { wellnessItems } from './utils/wellness';

/**
 * A line under the day: sleep, HRV, resting heart rate, Hooper index and
 * the form the day ends on. Nothing when the day has none of them.
 */
export function CalendarDayWellness({
  form,
}: {
  form: CalendarDayForm | undefined;
}) {
  const items = wellnessItems(form);
  if (!items.length) return null;
  return (
    <ul
      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-1.5 pb-1.5 text-[11px] leading-4 tabular-nums text-muted-foreground"
      aria-label={m.calendar_wellness_title()}
      data-day-wellness
    >
      {items.map(({ key, icon: Icon, text, label, className, dotClass }) => (
        <li
          key={key}
          className={cn('flex items-center gap-0.5', className)}
          title={label}
        >
          {Icon && <Icon aria-hidden className="size-3" />}
          {dotClass && (
            <span
              aria-hidden
              className={cn('size-1.5 rounded-full', dotClass)}
            />
          )}
          <span aria-hidden>{text}</span>
          <span className="sr-only">{label}</span>
        </li>
      ))}
    </ul>
  );
}
