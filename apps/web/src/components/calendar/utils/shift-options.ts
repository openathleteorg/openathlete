import { m } from '@/paraglide/messages';

/** The offsets offered to shift sessions: a day or a week, either way */
export const SHIFT_OPTIONS = [
  { offsetDays: 1, label: m.calendar_week_shift_day_later },
  { offsetDays: -1, label: m.calendar_week_shift_day_earlier },
  { offsetDays: 7, label: m.calendar_week_shift_week_later },
  { offsetDays: -7, label: m.calendar_week_shift_week_earlier },
];
