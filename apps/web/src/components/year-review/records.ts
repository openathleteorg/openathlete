import { m } from '@/paraglide/messages';

import { YearReviewRecordDto } from '@openathlete/shared';

import { formatClock, formatNumber } from './format';

function duration(seconds: number) {
  if (seconds >= 3600) return `${formatNumber(seconds / 3600)} h`;
  if (seconds >= 60) return `${formatNumber(seconds / 60)} min`;
  return `${formatNumber(seconds)} s`;
}

/** "10 km", "Half marathon", "1,500 m swim", "20 min power" */
export function recordLabel(record: YearReviewRecordDto): string {
  if (record.type === 'POWER') {
    return m.year_review_record_power({ duration: duration(record.duration!) });
  }
  const meters = record.distance!;
  if (record.family === 'SWIM') {
    return m.year_review_record_swim({ distance: formatNumber(meters) });
  }
  if (meters === 21097.5) return m.year_review_record_half();
  if (meters === 42195) return m.year_review_record_marathon();
  return `${formatNumber(meters / 1000, meters % 1000 ? 1 : 0)} km`;
}

export const recordValue = (record: YearReviewRecordDto) =>
  record.type === 'POWER'
    ? `${formatNumber(record.value)} W`
    : formatClock(record.value);

/** How much better than the previous best, or null for a first */
export function recordGain(record: YearReviewRecordDto): string | null {
  if (record.previous === null) return null;
  return record.type === 'POWER'
    ? `+${formatNumber(record.value - record.previous)} W`
    : `−${formatClock(record.previous - record.value)}`;
}
