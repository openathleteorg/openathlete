import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import {
  formStatusDotClass,
  formatForm,
  getFormStatus,
} from '@/utils/training-form';
import { Gauge, Heart, HeartPulse, LucideIcon, Moon } from 'lucide-react';

import { CalendarDayForm, METRIC_TYPE } from '@openathlete/shared';

export type WellnessItem = {
  key: string;
  icon?: LucideIcon;
  text: string;
  label: string;
  className?: string;
  /** A status dot instead of an icon */
  dotClass?: string;
};

/** 7.33 hours as "7h20" */
const formatHours = (hours: number) => {
  const minutes = Math.round(hours * 60);
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
};

/** The day's measurements, in the order athletes check them in the morning */
export function wellnessItems(
  form: CalendarDayForm | undefined,
): WellnessItem[] {
  if (!form) return [];
  const wellness = form.wellness ?? {};
  const items: WellnessItem[] = [];
  const sleep = wellness[METRIC_TYPE.SLEEP_DURATION];
  if (sleep) {
    items.push({
      key: 'sleep',
      icon: Moon,
      text: formatHours(sleep),
      label: m.calendar_wellness_sleep({ value: formatHours(sleep) }),
    });
  }
  const hrv = wellness[METRIC_TYPE.HRV_LAST_NIGHT_AVG];
  if (hrv) {
    items.push({
      key: 'hrv',
      icon: HeartPulse,
      text: String(Math.round(hrv)),
      label: m.calendar_wellness_hrv({ value: Math.round(hrv) }),
    });
  }
  const restingHr = wellness[METRIC_TYPE.HR_REST];
  if (restingHr) {
    items.push({
      key: 'resting-hr',
      icon: Heart,
      text: String(Math.round(restingHr)),
      label: m.calendar_wellness_resting_hr({ value: Math.round(restingHr) }),
    });
  }
  const hooper = wellness[METRIC_TYPE.HOOPER_INDEX];
  if (hooper) {
    items.push({
      key: 'hooper',
      icon: Gauge,
      text: String(Math.round(hooper)),
      label: m.calendar_wellness_hooper({ value: Math.round(hooper) }),
    });
  }
  // Form only once there is training to have a form from
  if (form.ctl > 0 || form.atl > 0) {
    const status = getFormStatus(form.tsb);
    items.push({
      key: 'form',
      text: `TSB ${formatForm(form.tsb)}`,
      label: form.projected
        ? m.calendar_wellness_form_projected({ value: formatForm(form.tsb) })
        : m.calendar_wellness_form({ value: formatForm(form.tsb) }),
      className: cn(form.projected && 'italic'),
      dotClass: formStatusDotClass[status],
    });
  }
  return items;
}
