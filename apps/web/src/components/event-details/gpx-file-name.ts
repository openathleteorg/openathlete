import { ActivityEvent } from '@openathlete/shared';

/**
 * The name a downloaded activity file gets: the day the athlete sees on the
 * activity, in their time zone, and its name in plain characters.
 */
export function activityFileName(
  event: Pick<ActivityEvent, 'name' | 'startDate'>,
  extension: 'gpx' | 'fit',
): string {
  const name =
    event.name
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'activity';
  const start = new Date(event.startDate);
  const day = [
    start.getFullYear(),
    String(start.getMonth() + 1).padStart(2, '0'),
    String(start.getDate()).padStart(2, '0'),
  ].join('-');
  return `${day}-${name}.${extension}`;
}
